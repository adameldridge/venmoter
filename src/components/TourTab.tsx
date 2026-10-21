import type { Promoter, Venue } from "../types/venue";
import {
    OUTREACH_STATUSES,
    hasShowDate,
    type ContactLogEntry,
    type Outreach,
    type Tour,
    type TourStop,
} from "../types/tour";
import { dateRange, formatDate, formatDateRange } from "../utils/date";
import { buildAttentionItems, findClashes, latestLogEntry, type AttentionItem } from "../utils/tourInsights";
import ListHeader from "./ListHeader";
import TourCard from "./TourCard";
import TourCalendar, { type CalendarEntry } from "./TourCalendar";
import NeedsAttention from "./NeedsAttention";
import "./TourTab.css";

type TourTabProps = {
    tours: Tour[];
    activeTour: Tour | null;
    stops: TourStop[];
    outreach: Outreach[];
    contactLog: ContactLogEntry[];
    venues: Venue[];
    promoters: Promoter[];
    onSelectTour: (tourId: string) => void;
    onNewTour: () => void;
    onEditTour: (tour: Tour) => void;
    onAddStop: () => void;
    onEditStop: (stop: TourStop) => void;
    onFillStop: (stop: TourStop) => void;
    onOpenOutreach: (outreach: Outreach, title: string) => void;
    onOpenLog: (outreach: Outreach, title: string) => void;
    onRemoveOutreach: (outreach: Outreach) => void;
};

type TourEntry = {
    outreach: Outreach;
    target: Venue | Promoter;
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
    onEditStop,
    onFillStop,
    onOpenOutreach,
    onOpenLog,
    onRemoveOutreach,
}: TourTabProps) {
    const sortedTours = [...tours].sort((a, b) => a.name.localeCompare(b.name));
    const stopEntries = sortStops(stops, outreach).map((stop) => ({
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

    function cityOf(stopId: string) {
        return stops.find((stop) => stop.id === stopId)?.city ?? "";
    }

    function cardTitle(o: Outreach) {
        const target = o.targetType === "venue"
            ? venues.find((v) => v.id === o.targetId)
            : promoters.find((p) => p.id === o.targetId);
        return `${target?.name ?? ""} – ${cityOf(o.stopId)}`;
    }

    function openCard(o: Outreach) {
        onOpenOutreach(o, cardTitle(o));
    }

    function scrollToStop(stopId: string) {
        const section = document.getElementById(`tour-stop-${stopId}`);
        if (section instanceof HTMLDetailsElement) section.open = true;
        section?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            <ListHeader addLabel="New Tour" onAdd={onNewTour}>
                {activeTour && (
                    <div className="filter-group">
                        <select
                            className="cities-select"
                            value={activeTour.id}
                            onChange={(e) => onSelectTour(e.target.value)}
                            aria-label="Active tour"
                        >
                            {sortedTours.map((tour) => (
                                <option value={tour.id} key={tour.id}>{tour.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </ListHeader>

            {activeTour && (
                <div className="tour-toolbar">
                    {(activeTour.startDate || activeTour.endDate) && (
                        <div className="tour-dates">
                            {formatDateRange(activeTour.startDate, activeTour.endDate)}
                            {activeTour.startDate && activeTour.endDate && (
                                ` · ${dateRange(activeTour.startDate, activeTour.endDate).length} days`
                            )}
                        </div>
                    )}
                    <button className="ghost-button" type="button" onClick={() => onEditTour(activeTour)}>
                        Edit Tour
                    </button>
                </div>
            )}

            {!activeTour ? (
                <div className="tour-empty">
                    No tours yet. Create one to start tracking who you've contacted.
                </div>
            ) : (
                <>
                    <NeedsAttention items={attentionItems} onSelect={handleAttentionSelect} />

                    <TourCalendar
                        tour={activeTour}
                        entries={calendarEntries}
                        clashDates={clashDates}
                        onSelectStop={scrollToStop}
                    />

                    <div className="tour-section-header">
                        <h2 className="tour-section-title">
                            Cities
                            {stops.length > 0 && (
                                <span className="tour-section-subtitle">
                                    {stops.length} {stops.length === 1 ? "city" : "cities"}
                                </span>
                            )}
                        </h2>
                        <button className="create-button" type="button" onClick={onAddStop}>
                            Add City
                        </button>
                    </div>

                    {stops.length === 0 && (
                        <div className="tour-empty">
                            No cities yet. Add the cities you want to play, then fill each one with venues and promoters.
                        </div>
                    )}

                    {stopEntries.map(({ stop, entries }) => {
                        const confirmed = entries.filter(({ outreach }) => outreach.status === "confirmed");
                        const onHold = entries.filter(({ outreach }) => outreach.status === "on-hold");

                        return (
                            <details key={stop.id} id={`tour-stop-${stop.id}`} open>
                                <summary className="city-heading">
                                    {stop.city}
                                    {confirmed.length > 0 ? (
                                        <span className="tour-stop-date">
                                            {confirmed.map(({ outreach }) => formatDate(outreach.showDate)).join(", ")}
                                        </span>
                                    ) : (
                                        onHold.length > 0 && (
                                            <span className="tour-stop-date">{onHold.length} on hold</span>
                                        )
                                    )}
                                    <span className="tour-group-count">{entries.length}</span>
                                </summary>

                                <div className="tour-stop-actions">
                                    <button className="ghost-button" type="button" onClick={() => onFillStop(stop)}>
                                        Add venues &amp; promoters
                                    </button>
                                    <button className="ghost-button" type="button" onClick={() => onEditStop(stop)}>
                                        Edit City
                                    </button>
                                </div>

                                {entries.length === 0 ? (
                                    <div className="tour-stop-empty">Nothing added yet.</div>
                                ) : (
                                    <div className="card-grid">
                                        {entries.map(({ outreach: o, target }) => (
                                            <TourCard
                                                key={o.id}
                                                outreach={o}
                                                target={target}
                                                latestContact={latestLogEntry(o.id, contactLog)}
                                                viaPromoterName={promoters.find((p) => p.id === o.viaPromoterId)?.name}
                                                clashMessages={clashes
                                                    .filter((clash) => clash.outreachId === o.id)
                                                    .map((clash) => clash.message)}
                                                onUpdate={() => openCard(o)}
                                                onOpenLog={() => onOpenLog(o, cardTitle(o))}
                                                onRemove={() => onRemoveOutreach(o)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </details>
                        );
                    })}
                </>
            )}
        </div>
    );
}

const statusOrder = OUTREACH_STATUSES.map((status) => status.value);

// Sorted by pipeline status, then name.
function buildEntries(outreach: Outreach[], venues: Venue[], promoters: Promoter[]): TourEntry[] {
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
