import "./TourTable.css";
import type { ReactNode } from "react";
import { FaBuilding, FaChevronDown, FaExclamationTriangle, FaPlus, FaRegClock } from "react-icons/fa";
import type { Promoter, Venue } from "../types/venue";
import { channelLabel, statusLabel, type ContactLogEntry, type Outreach, type OutreachStatus } from "../types/tour";
import { formatDate, formatDayMonth } from "../utils/date";
import SocialLinks from "./SocialLinks";
import CardMenu from "./CardMenu";
import StatusBadge from "./StatusBadge";
import { AddChip, DataGroup, DataTable, NameCell } from "./DataTable";

const COLUMNS = [
    { label: "Name", className: "data-col-name" },
    { label: "Status", className: "data-col-status" },
    { label: "Links", className: "data-col-links" },
    { label: "Last contact" },
];

export function TourTable({ children }: { children: ReactNode }) {
    return <DataTable columns={COLUMNS}>{children}</DataTable>;
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
    onShowOnly: () => void;
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
    onShowOnly,
    onRemove,
    children,
}: TourGroupProps) {
    return (
        <DataGroup
            title={city}
            count={count}
            colSpan={COLUMNS.length}
            collapsed={collapsed}
            onToggle={onToggle}
            confirmed={confirmed}
            extras={
                <>
                    {confirmedVenues.length > 0 && <VenueTags venues={confirmedVenues} />}
                    {availableVenues.map((venue) => (
                        <AddChip
                            key={venue.id}
                            kind="venue"
                            label={venue.name}
                            onClick={() => onAddVenue(venue.id)}
                            title={`Add ${venue.name} to ${city}${venue.detail ? ` (${venue.detail})` : ""}`}
                        />
                    ))}
                    {availablePromoters.map((promoter) => (
                        <AddChip
                            key={promoter.id}
                            kind="promoter"
                            label={promoter.name}
                            onClick={() => onAddPromoter(promoter.id)}
                            title={`Add ${promoter.name} to ${city}: works with ${promoter.venueNames.join(", ")}`}
                        />
                    ))}
                </>
            }
            actions={
                <CardMenu
                    items={[
                        { label: `Show only ${city}`, onClick: onShowOnly },
                        { label: "Remove city", onClick: onRemove, danger: true },
                    ]}
                />
            }
        >
            {count === 0 ? (
                <tr className="data-group-empty">
                    <td colSpan={COLUMNS.length}>
                        {availableVenues.length > 0
                            ? "Nothing added yet. Pick from the venues above."
                            : `No ${city} venues on the Venues tab yet.`}
                    </td>
                </tr>
            ) : (
                children
            )}
        </DataGroup>
    );
}

// A confirmed venue in the city header, shown with its date; clicking opens its booking.
export type VenueTag = {
    key: string;
    name: string;
    status: OutreachStatus;
    showDate: string;
    clashMessages: string[];
    onClick: () => void;
};

function VenueTags({ venues }: { venues: VenueTag[] }) {
    return (
        <div className="data-tags">
            {venues.map((venue) => {
                const outcome = venue.status === "to-contact"
                    ? ""
                    : `${statusLabel(venue.status)}${venue.showDate ? ` ${formatDate(venue.showDate)}` : ""}`;
                // Phones show just "15 Apr"; the tag's colour already says confirmed or on hold.
                const shortOutcome = venue.showDate ? formatDayMonth(venue.showDate) : statusLabel(venue.status);
                // Declined venues stay as greyed-out tags so they can still be opened and reopened.
                const declined = venue.status === "declined";
                const className = [
                    "data-tag",
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
                        <FaBuilding className="data-tag-icon" aria-hidden="true" />
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
    // A venue booked through the promoter row above it: indented, and without Last contact,
    // since it's the promoter that gets contacted.
    nested?: boolean;
    // How the venue is booked ("In-house", "No promoters", …), if worth saying.
    bookingNote?: string;
    // A promoter's venues nested below it, which it can fold away.
    venueCount?: number;
    venuesCollapsed?: boolean;
    onToggleVenues?: () => void;
    // A venue booked through its promoters, whose statuses read differently.
    promoterBooked: boolean;
    overlapMessages: string[];
    latestContact?: ContactLogEntry;
    viaPromoterName?: string;
    clashMessages: string[];
    onUpdate: () => void;
    onOpenLog: () => void;
    // Shows the venue or promoter's contact details and links.
    onViewTarget: () => void;
};

export function TourRow({
    outreach,
    target,
    nested = false,
    bookingNote,
    venueCount = 0,
    venuesCollapsed = false,
    onToggleVenues,
    promoterBooked,
    overlapMessages,
    latestContact,
    viaPromoterName,
    clashMessages,
    onUpdate,
    onOpenLog,
    onViewTarget,
}: TourRowProps) {
    const overlapText = overlapMessages.join("\n");
    const rowClassName = [
        nested && "tour-row-nested",
        clashMessages.length > 0 ? "tour-row-clash" : overlapMessages.length > 0 && "tour-row-overlap",
    ]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
        <tr className={rowClassName}>
            {/* Venue tags use the same building icon as venue rows. */}
            <NameCell
                kind={outreach.targetType}
                name={target.name}
                onOpen={onViewTarget}
                openTitle={`View ${target.name}`}
                // Top-level rows keep the chevron's slot even without one, so names line up.
                leading={nested ? undefined : venueCount > 0 && onToggleVenues ? (
                    <button
                        className="tour-row-venues-toggle"
                        type="button"
                        onClick={onToggleVenues}
                        aria-expanded={!venuesCollapsed}
                        aria-label={venuesCollapsed ? "Show venues" : "Hide venues"}
                        title={venuesCollapsed ? "Show venues" : "Hide venues"}
                    >
                        <FaChevronDown className="tour-row-venues-chevron" aria-hidden="true" />
                    </button>
                ) : (
                    <span className="tour-row-venues-toggle-slot" />
                )}
                badge={
                    <>
                        {/* How the venue is booked, as a quiet note on the name's line. */}
                        {bookingNote && <span className="tour-row-name-note">{bookingNote}</span>}
                        {/* What's folded away, only while it is. */}
                        {venueCount > 0 && venuesCollapsed && (
                            <span className="tour-row-name-count">
                                {venueCount} {venueCount === 1 ? "venue" : "venues"}
                            </span>
                        )}
                        {overlapMessages.length > 0 && (
                            <span className="tour-row-overlap-icon" role="img" aria-label={overlapText} title={overlapText}>
                                <FaExclamationTriangle />
                            </span>
                        )}
                    </>
                }
            />
            {/* Status and Links go unlabelled on phones; the pill and icons speak for themselves. */}
            <td className="data-cell-status">
                <div className="data-row-status">
                    <button className="data-badge-button" type="button" onClick={onUpdate} title="Update status">
                        <StatusBadge status={outreach.status} promoterBooked={promoterBooked} />
                    </button>
                    {outreach.showDate && (
                        <span className="data-row-muted">
                            {formatDate(outreach.showDate)}
                            {viaPromoterName && ` · via ${viaPromoterName}`}
                        </span>
                    )}
                </div>
                {clashMessages.map((message) => (
                    <div key={message} className="tour-row-clash-note">{message}</div>
                ))}
            </td>
            <td className="data-cell-links">
                <SocialLinks
                    website={target.website}
                    instagram={target.instagram}
                    facebook={target.facebook}
                    email={target.email}
                    preferred={target.preferredContact}
                />
            </td>
            {nested ? (
                <td />
            ) : (
                <td
                    className={`data-cell-full tour-cell-contact${latestContact ? "" : " tour-cell-contact-empty"}`}
                    data-label="Last contact"
                >
                    {/* Both open the log, which takes a new entry above the history. */}
                    <div className="tour-row-contact">
                        {latestContact && (
                            <button
                                className="tour-row-latest-contact"
                                type="button"
                                onClick={onOpenLog}
                                title="View contact history"
                            >
                                {/* Stands in for the column heading on phones, where there's none. */}
                                <FaRegClock className="tour-row-latest-icon" aria-label="Last contact" />
                                <span className="tour-row-latest-when">
                                    {formatDate(latestContact.date)}
                                    {latestContact.channel && ` · ${channelLabel(latestContact.channel)}`}
                                </span>
                                {latestContact.note && (
                                    <span className="tour-row-latest-note">“{latestContact.note}”</span>
                                )}
                            </button>
                        )}
                        <button
                            className="tour-row-log-button"
                            type="button"
                            onClick={onOpenLog}
                            aria-label="Log contact"
                            title="Log contact"
                        >
                            <FaPlus />
                        </button>
                    </div>
                </td>
            )}
        </tr>
    );
}
