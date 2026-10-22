import { useState } from "react";
import { FaBullhorn } from "react-icons/fa";
import type { VenueWithPromoters } from "../types/venue";
import { hasShowDate, type Outreach, type Tour, type TourStop } from "../types/tour";
import { sameCity } from "../utils/city";
import { formatDayMonth } from "../utils/date";
import { useCollapsedGroups } from "../hooks/useCollapsedGroups";
import { rowId, useRowFocus, type RowFocus, type RowKind } from "../hooks/useRowFocus";
import ListHeader from "./ListHeader";
import SocialLinks from "./SocialLinks";
import CardMenu from "./CardMenu";
import StatusBadge from "./StatusBadge";
import { AddChip, DataGroup, DataTable, NameCell, type DataColumn } from "./DataTable";
import { hasContact } from "../utils/contact";

// The active tour, for the "On tour" column.
export type VenueTourContext = {
    tour: Tour;
    stops: TourStop[];
    outreach: Outreach[];
};

type VenuesTabProps = {
    venues: VenueWithPromoters[];
    cities: string[];
    selectedCity: string;
    onCityChange: (city: string) => void;
    searchInput: string;
    onSearchChange: (search: string) => void;
    onAddVenue: () => void;
    onEditVenue: (venue: VenueWithPromoters) => void;
    onDeleteVenue: (venue: VenueWithPromoters) => void;
    onManagePromoters: (venue: VenueWithPromoters) => void;
    tour: VenueTourContext | null;
    onOpenOutreach: (outreach: Outreach, title: string) => void;
    onAddToStop: (stop: TourStop, venueId: string) => void;
    focus: RowFocus | null;
    onGoTo: (kind: RowKind, id: string) => void;
};

export default function VenuesTab({
    venues,
    cities,
    selectedCity,
    onCityChange,
    searchInput,
    onSearchChange,
    onAddVenue,
    onEditVenue,
    onDeleteVenue,
    onManagePromoters,
    tour,
    onOpenOutreach,
    onAddToStop,
    focus,
    onGoTo,
}: VenuesTabProps) {
    const { collapsedIds, setCollapsed } = useCollapsedGroups("venmoter.collapsedVenueCities");

    // Arriving at a venue from another tab opens its city if it was collapsed.
    const [seenFocus, setSeenFocus] = useState<RowFocus | null>(null);
    if (focus !== seenFocus) {
        setSeenFocus(focus);
        const focusCity = focus?.kind === "venue" ? venues.find((venue) => venue.id === focus.id)?.city : undefined;
        if (focusCity) setCollapsed(focusCity, false);
    }
    useRowFocus(focus);

    const columns: DataColumn[] = [
        { label: "Name", className: "data-col-name" },
        { label: "Booked by" },
        ...(tour ? [{ label: `On tour · ${tour.tour.name}`, className: "data-col-status" }] : []),
        { label: "Links", className: "data-col-links" },
        { label: "", className: "data-col-fit" },
    ];

    return (
        <div>
            <ListHeader addLabel="Add Venue" onAdd={onAddVenue}>
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
                        placeholder="Search venues..."
                        aria-label="Search venues"
                    />
                </div>
            </ListHeader>

            {venues.length === 0 ? (
                <div className="data-empty">No venues match.</div>
            ) : (
                <DataTable columns={columns}>
                    {groupByCity(venues).map(({ city, venues: cityVenues }) => (
                        <DataGroup
                            key={city}
                            title={city}
                            count={cityVenues.length}
                            colSpan={columns.length}
                            collapsed={collapsedIds.has(city)}
                            onToggle={() => setCollapsed(city, !collapsedIds.has(city))}
                        >
                            {cityVenues.map((venue) => (
                                <VenueRow
                                    key={venue.id}
                                    venue={venue}
                                    tour={tour}
                                    onEdit={() => onEditVenue(venue)}
                                    onDelete={() => onDeleteVenue(venue)}
                                    onManagePromoters={() => onManagePromoters(venue)}
                                    onOpenOutreach={onOpenOutreach}
                                    onAddToStop={onAddToStop}
                                    onGoTo={onGoTo}
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
    tour: VenueTourContext | null;
    onEdit: () => void;
    onDelete: () => void;
    onManagePromoters: () => void;
    onOpenOutreach: (outreach: Outreach, title: string) => void;
    onAddToStop: (stop: TourStop, venueId: string) => void;
    onGoTo: (kind: RowKind, id: string) => void;
};

function VenueRow({ venue, tour, onEdit, onDelete, onManagePromoters, onOpenOutreach, onAddToStop, onGoTo }: VenueRowProps) {
    const promoters = [...venue.promoters].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <tr id={rowId("venue", venue.id)}>
            <NameCell kind="venue" name={venue.name} onOpen={onEdit} openTitle={`Edit ${venue.name}`} />
            <td className="data-cell-full">
                <div className="data-tags">
                    {venue.managesInHouse && <span className="data-pill">In-house</span>}
                    {promoters.map((promoter) => (
                        <button
                            key={promoter.id}
                            className="data-tag"
                            type="button"
                            onClick={() => onGoTo("promoter", promoter.id)}
                            title={`Go to ${promoter.name}`}
                        >
                            <FaBullhorn className="data-tag-icon" aria-hidden="true" />
                            {promoter.name}
                        </button>
                    ))}
                    {!venue.managesInHouse && promoters.length === 0 && <span className="data-pill">No promoters</span>}
                    <AddChip kind="promoter" label="Promoter" title={`Link promoters to ${venue.name}`} onClick={onManagePromoters} />
                </div>
            </td>
            {tour && (
                <TourCell venue={venue} tour={tour} onOpenOutreach={onOpenOutreach} onAddToStop={onAddToStop} />
            )}
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
            <td className="data-cell-menu">
                <CardMenu
                    items={[
                        { label: "Edit venue", onClick: onEdit },
                        { label: "Edit promoters", onClick: onManagePromoters },
                        { label: "Delete venue", onClick: onDelete, danger: true },
                    ]}
                />
            </td>
        </tr>
    );
}

type TourCellProps = {
    venue: VenueWithPromoters;
    tour: VenueTourContext;
    onOpenOutreach: (outreach: Outreach, title: string) => void;
    onAddToStop: (stop: TourStop, venueId: string) => void;
};

// Where the venue stands on the active tour: its status (opens the record), an offer to add
// it if its city is on the tour, or nothing if the city isn't.
function TourCell({ venue, tour, onOpenOutreach, onAddToStop }: TourCellProps) {
    const stop = tour.stops.find((s) => sameCity(s.city, venue.city));
    const outreach = stop && tour.outreach.find(
        (o) => o.stopId === stop.id && o.targetType === "venue" && o.targetId === venue.id,
    );

    return (
        <td className="data-cell-status">
            {!stop ? (
                <span className="data-row-empty" title={`${venue.city} isn't on ${tour.tour.name}`}>–</span>
            ) : outreach ? (
                <button
                    className="data-row-status-link data-row-status"
                    type="button"
                    onClick={() => onOpenOutreach(outreach, `${venue.name} – ${stop.city}`)}
                    title={`Update ${venue.name} on ${tour.tour.name}`}
                >
                    <StatusBadge status={outreach.status} />
                    {hasShowDate(outreach.status) && outreach.showDate && (
                        <span className="data-row-muted">{formatDayMonth(outreach.showDate)}</span>
                    )}
                </button>
            ) : (
                <AddChip
                    kind="venue"
                    label={`Add to ${stop.city}`}
                    title={`Add ${venue.name} to ${stop.city} on ${tour.tour.name}`}
                    onClick={() => onAddToStop(stop, venue.id)}
                />
            )}
        </td>
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
