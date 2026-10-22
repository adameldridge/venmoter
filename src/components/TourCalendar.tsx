import type { Tour } from "../types/tour";
import { dateRange, parseIsoDate, todayIsoDate } from "../utils/date";
import "./TourCalendar.css";

export type CalendarEntry = {
    date: string;
    stopId: string;
    city: string;
    venueName: string;
    kind: "confirmed" | "on-hold";
};

type TourCalendarProps = {
    tour: Tour;
    entries: CalendarEntry[];
    clashDates: Set<string>;
    onSelectStop: (stopId: string) => void;
};

// Horizontal day strip. Confirmed days are green, days with only holds are amber,
// and clashing days get a red marker.
export default function TourCalendar({ tour, entries, clashDates, onSelectStop }: TourCalendarProps) {
    const knownDates = entries.map((entry) => entry.date).sort();
    const start = tour.startDate || knownDates[0];
    const end = tour.endDate || knownDates[knownDates.length - 1];

    if (!start || !end || start > end) {
        return (
            <div className="tour-calendar-hint">
                Add tour dates or holds to see the calendar.
            </div>
        );
    }

    const today = todayIsoDate();
    const dates = dateRange(start, end);
    const spansMonths = start.slice(0, 7) !== end.slice(0, 7);

    return (
        <>
            <div className="tour-calendar-wrapper">
                <div className="tour-calendar" role="list" aria-label="Tour calendar">
                    <div className="tour-calendar-start-month" aria-hidden="true">
                        {parseIsoDate(start).toLocaleDateString(undefined, { month: "short" })}
                    </div>
                    {dates.map((date, index) => {
                        const day = parseIsoDate(date);
                        const dayEntries = entries.filter((entry) => entry.date === date);
                        const confirmed = dayEntries.filter((entry) => entry.kind === "confirmed");
                        const provisional = dayEntries.filter((entry) => entry.kind === "on-hold");
                        const stopId = (confirmed[0] ?? provisional[0])?.stopId;
                        const { cityLabel, venueLabel } = describeDay(confirmed.length > 0 ? confirmed : provisional);
                        const title = dayEntries
                            .map((entry) => `${entry.city}: ${entry.venueName} (${entry.kind === "on-hold" ? "on hold" : "confirmed"})`)
                            .concat(clashDates.has(date) ? ["Date clash"] : [])
                            .join("\n");
                        // The first month is labelled before the strip; later ones on their 1st.
                        const showMonth = index > 0 && day.getDate() === 1;
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                        const className = [
                            "tour-calendar-day",
                            confirmed.length > 0 && "tour-calendar-day-booked",
                            confirmed.length === 0 && provisional.length > 0 && "tour-calendar-day-provisional",
                            clashDates.has(date) && "tour-calendar-day-clash",
                            isWeekend && "tour-calendar-day-weekend",
                            date === today && "tour-calendar-day-today",
                        ]
                            .filter(Boolean)
                            .join(" ");

                        const content = (
                            <>
                                {spansMonths && (
                                    <span className="tour-calendar-month">
                                        {showMonth ? day.toLocaleDateString(undefined, { month: "short" }) : "\u00a0"}
                                    </span>
                                )}
                                <span className="tour-calendar-weekday">
                                    {day.toLocaleDateString(undefined, { weekday: "short" })}
                                </span>
                                <span className="tour-calendar-date">{day.getDate()}</span>
                                {cityLabel && <span className="tour-calendar-label">{cityLabel}</span>}
                                {venueLabel && <span className="tour-calendar-sublabel">{venueLabel}</span>}
                                {clashDates.has(date) && <span className="tour-calendar-clash" aria-label="Date clash">!</span>}
                            </>
                        );

                        return (
                            <div key={date} role="listitem" className="tour-calendar-cell">
                                {stopId ? (
                                    <button
                                        className={className}
                                        type="button"
                                        title={title}
                                        onClick={() => onSelectStop(stopId)}
                                    >
                                        {content}
                                    </button>
                                ) : (
                                    <div className={className}>{content}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

// One entry shows its city and venue; several are summarised (e.g. "Leeds" / "2 holds").
function describeDay(entries: CalendarEntry[]) {
    if (entries.length === 0) return { cityLabel: "", venueLabel: "" };
    if (entries.length === 1) return { cityLabel: entries[0].city, venueLabel: entries[0].venueName };
    const cities = [...new Set(entries.map((entry) => entry.city))];
    const noun = entries[0].kind === "confirmed" ? "shows" : "holds";
    return {
        cityLabel: cities.length === 1 ? cities[0] : `${cities.length} cities`,
        venueLabel: `${entries.length} ${noun}`,
    };
}
