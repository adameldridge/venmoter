import type { VenueWithPromoters, PromoterWithVenues } from "../types/venue";
import VenueCard from "./VenueCard";
import ListHeader from "./ListHeader";

type VenuesTabProps = {
    venues: VenueWithPromoters[];
    allPromoters: PromoterWithVenues[];
    cities: string[];
    selectedCity: string;
    onCityChange: (city: string) => void;
    searchInput: string;
    onSearchChange: (search: string) => void;
    canEdit: boolean;
    onAddVenue: () => void;
    onEditVenue: (venue: VenueWithPromoters) => void;
    onDeleteVenue: (venue: VenueWithPromoters) => void;
    onManagePromoters: (venue: VenueWithPromoters) => void;
};

export default function VenuesTab({
    venues,
    allPromoters,
    cities,
    selectedCity,
    onCityChange,
    searchInput,
    onSearchChange,
    canEdit,
    onAddVenue,
    onEditVenue,
    onDeleteVenue,
    onManagePromoters,
}: VenuesTabProps) {
    return (
        <div>
            <ListHeader canEdit={canEdit} addLabel="Add Venue" onAdd={onAddVenue}>
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

            <div className="card-grid">
                {venues.map((venue) => (
                    <VenueCard
                        key={venue.id}
                        venue={venue}
                        allPromoters={allPromoters}
                        canEdit={canEdit}
                        onEdit={() => onEditVenue(venue)}
                        onDelete={() => onDeleteVenue(venue)}
                        onManagePromoters={() => onManagePromoters(venue)}
                    />
                ))}
            </div>
        </div>
    );
}
