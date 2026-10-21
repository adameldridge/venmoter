import type { Promoter, Venue } from "../types/venue";
import { OUTREACH_STATUSES, type Hold, type Outreach, type Tour, type TourStop } from "../types/tour";
import { dateRange, formatDate, formatDateRange } from "../utils/date";
import ListHeader from "./ListHeader";
import TourCard from "./TourCard";
import TourCalendar, { type CalendarEntry } from "./TourCalendar";
import StopHolds from "./StopHolds";
import "./TourTab.css";

type TourTabProps = {
    tours: Tour[];
    activeTour: Tour | null;
    stops: TourStop[];
    holds: Hold[];
    outreach: Outreach[];
    venues: Venue[];
    promoters: Promoter[];
    onSelectTour: (tourId: string) => void;
    onNewTour: () => void;
    onEditTour: (tour: Tour) => void;
    onAddStop: () => void;
    onEditStop: (stop: TourStop) => void;
    onFillStop: (stop: TourStop) => void;
    onAddHold: (stop: TourStop) => void;
    onEditHold: (hold: Hold) => void;
    onConfirmHold: (hold: Hold) => void;
    onUnconfirmHold: (hold: Hold) => void;
    onDeleteHold: (hold: Hold) => void;
    onOpenOutreach: (outreach: Outreach, title: string) => void;
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
    holds,
    outreach,
    venues,
    promoters,
    onSelectTour,
    onNewTour,
    onEditTour,
    onAddStop,
    onEditStop,
    onFillStop,
    onAddHold,
    onEditHold,
    onConfirmHold,
    onUnconfirmHold,
    onDeleteHold,
    onOpenOutreach,
    onRemoveOutreach,
}: TourTabProps) {
    const sortedTours = [...tours].sort((a, b) => a.name.localeCompare(b.name));
    const stopEntries = sortStops(stops, holds).map((stop) => ({
        stop,
        holds: holds.filter((h) => h.stopId === stop.id),
        entries: buildEntries(
            outreach.filter((o) => o.stopId === stop.id),
            venues,
            promoters,
        ),
    }));
    const calendarEntries = buildCalendarEntries(stopEntries, venues);

    function scrollToStop(stopId: string) {
        const section = document.getElementById(`tour-stop-${stopId}`);
        if (section instanceof HTMLDetailsElement) section.open = true;
        section?.scrollIntoView({ behavior: "smooth", block: "start" });
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
                    <TourCalendar
                        tour={activeTour}
                        entries={calendarEntries}
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

                    {stopEntries.map(({ stop, holds: stopHolds, entries }) => {
                        const confirmedHold = stopHolds.find((h) => h.status === "confirmed");
                        return (
                            <details key={stop.id} id={`tour-stop-${stop.id}`} open>
                                <summary className="city-heading">
                                    {stop.city}
                                    {confirmedHold ? (
                                        <span className="tour-stop-date">{formatDate(confirmedHold.date)}</span>
                                    ) : (
                                        stopHolds.length > 0 && (
                                            <span className="tour-stop-date">
                                                {stopHolds.length} {stopHolds.length === 1 ? "hold" : "holds"}
                                            </span>
                                        )
                                    )}
                                    <span className="tour-group-count">{entries.length}</span>
                                </summary>

                                <div className="tour-stop-actions">
                                    {!confirmedHold && (
                                        <button className="ghost-button" type="button" onClick={() => onAddHold(stop)}>
                                            Add Hold
                                        </button>
                                    )}
                                    <button className="ghost-button" type="button" onClick={() => onFillStop(stop)}>
                                        Add venues &amp; promoters
                                    </button>
                                    <button className="ghost-button" type="button" onClick={() => onEditStop(stop)}>
                                        Edit City
                                    </button>
                                </div>

                                <StopHolds
                                    holds={stopHolds}
                                    venues={venues}
                                    promoters={promoters}
                                    onEdit={onEditHold}
                                    onConfirm={onConfirmHold}
                                    onUnconfirm={onUnconfirmHold}
                                    onDelete={onDeleteHold}
                                />

                                {entries.length === 0 ? (
                                    <div className="tour-stop-empty">Nothing added yet.</div>
                                ) : (
                                    <div className="card-grid">
                                        {entries.map(({ outreach, target }) => (
                                            <TourCard
                                                key={outreach.id}
                                                outreach={outreach}
                                                target={target}
                                                onUpdate={() => onOpenOutreach(outreach, `${target.name} – ${stop.city}`)}
                                                onRemove={() => onRemoveOutreach(outreach)}
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

// Confirmed holds and confirmed venues/promoters with a show date are "confirmed";
// provisional holds are "provisional". Duplicates on the same city and date are dropped.
function buildCalendarEntries(
    stopEntries: { stop: TourStop; holds: Hold[]; entries: TourEntry[] }[],
    venues: Venue[],
): CalendarEntry[] {
    const calendarEntries: CalendarEntry[] = [];
    for (const { stop, holds, entries } of stopEntries) {
        for (const hold of holds) {
            calendarEntries.push({
                date: hold.date,
                stopId: stop.id,
                city: stop.city,
                venueName: venues.find((v) => v.id === hold.venueId)?.name ?? "",
                kind: hold.status,
            });
        }
        for (const { outreach, target } of entries) {
            if (outreach.status !== "confirmed" || !outreach.showDate) continue;
            const alreadyShown = calendarEntries.some(
                (e) => e.kind === "confirmed" && e.stopId === stop.id && e.date === outreach.showDate,
            );
            if (!alreadyShown) {
                calendarEntries.push({
                    date: outreach.showDate,
                    stopId: stop.id,
                    city: stop.city,
                    venueName: target.name,
                    kind: "confirmed",
                });
            }
        }
    }
    return calendarEntries;
}

// Cities sort by confirmed date, then earliest provisional hold, then name (undated last).
function sortStops(stops: TourStop[], holds: Hold[]) {
    const sortDate = (stop: TourStop) => {
        const stopHolds = holds.filter((h) => h.stopId === stop.id);
        const confirmed = stopHolds.find((h) => h.status === "confirmed");
        return confirmed?.date ?? stopHolds.map((h) => h.date).sort()[0] ?? "";
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
