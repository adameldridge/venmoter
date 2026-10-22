// The channel a venue or promoter prefers to be contacted on; "" when there's no preference.
export const CONTACT_CHANNELS = [
  { value: "email", label: "Email" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "website", label: "Website" },
] as const;

export type ContactChannel = (typeof CONTACT_CHANNELS)[number]["value"];

export type Venue = {
  id: string;
  name: string;
  city: string;
  website: string;
  facebook?: string;
  instagram?: string;
  email?: string;
  preferredContact?: ContactChannel | "";
  managesInHouse?: boolean;
};

export type Promoter = {
  id: string;
  name: string;
  website: string;
  facebook?: string;
  instagram?: string;
  email?: string;
  preferredContact?: ContactChannel | "";
};

export type VenuePromoter = {
  id: string;
  venueId: string;
  promoterId: string;
};

export type VenueWithPromoters = Venue & {
  promoters: Promoter[];
};

export type PromoterWithVenues = Promoter & {
  venues: Venue[];
};

export type NewVenue = Omit<Venue, "id">;

export type NewPromoter = Omit<Promoter, "id">;

export type LinkOption = {
  id: string;
  name: string;
  city?: string;
  detail?: string;
};