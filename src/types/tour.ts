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

export type HoldStatus = "provisional" | "confirmed";

// A pencilled-in date + venue for a tour city. Confirming one deletes the city's other holds.
export type Hold = {
  id: string;
  tourId: string;
  stopId: string;
  date: string;
  venueId: string;
  promoterId: string;
  notes: string;
  status: HoldStatus;
};

export type NewHold = Omit<Hold, "id">;

export const OUTREACH_STATUSES = [
  { value: "to-contact", label: "To contact" },
  { value: "contacted", label: "Contacted" },
  { value: "in-discussion", label: "In discussion" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
  { value: "no-response", label: "No response" },
] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number]["value"];

export const OUTREACH_CHANNELS = [
  { value: "email", label: "Email" },
  { value: "instagram", label: "Instagram DM" },
  { value: "other", label: "Other" },
] as const;

export type OutreachChannel = (typeof OUTREACH_CHANNELS)[number]["value"];

export type OutreachTargetType = "venue" | "promoter";

export type Outreach = {
  id: string;
  tourId: string;
  stopId: string;
  targetType: OutreachTargetType;
  targetId: string;
  status: OutreachStatus;
  channel: OutreachChannel | "";
  lastContacted: string;
  showDate: string;
  notes: string;
};

export type NewOutreach = Omit<Outreach, "id">;

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

export function channelLabel(channel: OutreachChannel | "") {
  return OUTREACH_CHANNELS.find((c) => c.value === channel)?.label ?? "";
}
