import { FaBuilding } from "react-icons/fa";
import type { PromoterWithVenues } from "../types/venue";
import { hasContact } from "../utils/contact";
import { rowId, useRowFocus, type RowFocus, type RowKind } from "../hooks/useRowFocus";
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
    focus: RowFocus | null;
    onGoTo: (kind: RowKind, id: string) => void;
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
    focus,
    onGoTo,
}: PromotersTabProps) {
    useRowFocus(focus);

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
                                onGoTo={onGoTo}
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
    onGoTo: (kind: RowKind, id: string) => void;
};

function PromoterRow({ promoter, onEdit, onDelete, onManageVenues, onGoTo }: PromoterRowProps) {
    const venues = [...promoter.venues].sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));

    return (
        <tr id={rowId("promoter", promoter.id)}>
            <NameCell kind="promoter" name={promoter.name} onOpen={onEdit} openTitle={`Edit ${promoter.name}`} />
            <td className="data-cell-full">
                <div className="data-tags">
                    {venues.length === 0 && <span className="data-pill">No venues</span>}
                    {venues.map((venue) => (
                        <button
                            key={venue.id}
                            className="data-tag"
                            type="button"
                            onClick={() => onGoTo("venue", venue.id)}
                            title={`Go to ${venue.name}`}
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
