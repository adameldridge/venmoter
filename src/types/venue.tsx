export type Venue = {
  id: string;
  name: string;
  city: string;
  website: string;
  facebook?: string;
  instagram?: string;
  email?: string;
};

export type Promoter = {
  id: string;
  name: string;
  website: string;
  facebook?: string;
  instagram?: string;
  email?: string;
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
};