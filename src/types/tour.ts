export type Tour = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

export type NewTour = Omit<Tour, "id">;

export type TourStop = {
  id: string;
  tourId: string;
  city: string;
};

export type NewTourStop = Omit<TourStop, "id">;

// "On hold" and "Confirmed" carry a show date and only apply to venues.
export const OUTREACH_STATUSES = [
  { value: "to-contact", label: "To contact", venueOnly: false },
  { value: "contacted", label: "Contacted", venueOnly: false },
  { value: "in-discussion", label: "In discussion", venueOnly: false },
  { value: "on-hold", label: "On hold", venueOnly: true },
  { value: "confirmed", label: "Confirmed", venueOnly: true },
  { value: "declined", label: "Declined", venueOnly: false },
  { value: "no-response", label: "No response", venueOnly: false },
] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number]["value"];

export const OUTREACH_CHANNELS = [
  { value: "email", label: "Email" },
  { value: "instagram", label: "Instagram DM" },
  { value: "other", label: "Other" },
] as const;

export type OutreachChannel = (typeof OUTREACH_CHANNELS)[number]["value"];

export type OutreachTargetType = "venue" | "promoter";

// A venue or promoter's progress in one tour city.
export type Outreach = {
  id: string;
  tourId: string;
  stopId: string;
  targetType: OutreachTargetType;
  targetId: string;
  status: OutreachStatus;
  showDate: string;
  viaPromoterId: string;
};

export type NewOutreach = Omit<Outreach, "id">;

export type ContactLogEntry = {
  id: string;
  outreachId: string;
  tourId: string;
  date: string;
  channel: OutreachChannel | "";
  note: string;
  // "HH:MM", matching <input type="time">; orders entries on the same date. Missing on older entries.
  time?: string;
};

// Newest first: by the contact's date, then its time (entries without one sort last on their day).
export function newestLogFirst(a: ContactLogEntry, b: ContactLogEntry) {
  return b.date.localeCompare(a.date) || (b.time ?? "").localeCompare(a.time ?? "");
}

export type NewContactLogEntry = Omit<ContactLogEntry, "id">;

export type OutreachTarget = {
  targetType: OutreachTargetType;
  targetId: string;
};

// Where a venue or promoter appears across all tours, for warnings before it's changed or deleted.
export type TourListing = {
  tourName: string;
  city: string;
  status: OutreachStatus;
  showDate: string;
  logCount: number;
};

// How a venue is booked (in-house, or through its promoters) is a property of the venue, not
// a status. Promoter-booked venues aren't contacted directly, so their status only tracks the
// booking itself, and the starting status reads "Not booked" rather than "To contact".
const PROMOTER_BOOKED_STATUSES: OutreachStatus[] = ["to-contact", "on-hold", "confirmed", "declined"];

export function statusLabel(status: OutreachStatus, promoterBooked = false) {
  if (status === "to-contact" && promoterBooked) return "Not booked";
  return OUTREACH_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function statusesFor(targetType: OutreachTargetType, promoterBooked = false) {
  return OUTREACH_STATUSES.filter(
    (s) => (targetType === "venue" || !s.venueOnly) && (!promoterBooked || PROMOTER_BOOKED_STATUSES.includes(s.value)),
  );
}

export function hasShowDate(status: OutreachStatus) {
  return status === "on-hold" || status === "confirmed";
}

export function channelLabel(channel: OutreachChannel | "") {
  return OUTREACH_CHANNELS.find((c) => c.value === channel)?.label ?? "";
}
