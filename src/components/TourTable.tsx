import "./Cards.css";
import "./TourTable.css";
import type { ReactNode } from "react";
import { FaBuilding, FaBullhorn, FaChevronDown, FaExclamationTriangle, FaTrashAlt } from "react-icons/fa";
import type { Promoter, Venue } from "../types/venue";
import { channelLabel, statusLabel, type ContactLogEntry, type Outreach, type OutreachStatus } from "../types/tour";
import { formatDate, formatDayMonth } from "../utils/date";
import SocialLinks from "./SocialLinks";
import CardMenu from "./CardMenu";
import StatusBadge from "./StatusBadge";

const COLUMN_COUNT = 5;

export function TourTable({ children }: { children: ReactNode }) {
    return (
        <div className="tour-table-wrap">
            <table className="tour-table">
                <thead>
                    <tr>
                        <th className="tour-col-name">Name</th>
                        <th className="tour-col-status">Status</th>
                        <th className="tour-col-links">Links</th>
                        <th>Last contact</th>
                        <th className="tour-col-fit" aria-label="Actions" />
                    </tr>
                </thead>
                {children}
            </table>
        </div>
    );
}

// A promoter linked to a venue on the city's list but not yet added itself.
export type AvailableVenue = {
    id: string;
    name: string;
    // How it's booked, e.g. "In-house" or "via Riot Collective".
    detail: string;
};

export type AvailablePromoter = {
    id: string;
    name: string;
    venueNames: string[];
};

type TourGroupProps = {
    city: string;
    // Venues confirmed in this city, shown with their date in the header.
    confirmedVenues: VenueTag[];
    count: number;
    confirmed: boolean;
    availablePromoters: AvailablePromoter[];
    // Venues in this city (from the Venues tab) that aren't on its list yet.
    availableVenues: AvailableVenue[];
    collapsed: boolean;
    onToggle: () => void;
    onAddPromoter: (promoterId: string) => void;
    onAddVenue: (venueId: string) => void;
    onRemove: () => void;
    children: ReactNode;
};

// One city's block of rows, headed by a full-width row with the city's actions.
export function TourGroup({
    city,
    confirmedVenues,
    count,
    confirmed,
    availablePromoters,
    availableVenues,
    collapsed,
    onToggle,
    onAddPromoter,
    onAddVenue,
    onRemove,
    children,
}: TourGroupProps) {
    return (
        <tbody className="tour-group">
            <tr className={confirmed ? "tour-group-row tour-group-row-confirmed" : "tour-group-row"}>
                <th colSpan={COLUMN_COUNT} scope="rowgroup">
                    <div className="tour-group-header">
                        <button
                            className="tour-group-toggle"
                            type="button"
                            onClick={onToggle}
                            aria-expanded={!collapsed}
                            title={collapsed ? `Show ${city}` : `Hide ${city}`}
                        >
                            <FaChevronDown className="tour-group-chevron" aria-hidden="true" />
                            <span className="tour-group-city">{city}</span>
                            <span className="tour-group-count">{count}</span>
                        </button>
                        {confirmedVenues.length > 0 && <VenueTags venues={confirmedVenues} />}
                        {availableVenues.map((venue) => (
                            <button
                                key={venue.id}
                                className="tour-group-available"
                                type="button"
                                onClick={() => onAddVenue(venue.id)}
                                title={`Add ${venue.name} to ${city}${venue.detail ? ` (${venue.detail})` : ""}`}
                            >
                                <FaBuilding aria-hidden="true" />+ {venue.name}
                            </button>
                        ))}
                        {availablePromoters.map((promoter) => (
                            <button
                                key={promoter.id}
                                className="tour-group-available"
                                type="button"
                                onClick={() => onAddPromoter(promoter.id)}
                                title={`Add ${promoter.name} to ${city}: works with ${promoter.venueNames.join(", ")}`}
                            >
                                <FaBullhorn aria-hidden="true" />+ {promoter.name}
                            </button>
                        ))}
                        <div className="tour-group-actions">
                            <button
                                className="ghost-button tour-group-remove"
                                type="button"
                                onClick={onRemove}
                                aria-label={`Remove ${city}`}
                                title="Remove city"
                            >
                                <FaTrashAlt />
                            </button>
                        </div>
                    </div>
                </th>
            </tr>
            {collapsed ? null : count === 0 ? (
                <tr className="tour-group-empty">
                    <td colSpan={COLUMN_COUNT}>
                        {availableVenues.length > 0
                            ? "Nothing added yet. Pick from the venues above."
                            : `No ${city} venues on the Venues tab yet.`}
                    </td>
                </tr>
            ) : (
                children
            )}
        </tbody>
    );
}

// A venue reached through a promoter, shown as a tag; clicking opens the venue's own record
// (hold, show date, via promoter).
export type VenueTag = {
    key: string;
    name: string;
    status: OutreachStatus;
    showDate: string;
    // Whether this tag shows the venue's status; otherwise it's a plain link to the venue.
    showOutcome: boolean;
    clashMessages: string[];
    onClick: () => void;
};

function VenueTags({ venues }: { venues: VenueTag[] }) {
    return (
        <div className="tour-venue-tags">
            {venues.map((venue) => {
                const outcome = !venue.showOutcome || venue.status === "to-contact"
                    ? ""
                    : `${statusLabel(venue.status)}${venue.showDate ? ` ${formatDate(venue.showDate)}` : ""}`;
                // Phones show just "15 Apr"; the tag's colour already says confirmed or on hold.
                const shortOutcome = venue.showDate ? formatDayMonth(venue.showDate) : statusLabel(venue.status);
                // Declined venues stay as greyed-out tags so they can still be opened and reopened.
                const declined = venue.status === "declined";
                const className = [
                    "tour-venue-tag",
                    outcome && `tour-venue-tag-${venue.status}`,
                    declined && "tour-venue-tag-declined",
                    venue.clashMessages.length > 0 && "tour-venue-tag-clash",
                ]
                    .filter(Boolean)
                    .join(" ");
                return (
                    <button
                        key={venue.key}
                        className={className}
                        type="button"
                        onClick={venue.onClick}
                        title={[declined ? `${venue.name} declined` : `Update ${venue.name}`, ...venue.clashMessages].join("\n")}
                    >
                        <FaBuilding className="tour-venue-tag-icon" aria-hidden="true" />
                        {venue.name}
                        {outcome && (
                            <span className="tour-venue-tag-outcome">
                                <span className="tour-venue-tag-outcome-full">{outcome}</span>
                                <span className="tour-venue-tag-outcome-short">{shortOutcome}</span>
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

type TourRowProps = {
    outreach: Outreach;
    target: Venue | Promoter;
    // For a promoter, the listed venues it can put shows on at.
    venues: VenueTag[];
    inHouse: boolean;
    // A venue with no promoters linked on the Venues tab.
    noPromoters: boolean;
    overlapMessages: string[];
    latestContact?: ContactLogEntry;
    viaPromoterName?: string;
    clashMessages: string[];
    onUpdate: () => void;
    onOpenLog: () => void;
    onRemove: () => void;
};

export function TourRow({
    outreach,
    target,
    venues,
    inHouse,
    noPromoters,
    overlapMessages,
    latestContact,
    viaPromoterName,
    clashMessages,
    onUpdate,
    onOpenLog,
    onRemove,
}: TourRowProps) {
    const overlapText = overlapMessages.join("\n");
    const kindLabel = outreach.targetType === "venue" ? "Venue" : "Promoter";
    const rowClassName = clashMessages.length > 0
        ? "tour-row-clash"
        : overlapMessages.length > 0 ? "tour-row-overlap" : undefined;

    return (
        <tr className={rowClassName}>
            <td className="tour-cell-name">
                {/* Building for venues, megaphone for promoters; venue tags use the same building. */}
                <div className="tour-row-identity">
                    <span className="tour-row-kind" role="img" aria-label={kindLabel} title={kindLabel}>
                        {outreach.targetType === "venue" ? <FaBuilding /> : <FaBullhorn />}
                    </span>
                    <div>
                        <div className="tour-row-name">
                            {target.name}
                            {overlapMessages.length > 0 && (
                                <span className="tour-row-overlap-icon" role="img" aria-label={overlapText} title={overlapText}>
                                    <FaExclamationTriangle />
                                </span>
                            )}
                        </div>
                        {/* Same pills as the Venues tab. */}
                        {(inHouse || noPromoters) && (
                            <div className="tour-row-inhouse">
                                <span className="entity-card-chip-inhouse">{inHouse ? "In-house" : "No promoters"}</span>
                            </div>
                        )}
                        {venues.length > 0 && <VenueTags venues={venues} />}
                    </div>
                </div>
            </td>
            {/* Status and Links go unlabelled on phones; the pill and icons speak for themselves. */}
            <td className="tour-cell-status">
                <div className="tour-row-status">
                    <StatusBadge status={outreach.status} />
                    {outreach.showDate && (
                        <span className="tour-row-muted">
                            {formatDate(outreach.showDate)}
                            {viaPromoterName && ` · via ${viaPromoterName}`}
                        </span>
                    )}
                </div>
                {clashMessages.map((message) => (
                    <div key={message} className="tour-row-clash-note">{message}</div>
                ))}
            </td>
            <td className="tour-cell-links">
                <SocialLinks
                    website={target.website}
                    instagram={target.instagram}
                    facebook={target.facebook}
                    email={target.email}
                    preferred={target.preferredContact}
                    className="tour-row-links"
                />
            </td>
            <td className="tour-cell-contact" data-label="Last contact">
                {latestContact ? (
                    <button className="tour-row-latest-contact" type="button" onClick={onOpenLog}>
                        {formatDate(latestContact.date)}
                        {latestContact.channel && ` - ${channelLabel(latestContact.channel)}`}
                        {latestContact.note && (
                            <span className="tour-row-latest-note">“{latestContact.note}”</span>
                        )}
                    </button>
                ) : (
                    <span className="tour-row-empty">–</span>
                )}
            </td>
            <td className="tour-cell-menu">
                <CardMenu
                    items={[
                        { label: "Update status", onClick: onUpdate },
                        { label: "Contact log", onClick: onOpenLog },
                        { label: "Remove from city", onClick: onRemove, danger: true },
                    ]}
                />
            </td>
        </tr>
    );
}
