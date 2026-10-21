import type { VenueWithPromoters, PromoterWithVenues } from "../types/venue";
import VenueCard from "./VenueCard";
import ListHeader from "./ListHeader";
import type { StopOutreach } from "../types/tour";

type VenuesTabProps = {
    venues: VenueWithPromoters[];
    allPromoters: PromoterWithVenues[];
    cities: string[];
    selectedCity: string;
    onCityChange: (city: string) => void;
    searchInput: string;
    onSearchChange: (search: string) => void;
    onAddVenue: () => void;
    onEditVenue: (venue: VenueWithPromoters) => void;
    onDeleteVenue: (venue: VenueWithPromoters) => void;
    onManagePromoters: (venue: VenueWithPromoters) => void;
    outreachFor: (venueId: string) => StopOutreach[];
};

export default function VenuesTab({
    venues,
    allPromoters,
    cities,
    selectedCity,
    onCityChange,
    searchInput,
    onSearchChange,
    onAddVenue,
    onEditVenue,
    onDeleteVenue,
    onManagePromoters,
    outreachFor,
}: VenuesTabProps) {
    return (
        <div>
            <ListHeader addLabel="Add Venue" onAdd={onAddVenue}>
                <div className="filter-group">
                    <select
                        className="cities-select"
                        value={selectedCity}
                        onChange={(e) => onCityChange(e.target.value)}
                    >
                        {cities.map((city) => (
                            <option value={city} key={city}>{city}</option>
                        ))}
                    </select>

                    <input
                        className="search-input"
                        type="search"
                        value={searchInput}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search venues..."
                        aria-label="Search venues"
                    />
                </div>
            </ListHeader>

            {groupByCity(venues).map(({ city, venues: cityVenues }) => (
                <details key={city} open>
                    <summary className="city-heading">{city}</summary>
                    <div className="card-grid">
                        {cityVenues.map((venue) => (
                            <VenueCard
                                key={venue.id}
                                venue={venue}
                                allPromoters={allPromoters}
                                onEdit={() => onEditVenue(venue)}
                                onDelete={() => onDeleteVenue(venue)}
                                onManagePromoters={() => onManagePromoters(venue)}
                                outreach={outreachFor(venue.id)}
                            />
                        ))}
                    </div>
                </details>
            ))}
        </div>
    );
}

function groupByCity(venues: VenueWithPromoters[]) {
    const groups: { city: string; venues: VenueWithPromoters[] }[] = [];
    for (const venue of venues) {
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.city === venue.city) {
            lastGroup.venues.push(venue);
        } else {
            groups.push({ city: venue.city, venues: [venue] });
        }
    }
    return groups;
}
