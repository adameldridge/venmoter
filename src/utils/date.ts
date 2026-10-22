// Dates are stored as "YYYY-MM-DD" strings, matching <input type="date">.

export function todayIsoDate() {
    return toIsoDate(new Date());
}

export function formatDate(isoDate: string) {
    if (!isoDate) return "";
    return parseIsoDate(isoDate).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

// e.g. "15 Apr", for places where the year is already obvious.
export function formatDayMonth(isoDate: string) {
    if (!isoDate) return "";
    return parseIsoDate(isoDate).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
    });
}

export function parseIsoDate(isoDate: string) {
    const [year, month, day] = isoDate.split("-").map(Number);
    return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}

// Inclusive list of "YYYY-MM-DD" dates from start to end, capped to avoid runaway ranges.
export function dateRange(startIso: string, endIso: string, maxDays = 366) {
    const dates: string[] = [];
    const current = parseIsoDate(startIso);
    const end = parseIsoDate(endIso);
    while (current <= end && dates.length < maxDays) {
        dates.push(toIsoDate(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

// e.g. "14–18 Apr 2027", "28 Apr – 3 May 2027". Missing ends show as "?".
export function formatDateRange(startIso: string, endIso: string) {
    if (!startIso || !endIso) return `${formatDate(startIso) || "?"} – ${formatDate(endIso) || "?"}`;
    const start = parseIsoDate(startIso);
    const end = parseIsoDate(endIso);
    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();
    if (sameMonth) return `${start.getDate()}–${formatDate(endIso)}`;
    const startLabel = start.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        ...(sameYear ? {} : { year: "numeric" }),
    });
    return `${startLabel} – ${formatDate(endIso)}`;
}
