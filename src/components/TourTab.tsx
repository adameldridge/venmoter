import { useState } from "react";
import { FaPen } from "react-icons/fa";
import type { PromoterWithVenues, VenueWithPromoters } from "../types/venue";
import {
    OUTREACH_STATUSES,
    hasShowDate,
    type ContactLogEntry,
    type Outreach,
    type Tour,
    type TourStop,
} from "../types/tour";
import { buildAttentionItems, findClashes, findOverlaps, latestLogEntry, type AttentionItem } from "../utils/tourInsights";
import ListHeader from "./ListHeader";
import { TourGroup, TourRow, TourTable, type AvailablePromoter, type AvailableVenue, type VenueTag } from "./TourTable";
import { sameCity } from "../utils/city";
import TourCalendar, { type CalendarEntry } from "./TourCalendar";
import NeedsAttention from "./NeedsAttention";
import { useCollapsedGroups } from "../hooks/useCollapsedGroups";
import type { RowKind } from "../hooks/useRowFocus";
import "./TourTab.css";

type TourTabProps = {
    tours: Tour[];
    activeTour: Tour | null;
    stops: TourStop[];
    outreach: Outreach[];
    contactLog: ContactLogEntry[];
    venues: VenueWithPromoters[];
    promoters: PromoterWithVenues[];
    onSelectTour: (tourId: string) => void;
    onNewTour: () => void;
    onEditTour: (tour: Tour) => void;
    onAddStop: () => void;
    onRemoveStop: (stop: TourStop) => void;
    onAddPromoter: (stop: TourStop, promoterId: string) => void;
    onAddVenue: (stop: TourStop, venueId: string) => void;
    onOpenOutreach: (outreach: Outreach, title: string) => void;
    onOpenLog: (outreach: Outreach, title: string) => void;
    onRemoveOutreach: (outreach: Outreach) => void;
    onGoTo: (kind: RowKind, id: string) => void;
};

const NEW_TOUR_OPTION = "__new-tour";

type TourEntry = {
    outreach: Outreach;
    target: VenueWithPromoters | PromoterWithVenues;
};

export default function TourTab({
    tours,
    activeTour,
    stops,
    outreach,
    contactLog,
    venues,
    promoters,
    onSelectTour,
    onNewTour,
    onEditTour,
    onAddStop,
    onRemoveStop,
    onAddPromoter,
    onAddVenue,
    onOpenOutreach,
    onOpenLog,
    onRemoveOutreach,
    onGoTo,
}: TourTabProps) {
    const [cityFilter, setCityFilter] = useState("");
    const { collapsedIds, setCollapsed } = useCollapsedGroups("venmoter.collapsedCities");
    const sortedTours = [...tours].sort((a, b) => a.name.localeCompare(b.name));
    const sortedStops = sortStops(stops, outreach);
    // Falls back to all cities if the selected one was deleted or belongs to another tour.
    const filterStop = sortedStops.find((stop) => stop.id === cityFilter);
    const stopEntries = sortedStops.map((stop) => ({
        stop,
        entries: buildEntries(
            outreach.filter((o) => o.stopId === stop.id),
            venues,
            promoters,
        ),
    }));
    const calendarEntries = buildCalendarEntries(stopEntries);
    const insightInput = activeTour ? { tour: activeTour, stops, outreach, contactLog, venues, promoters } : null;
    const attentionItems = insightInput ? buildAttentionItems(insightInput) : [];
    const clashes = insightInput ? findClashes(insightInput) : [];
    const clashDates = new Set(clashes.map((clash) => clash.date));
    const overlaps = findOverlaps(outreach, venues, promoters);
    const visibleStopEntries = stopEntries
        .filter(({ stop }) => !filterStop || stop.id === filterStop.id)
        .map((stopEntry) => ({ ...stopEntry, contacts: buildContacts(stopEntry.entries) }));

    function cityOf(stopId: string) {
        return stops.find((stop) => stop.id === stopId)?.city ?? "";
    }

    function cardTitle(o: Outreach) {
        const target = o.targetType === "venue"
            ? venues.find((v) => v.id === o.targetId)
            : promoters.find((p) => p.id === o.targetId);
        return `${target?.name ?? ""} – ${cityOf(o.stopId)}`;
    }

    function toVenueTag({ outreach: o, target }: TourEntry, showOutcome: boolean): VenueTag {
        return {
            key: o.id,
            name: target.name,
            status: o.status,
            showDate: o.showDate,
            showOutcome,
            clashMessages: clashes.filter((clash) => clash.outreachId === o.id).map((clash) => clash.message),
            onClick: () => openCard(o),
        };
    }

    function openCard(o: Outreach) {
        onOpenOutreach(o, cardTitle(o));
    }

    function scrollToStop(stopId: string) {
        setCityFilter(stopId);
        setCollapsed(stopId, false);
        document.getElementById("tour-cities")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function handleAttentionSelect(item: AttentionItem) {
        const target = item.outreachId && outreach.find((o) => o.id === item.outreachId);
        if (target) {
            openCard(target);
        } else {
            scrollToStop(item.stopId);
        }
    }

    return (
        <div>
            <div className="tour-top">
                <div className="tour-top-controls">
                    {/* With a tour selected, "New tour" lives in the picker; otherwise it's the only action. */}
                    <ListHeader addLabel="New Tour" onAdd={activeTour ? undefined : onNewTour}>
                        {activeTour && (
                            <div className="filter-group">
                                <select
                                    className="cities-select"
                                    value={activeTour.id}
                                    onChange={(e) => {
                                        if (e.target.value === NEW_TOUR_OPTION) onNewTour();
                                        else onSelectTour(e.target.value);
                                    }}
                                    aria-label="Active tour"
                                >
                                    {sortedTours.map((tour) => (
                                        <option value={tour.id} key={tour.id}>{tour.name}</option>
                                    ))}
                                    <option disabled>──────────</option>
                                    <option value={NEW_TOUR_OPTION}>+ New tour…</option>
                                </select>
                                <button
                                    className="ghost-button tour-edit-button"
                                    type="button"
                                    onClick={() => onEditTour(activeTour)}
                                    aria-label="Edit tour"
                                    title="Edit tour"
                                >
                                    <FaPen />
                                </button>
                            </div>
                        )}
                    </ListHeader>
                </div>

                {activeTour && (
                    <div className="tour-top-calendar">
                        <TourCalendar
                            tour={activeTour}
                            entries={calendarEntries}
                            clashDates={clashDates}
                            onSelectStop={scrollToStop}
                        />
                    </div>
                )}
            </div>

            {!activeTour ? (
                <div className="tour-empty">
                    No tours yet. Create one to start tracking who you've contacted.
                </div>
            ) : (
                <>
                    <NeedsAttention items={attentionItems} onSelect={handleAttentionSelect} />

                    <div className="tour-section-header" id="tour-cities">
                        <h2 className="tour-section-title">
                            Cities
                            {stops.length > 0 && (
                                <span className="tour-section-subtitle">
                                    {stops.length} {stops.length === 1 ? "city" : "cities"}
                                </span>
                            )}
                        </h2>
                        {stops.length > 0 && (
                            <select
                                className="cities-select"
                                value={filterStop?.id ?? ""}
                                onChange={(e) => setCityFilter(e.target.value)}
                                aria-label="Filter by city"
                            >
                                <option value="">All cities</option>
                                {sortedStops.map((stop) => (
                                    <option value={stop.id} key={stop.id}>{stop.city}</option>
                                ))}
                            </select>
                        )}
                        <button className="create-button" type="button" onClick={onAddStop}>
                            Add City
                        </button>
                    </div>

                    {stops.length === 0 && (
                        <div className="tour-empty">
                            No cities yet. Add the cities you want to play, then fill each one with venues and promoters.
                        </div>
                    )}

                    {stops.length > 0 && (
                        <>
                            <TourTable>
                                {visibleStopEntries.map(({ stop, entries, contacts }) => (
                                    <TourGroup
                                        key={stop.id}
                                        city={stop.city}
                                        confirmedVenues={entries
                                            .filter((e) => e.outreach.targetType === "venue" && e.outreach.status === "confirmed")
                                            .map((e) => toVenueTag(e, true))}
                                        count={entries.length}
                                        confirmed={isConfirmed(entries)}
                                        // A city with a confirmed show is sorted; no more suggestions.
                                        availablePromoters={isConfirmed(entries) ? [] : availablePromoters(entries)}
                                        availableVenues={isConfirmed(entries) ? [] : availableVenues(stop, entries, venues)}
                                        collapsed={collapsedIds.has(stop.id)}
                                        onToggle={() => setCollapsed(stop.id, !collapsedIds.has(stop.id))}
                                        onAddPromoter={(promoterId) => onAddPromoter(stop, promoterId)}
                                        onAddVenue={(venueId) => onAddVenue(stop, venueId)}
                                        onRemove={() => onRemoveStop(stop)}
                                    >
                                        {contacts.map(({ outreach: o, target, venues: venueEntries, noPromoters }) => (
                                            <TourRow
                                                key={o.id}
                                                outreach={o}
                                                target={target}
                                                venues={venueEntries.map((venue) => toVenueTag(venue, false))}
                                                inHouse={isInHouse(target)}
                                                noPromoters={noPromoters}
                                                overlapMessages={overlaps
                                                    .filter((overlap) => overlap.outreachId === o.id)
                                                    .map((overlap) => overlap.message)}
                                                latestContact={latestLogEntry(o.id, contactLog)}
                                                viaPromoterName={promoters.find((p) => p.id === o.viaPromoterId)?.name}
                                                clashMessages={clashes
                                                    .filter((clash) => clash.outreachId === o.id)
                                                    .map((clash) => clash.message)}
                                                onUpdate={() => openCard(o)}
                                                onOpenLog={() => onOpenLog(o, cardTitle(o))}
                                                onRemove={() => onRemoveOutreach(o)}
                                                onGoToTarget={() => onGoTo(o.targetType, o.targetId)}
                                            />
                                        ))}
                                    </TourGroup>
                                ))}
                            </TourTable>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

const statusOrder = OUTREACH_STATUSES.map((status) => status.value);

function isInHouse(target: TourEntry["target"]) {
    return "managesInHouse" in target && !!target.managesInHouse;
}

type Contact = TourEntry & {
    venues: TourEntry[];
    noPromoters: boolean;
};

// Each city lists who you actually contact: promoters, in-house venues, and any other venue
// none of whose promoters are on the list, since then the venue itself is the way in.
// Promoters carry tags for the listed venues they work with (in-house ones included, so the
// link is visible even though those venues also have their own row).
function buildContacts(entries: TourEntry[]): Contact[] {
    const worksWith = (venue: TourEntry, promoterId: string) =>
        "promoters" in venue.target && venue.target.promoters.some((p) => p.id === promoterId);
    const listedPromoterIds = entries.filter((e) => e.outreach.targetType === "promoter").map((e) => e.target.id);
    const venueEntries = entries.filter((e) => e.outreach.targetType === "venue");
    const reachedByPromoter = (venue: TourEntry) => listedPromoterIds.some((id) => worksWith(venue, id));
    const tagOnly = venueEntries.filter((venue) => !isInHouse(venue.target) && reachedByPromoter(venue));

    return entries
        .filter((e) => !tagOnly.includes(e))
        .map((e) => {
            if (e.outreach.targetType === "promoter") {
                const venues = venueEntries.filter((venue) => worksWith(venue, e.target.id));
                return { ...e, venues, noPromoters: false };
            }
            // A venue whose promoters exist but aren't added says nothing extra; the city header
            // offers those promoters instead.
            const hasPromoters = "promoters" in e.target && e.target.promoters.length > 0;
            return { ...e, venues: [], noPromoters: !isInHouse(e.target) && !hasPromoters };
        });
}

// Promoters linked to the city's venues that aren't on its list yet.
function isConfirmed(entries: TourEntry[]) {
    return entries.some(({ outreach }) => outreach.status === "confirmed");
}

// Venues in the city that aren't on its list yet.
function availableVenues(stop: TourStop, entries: TourEntry[], venues: VenueWithPromoters[]): AvailableVenue[] {
    const listed = new Set(entries.filter((e) => e.outreach.targetType === "venue").map((e) => e.target.id));
    return venues
        .filter((venue) => sameCity(venue.city, stop.city) && !listed.has(venue.id))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((venue) => ({
            id: venue.id,
            name: venue.name,
            detail: venue.managesInHouse
                ? "In-house"
                : venue.promoters.length > 0 ? `via ${venue.promoters.map((p) => p.name).join(", ")}` : "No promoters",
        }));
}

function availablePromoters(entries: TourEntry[]): AvailablePromoter[] {
    const listed = new Set(entries.filter((e) => e.outreach.targetType === "promoter").map((e) => e.target.id));
    const available = new Map<string, AvailablePromoter>();
    for (const { outreach, target } of entries) {
        if (!("promoters" in target) || outreach.status === "declined") continue;
        for (const promoter of target.promoters.filter((p) => !listed.has(p.id))) {
            const entry = available.get(promoter.id) ?? { id: promoter.id, name: promoter.name, venueNames: [] };
            entry.venueNames.push(target.name);
            available.set(promoter.id, entry);
        }
    }
    return [...available.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// Sorted by pipeline status, then name.
function buildEntries(
    outreach: Outreach[],
    venues: VenueWithPromoters[],
    promoters: PromoterWithVenues[],
): TourEntry[] {
    const entries: TourEntry[] = [];
    for (const o of outreach) {
        const target =
            o.targetType === "venue"
                ? venues.find((v) => v.id === o.targetId)
                : promoters.find((p) => p.id === o.targetId);
        if (target) entries.push({ outreach: o, target });
    }
    return entries.sort(
        (a, b) =>
            statusOrder.indexOf(a.outreach.status) - statusOrder.indexOf(b.outreach.status) ||
            a.target.name.localeCompare(b.target.name),
    );
}

// Venues on hold or confirmed with a show date.
function buildCalendarEntries(stopEntries: { stop: TourStop; entries: TourEntry[] }[]): CalendarEntry[] {
    return stopEntries.flatMap(({ stop, entries }) =>
        entries
            .filter(({ outreach }) => outreach.targetType === "venue" && hasShowDate(outreach.status) && outreach.showDate)
            .map(({ outreach, target }) => ({
                date: outreach.showDate,
                stopId: stop.id,
                city: stop.city,
                venueName: target.name,
                kind: outreach.status === "confirmed" ? ("confirmed" as const) : ("on-hold" as const),
            })),
    );
}

// Cities sort by earliest confirmed date, then earliest hold, then name (undated last).
function sortStops(stops: TourStop[], outreach: Outreach[]) {
    const sortDate = (stop: TourStop) => {
        const dated = outreach.filter(
            (o) => o.stopId === stop.id && o.targetType === "venue" && hasShowDate(o.status) && o.showDate,
        );
        const confirmed = dated.filter((o) => o.status === "confirmed").map((o) => o.showDate).sort();
        return confirmed[0] ?? dated.map((o) => o.showDate).sort()[0] ?? "";
    };
    return [...stops].sort((a, b) => {
        const dateA = sortDate(a);
        const dateB = sortDate(b);
        if (dateA && dateB) return dateA.localeCompare(dateB) || a.city.localeCompare(b.city);
        if (dateA) return -1;
        if (dateB) return 1;
        return a.city.localeCompare(b.city);
    });
}
