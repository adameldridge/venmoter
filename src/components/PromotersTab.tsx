import { FaBuilding } from "react-icons/fa";
import type { PromoterWithVenues, RecordKind } from "../types/venue";
import { hasContact } from "../utils/contact";
import ListHeader from "./ListHeader";
import SocialLinks from "./SocialLinks";
import CardMenu from "./CardMenu";
import { AddChip, DataTable, NameCell } from "./DataTable";

type PromotersTabProps = {
    promoters: PromoterWithVenues[];
    cities: string[];
    selectedCity: string;
    onCityChange: (city: string) => void;
    searchInput: string;
    onSearchChange: (search: string) => void;
    onAddPromoter: () => void;
    onEditPromoter: (promoter: PromoterWithVenues) => void;
    onDeletePromoter: (promoter: PromoterWithVenues) => void;
    onManageVenues: (promoter: PromoterWithVenues) => void;
    onViewRecord: (kind: RecordKind, id: string) => void;
};

const COLUMNS = [
    { label: "Name", className: "data-col-name" },
    { label: "Venues" },
    { label: "Links", className: "data-col-links" },
    { label: "", className: "data-col-fit" },
];

// Promoters often work in several cities, so this is one list by name rather than city groups.
export default function PromotersTab({
    promoters,
    cities,
    selectedCity,
    onCityChange,
    searchInput,
    onSearchChange,
    onAddPromoter,
    onEditPromoter,
    onDeletePromoter,
    onManageVenues,
    onViewRecord,
}: PromotersTabProps) {
    return (
        <div>
            <ListHeader addLabel="Add Promoter" onAdd={onAddPromoter}>
                <div className="filter-group entity-filters">
                    <select
                        className="cities-select"
                        value={selectedCity}
                        onChange={(e) => onCityChange(e.target.value)}
                        aria-label="Filter by city"
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
                        placeholder="Search promoters..."
                        aria-label="Search promoters"
                    />
                </div>
            </ListHeader>

            {promoters.length === 0 ? (
                <div className="data-empty">No promoters match.</div>
            ) : (
                <DataTable columns={COLUMNS}>
                    <tbody>
                        {promoters.map((promoter) => (
                            <PromoterRow
                                key={promoter.id}
                                promoter={promoter}
                                onEdit={() => onEditPromoter(promoter)}
                                onDelete={() => onDeletePromoter(promoter)}
                                onManageVenues={() => onManageVenues(promoter)}
                                onViewRecord={onViewRecord}
                            />
                        ))}
                    </tbody>
                </DataTable>
            )}
        </div>
    );
}

type PromoterRowProps = {
    promoter: PromoterWithVenues;
    onEdit: () => void;
    onDelete: () => void;
    onManageVenues: () => void;
    onViewRecord: (kind: RecordKind, id: string) => void;
};

function PromoterRow({ promoter, onEdit, onDelete, onManageVenues, onViewRecord }: PromoterRowProps) {
    const venues = [...promoter.venues].sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));

    return (
        <tr>
            <NameCell kind="promoter" name={promoter.name} onOpen={() => onViewRecord("promoter", promoter.id)} openTitle={`View ${promoter.name}`} />
            <td className="data-cell-full">
                <div className="data-tags">
                    {venues.length === 0 && <span className="data-pill">No venues</span>}
                    {venues.map((venue) => (
                        <button
                            key={venue.id}
                            className="data-tag"
                            type="button"
                            onClick={() => onViewRecord("venue", venue.id)}
                            title={`View ${venue.name}`}
                        >
                            <FaBuilding className="data-tag-icon" aria-hidden="true" />
                            {venue.name}
                            <span className="data-tag-meta">{venue.city}</span>
                        </button>
                    ))}
                    <AddChip kind="venue" label="Venue" title={`Link venues to ${promoter.name}`} onClick={onManageVenues} />
                </div>
            </td>
            <td className="data-cell-links">
                {hasContact(promoter) ? (
                    <SocialLinks
                        website={promoter.website}
                        instagram={promoter.instagram}
                        facebook={promoter.facebook}
                        email={promoter.email}
                        preferred={promoter.preferredContact}
                    />
                ) : (
                    <span className="data-row-none">No contact</span>
                )}
            </td>
            <td className="data-cell-menu">
                <CardMenu
                    items={[
                        { label: "Edit promoter", onClick: onEdit },
                        { label: "Edit venues", onClick: onManageVenues },
                        { label: "Delete promoter", onClick: onDelete, danger: true },
                    ]}
                />
            </td>
        </tr>
    );
}
