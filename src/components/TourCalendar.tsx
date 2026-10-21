import type { Tour } from "../types/tour";
import { dateRange, parseIsoDate, todayIsoDate } from "../utils/date";
import "./TourCalendar.css";

export type CalendarEntry = {
    date: string;
    stopId: string;
    city: string;
    venueName: string;
    kind: "confirmed" | "provisional";
};

type TourCalendarProps = {
    tour: Tour;
    entries: CalendarEntry[];
    onSelectStop: (stopId: string) => void;
};

// Horizontal day strip. Confirmed days are green; days with only provisional holds are amber.
export default function TourCalendar({ tour, entries, onSelectStop }: TourCalendarProps) {
    const knownDates = entries.map((entry) => entry.date).sort();
    const start = tour.startDate || knownDates[0];
    const end = tour.endDate || knownDates[knownDates.length - 1];

    if (!start || !end || start > end) {
        return (
            <>
                <CalendarHeading />
                <div className="tour-calendar-hint">
                    Add tour dates or holds to see the calendar.
                </div>
            </>
        );
    }

    const today = todayIsoDate();
    const dates = dateRange(start, end);
    const spansMonths = start.slice(0, 7) !== end.slice(0, 7);
    const showLegend = entries.length > 0;

    return (
        <>
            <CalendarHeading monthRange={formatMonthRange(start, end)} />
            <div className="tour-calendar-wrapper">
                <div className="tour-calendar" role="list" aria-label="Tour calendar">
                    {dates.map((date, index) => {
                        const day = parseIsoDate(date);
                        const dayEntries = entries.filter((entry) => entry.date === date);
                        const confirmed = dayEntries.filter((entry) => entry.kind === "confirmed");
                        const provisional = dayEntries.filter((entry) => entry.kind === "provisional");
                        const stopId = (confirmed[0] ?? provisional[0])?.stopId;
                        const label = confirmed.length > 0
                            ? [...new Set(confirmed.map((entry) => entry.city))].join(", ")
                            : provisional.length > 1
                              ? `${provisional.length} holds`
                              : provisional[0]?.venueName;
                        const title = dayEntries
                            .map((entry) => `${entry.city}: ${entry.venueName} (${entry.kind})`)
                            .join("\n");
                        const showMonth = index > 0 && day.getDate() === 1;
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                        const className = [
                            "tour-calendar-day",
                            confirmed.length > 0 && "tour-calendar-day-booked",
                            confirmed.length === 0 && provisional.length > 0 && "tour-calendar-day-provisional",
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
                                {label && <span className="tour-calendar-label">{label}</span>}
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
                {showLegend && (
                    <div className="tour-calendar-legend">
                        <span><span className="tour-calendar-swatch tour-calendar-swatch-booked" /> Confirmed</span>
                        <span><span className="tour-calendar-swatch tour-calendar-swatch-provisional" /> Provisional</span>
                    </div>
                )}
            </div>
        </>
    );
}

// Uses the Tour tab's shared section heading styles so Calendar and Cities read as equal sections.
function CalendarHeading({ monthRange }: { monthRange?: string }) {
    return (
        <div className="tour-section-header">
            <h2 className="tour-section-title">
                Calendar
                {monthRange && <span className="tour-section-subtitle">{monthRange}</span>}
            </h2>
        </div>
    );
}

// e.g. "April 2027", "April – May 2027", "December 2026 – January 2027".
function formatMonthRange(startIso: string, endIso: string) {
    const start = parseIsoDate(startIso);
    const end = parseIsoDate(endIso);
    const monthYear = (date: Date) => date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    if (startIso.slice(0, 7) === endIso.slice(0, 7)) return monthYear(start);
    if (start.getFullYear() === end.getFullYear()) {
        return `${start.toLocaleDateString(undefined, { month: "long" })} – ${monthYear(end)}`;
    }
    return `${monthYear(start)} – ${monthYear(end)}`;
}
