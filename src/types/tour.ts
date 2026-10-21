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
  followUpDate: string;
  notes: string;
};

export type NewOutreach = Omit<Outreach, "id">;

export type ContactLogEntry = {
  id: string;
  outreachId: string;
  tourId: string;
  date: string;
  channel: OutreachChannel | "";
  note: string;
};

export type NewContactLogEntry = Omit<ContactLogEntry, "id">;

export type OutreachTarget = {
  targetType: OutreachTargetType;
  targetId: string;
};

// An outreach record paired with the city of the tour stop it belongs to.
export type StopOutreach = {
  outreach: Outreach;
  city: string;
};

export function statusLabel(status: OutreachStatus) {
  return OUTREACH_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function statusesFor(targetType: OutreachTargetType) {
  return OUTREACH_STATUSES.filter((s) => targetType === "venue" || !s.venueOnly);
}

export function hasShowDate(status: OutreachStatus) {
  return status === "on-hold" || status === "confirmed";
}

export function channelLabel(channel: OutreachChannel | "") {
  return OUTREACH_CHANNELS.find((c) => c.value === channel)?.label ?? "";
}
