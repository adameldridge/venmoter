import type { Promoter, Venue, VenueWithPromoters } from "../types/venue";
import type { ContactLogEntry, Outreach, Tour, TourStop } from "../types/tour";
import { parseIsoDate, todayIsoDate, toIsoDate } from "./date";

export const NO_REPLY_DAYS = 7;

export type AttentionKind = "no-reply";

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

// A venue and one of its promoters both on a city's list, worded for one of the two rows.
export type Overlap = {
    outreachId: string;
    message: string;
};

// Flags a venue and its linked promoter in the same city once either has been contacted,
// so the in-house team and a promoter aren't both approached for the same room.
// A venue booked via that promoter is the intended route and isn't flagged.
export function findOverlaps(outreach: Outreach[], venues: VenueWithPromoters[], promoters: Promoter[]): Overlap[] {
    const overlaps: Overlap[] = [];
    const contacted = (o: Outreach) => o.status !== "to-contact";
    const venueOutreach = outreach.filter((o) => o.targetType === "venue");

    for (const v of venueOutreach) {
        // Other venues are only reached through promoters, so there's no direct contact to double up.
        const venue = venues.find((item) => item.id === v.targetId);
        if (!venue?.managesInHouse) continue;

        for (const p of outreach.filter((o) => o.targetType === "promoter" && o.stopId === v.stopId)) {
            if (!venue.promoters.some((promoter) => promoter.id === p.targetId)) continue;
            if (v.viaPromoterId === p.targetId) continue;
            const nameOf = (id: string) => promoters.find((promoter) => promoter.id === id)?.name ?? "a promoter";
            const promoterName = nameOf(p.targetId);
            const route = v.viaPromoterId ? `via ${nameOf(v.viaPromoterId)}` : "directly";

            if (contacted(v) && contacted(p)) {
                overlaps.push({ outreachId: v.id, message: `Also contacting ${promoterName}, who promotes here` });
                overlaps.push({ outreachId: p.id, message: `Also contacting ${venue.name} ${route}` });
            } else if (contacted(v)) {
                overlaps.push({ outreachId: p.id, message: `Already in touch with ${venue.name} ${route}` });
            } else if (contacted(p)) {
                overlaps.push({ outreachId: v.id, message: `Already in touch with ${promoterName}, who promotes here` });
            }
        }
    }

    return overlaps;
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

        const latest = latestLogEntry(o.id, contactLog);
        if (o.status === "contacted" && latest && latest.date < noReplyCutoff) {
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
