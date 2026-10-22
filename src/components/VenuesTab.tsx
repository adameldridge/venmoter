import { FaBullhorn } from "react-icons/fa";
import type { RecordKind, VenueWithPromoters } from "../types/venue";
import { hasContact } from "../utils/contact";
import { useCollapsedGroups } from "../hooks/useCollapsedGroups";
import ListHeader from "./ListHeader";
import SocialLinks from "./SocialLinks";
import { DataGroup, DataTable, EditChip, NameCell } from "./DataTable";

const COLUMNS = [
    { label: "Name", className: "data-col-name" },
    { label: "Booked by" },
    { label: "Links", className: "data-col-links" },
];

type VenuesTabProps = {
    venues: VenueWithPromoters[];
    cities: string[];
    selectedCity: string;
    onCityChange: (city: string) => void;
    searchInput: string;
    onSearchChange: (search: string) => void;
    onAddVenue: () => void;
    onManagePromoters: (venue: VenueWithPromoters) => void;
    onViewRecord: (kind: RecordKind, id: string) => void;
};

export default function VenuesTab({
    venues,
    cities,
    selectedCity,
    onCityChange,
    searchInput,
    onSearchChange,
    onAddVenue,
    onManagePromoters,
    onViewRecord,
}: VenuesTabProps) {
    const { collapsedIds, setCollapsed } = useCollapsedGroups("venmoter.collapsedVenueCities");

    return (
        <div>
            <ListHeader addLabel="Add venue" onAdd={onAddVenue}>
                <div className="filter-group entity-filters">
                    <select
                        className="cities-select"
                        value={selectedCity}
                        onChange={(e) => onCityChange(e.target.value)}
                        aria-label="Filter by city"
                    >
                        <option value="">All cities</option>
                        {cities.map((city) => (
                            <option value={city} key={city}>{city}</option>
                        ))}
                    </select>

                    <input
                        className="search-input"
                        type="search"
                        value={searchInput}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search…"
                        aria-label="Search venues"
                    />
                </div>
            </ListHeader>

            {venues.length === 0 ? (
                <div className="data-empty">No venues match.</div>
            ) : (
                <DataTable columns={COLUMNS}>
                    {groupByCity(venues).map(({ city, venues: cityVenues }) => (
                        <DataGroup
                            key={city}
                            title={city}
                            count={cityVenues.length}
                            colSpan={COLUMNS.length}
                            collapsed={collapsedIds.has(city)}
                            onToggle={() => setCollapsed(city, !collapsedIds.has(city))}
                        >
                            {cityVenues.map((venue) => (
                                <VenueRow
                                    key={venue.id}
                                    venue={venue}
                                    onManagePromoters={() => onManagePromoters(venue)}
                                    onViewRecord={onViewRecord}
                                />
                            ))}
                        </DataGroup>
                    ))}
                </DataTable>
            )}
        </div>
    );
}

type VenueRowProps = {
    venue: VenueWithPromoters;
    onManagePromoters: () => void;
    onViewRecord: (kind: RecordKind, id: string) => void;
};

function VenueRow({ venue, onManagePromoters, onViewRecord }: VenueRowProps) {
    const promoters = [...venue.promoters].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <tr>
            <NameCell kind="venue" name={venue.name} onOpen={() => onViewRecord("venue", venue.id)} openTitle={`View ${venue.name}`} />
            <td className="data-cell-full">
                <div className="data-tags">
                    {venue.managesInHouse && <span className="data-pill">In-house</span>}
                    {promoters.map((promoter) => (
                        <button
                            key={promoter.id}
                            className="data-tag"
                            type="button"
                            onClick={() => onViewRecord("promoter", promoter.id)}
                            title={`View ${promoter.name}`}
                        >
                            <FaBullhorn className="data-tag-icon" aria-hidden="true" />
                            {promoter.name}
                        </button>
                    ))}
                    {!venue.managesInHouse && promoters.length === 0 && <span className="data-pill">No promoters</span>}
                    <EditChip title={`Edit who books ${venue.name}`} onClick={onManagePromoters} />
                </div>
            </td>
            <td className="data-cell-links">
                {hasContact(venue) ? (
                    <SocialLinks
                        website={venue.website}
                        instagram={venue.instagram}
                        facebook={venue.facebook}
                        email={venue.email}
                        preferred={venue.preferredContact}
                    />
                ) : (
                    <span className="data-row-none">No contact</span>
                )}
            </td>
        </tr>
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
