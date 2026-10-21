import type { Promoter, Venue } from "../types/venue";
import type { ContactLogEntry, Outreach, Tour, TourStop } from "../types/tour";
import { formatDate, parseIsoDate, todayIsoDate, toIsoDate } from "./date";

export const NO_REPLY_DAYS = 7;

export type AttentionKind = "follow-up" | "no-reply";

export type AttentionItem = {
    key: string;
    kind: AttentionKind;
    message: string;
    stopId: string;
    outreachId?: string;
};

// A date problem on one venue card, worded for that card (e.g. "Clashes with Chalk (Brighton)").
export type Clash = {
    outreachId: string;
    date: string;
    message: string;
};

type InsightInput = {
    tour: Tour;
    stops: TourStop[];
    outreach: Outreach[];
    contactLog: ContactLogEntry[];
    venues: Venue[];
    promoters: Promoter[];
};

export function latestLogEntry(outreachId: string, contactLog: ContactLogEntry[]) {
    return contactLog
        .filter((entry) => entry.outreachId === outreachId)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
}

function targetName(o: Outreach, venues: Venue[], promoters: Promoter[]) {
    const list: { id: string; name: string }[] = o.targetType === "venue" ? venues : promoters;
    return list.find((item) => item.id === o.targetId)?.name ?? "Unknown";
}

function daysAgo(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return toIsoDate(date);
}

// Venue records with a show date (on hold or confirmed).
function datedVenues(outreach: Outreach[]) {
    return outreach.filter(
        (o) => o.targetType === "venue" && o.showDate && (o.status === "on-hold" || o.status === "confirmed"),
    );
}

export function findClashes({ tour, stops, outreach, venues, promoters }: InsightInput): Clash[] {
    const cityOf = (stopId: string) => stops.find((s) => s.id === stopId)?.city ?? "";
    const label = (o: Outreach) => `${targetName(o, venues, promoters)} (${cityOf(o.stopId)})`;
    const dated = datedVenues(outreach);
    const confirmed = dated.filter((o) => o.status === "confirmed");
    const clashes: Clash[] = [];

    // Two confirmed shows in different cities on the same day: flag each of them.
    for (const o of confirmed) {
        const others = confirmed.filter((c) => c.showDate === o.showDate && c.stopId !== o.stopId);
        if (others.length > 0) {
            clashes.push({
                outreachId: o.id,
                date: o.showDate,
                message: `Also confirmed this day: ${others.map(label).join(", ")}`,
            });
        }
    }

    // A hold on a day that's already confirmed in another city.
    for (const hold of dated.filter((o) => o.status === "on-hold")) {
        const conflict = confirmed.find((o) => o.showDate === hold.showDate && o.stopId !== hold.stopId);
        if (conflict) {
            clashes.push({
                outreachId: hold.id,
                date: hold.showDate,
                message: `Clashes with ${label(conflict)}`,
            });
        }
    }

    // Dates outside the tour range.
    for (const o of dated) {
        const before = tour.startDate && o.showDate < tour.startDate;
        const after = tour.endDate && o.showDate > tour.endDate;
        if (before || after) {
            clashes.push({ outreachId: o.id, date: o.showDate, message: "Outside the tour dates" });
        }
    }

    return clashes;
}

const CLOSED_STATUSES: Outreach["status"][] = ["confirmed", "declined", "no-response"];

export function buildAttentionItems(input: InsightInput): AttentionItem[] {
    const { stops, outreach, contactLog, venues, promoters } = input;
    const today = todayIsoDate();
    const noReplyCutoff = daysAgo(NO_REPLY_DAYS);
    const cityOf = (stopId: string) => stops.find((s) => s.id === stopId)?.city ?? "";
    const label = (o: Outreach) => `${targetName(o, venues, promoters)} (${cityOf(o.stopId)})`;
    const items: AttentionItem[] = [];

    for (const o of outreach) {
        if (CLOSED_STATUSES.includes(o.status)) continue;

        if (o.followUpDate && o.followUpDate <= today) {
            items.push({
                key: `follow-up-${o.id}`,
                kind: "follow-up",
                message:
                    o.followUpDate === today
                        ? `Follow up with ${label(o)} today`
                        : `Follow up with ${label(o)} (due ${formatDate(o.followUpDate)})`,
                stopId: o.stopId,
                outreachId: o.id,
            });
            continue;
        }

        const latest = latestLogEntry(o.id, contactLog);
        if (o.status === "contacted" && !o.followUpDate && latest && latest.date < noReplyCutoff) {
            const days = Math.round(
                (parseIsoDate(today).getTime() - parseIsoDate(latest.date).getTime()) / 86_400_000,
            );
            items.push({
                key: `no-reply-${o.id}`,
                kind: "no-reply",
                message: `No reply from ${label(o)} for ${days} days`,
                stopId: o.stopId,
                outreachId: o.id,
            });
        }
    }

    return items;
}
