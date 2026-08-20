export type Venue = {
  id: string;
  name: string;
  city: string;
  website: string;
  facebook?: string;
  instagram?: string;
};

export type Promoter = {
  id: string;
  name: string;
  website: string;
};

export type VenuePromoter = {
  id: string;
  venueId: string;
  promoterId: string;
};

export type VenueWithPromoters = Venue & {
  promoters: Promoter[];
};

export type NewVenue = Omit<Venue, "id">;