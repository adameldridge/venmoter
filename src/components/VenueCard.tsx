import { useState } from "react";
import './Cards.css';
import type { VenueWithPromoters, PromoterWithVenues } from "../types/venue";
import SocialLinks from "./SocialLinks";
import CardMenu from "./CardMenu";
import StatusBadge from "./StatusBadge";
import type { StopOutreach } from "../types/tour";
import { formatDate } from "../utils/date";

type VenueCardProps = {
    venue: VenueWithPromoters;
    onEdit: () => void;
    onDelete: () => void;
    onManagePromoters: () => void;
    allPromoters: PromoterWithVenues[];
    outreach: StopOutreach[];
    onOpenOutreach: (stopOutreach: StopOutreach) => void;
};

export default function VenueCard({ venue, onEdit, onDelete, onManagePromoters, allPromoters, outreach, onOpenOutreach }: VenueCardProps) {
    const [activePromoterId, setActivePromoterId] = useState<string | null>(null);

    function toggleActivePromoter(promoterId: string) {
        setActivePromoterId((current) => (current === promoterId ? null : promoterId));
    }

    const activePromoter = allPromoters.find((promoter) => promoter.id === activePromoterId);
    const activePromoterOtherVenues = activePromoter?.venues.filter((v) => v.id !== venue.id) ?? [];

    return (
        <div className="entity-card">
            <div className="entity-card-header">
                <div className="entity-card-title">{venue.name}</div>
                <CardMenu
                    items={[
                        { label: "Edit venue", onClick: onEdit },
                        { label: "Edit promoters", onClick: onManagePromoters },
                        { label: "Delete venue", onClick: onDelete, danger: true },
                    ]}
                />
            </div>
            {outreach.length > 0 && (
                <div className="entity-card-statuses">
                    {outreach.map((stopOutreach) => (
                        <button
                            key={stopOutreach.outreach.id}
                            className="entity-card-status"
                            type="button"
                            onClick={() => onOpenOutreach(stopOutreach)}
                        >
                            <StatusBadge status={stopOutreach.outreach.status} editable />
                            <span className="entity-card-status-date">
                                {stopOutreach.city}
                                {stopOutreach.outreach.showDate && ` · ${formatDate(stopOutreach.outreach.showDate)}`}
                            </span>
                        </button>
                    ))}
                </div>
            )}
            <SocialLinks
                website={venue.website}
                instagram={venue.instagram}
                facebook={venue.facebook}
                email={venue.email}
            />

            <div className="entity-card-relations">
                <div className="entity-card-relations-header">
                    <div className="entity-card-relations-title">Promoters</div>
                </div>

                {venue.promoters.length > 0 || venue.managesInHouse ? (
                    <div className="entity-card-chips">
                        {venue.managesInHouse && (
                            <span className="entity-card-chip-inhouse">In-house</span>
                        )}
                        {venue.promoters.map((promoter) => (
                            <button
                                key={promoter.id}
                                type="button"
                                className={
                                    promoter.id === activePromoterId
                                        ? "entity-card-chip entity-card-chip-active"
                                        : "entity-card-chip"
                                }
                                onClick={() => toggleActivePromoter(promoter.id)}
                            >
                                {promoter.name}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="entity-card-relations-empty">No promoters</div>
                )}

                {activePromoter && (
                    <div className="entity-card-chip-detail">
                        <div className="entity-card-chip-detail-title">{activePromoter.name}</div>
                        <SocialLinks
                            website={activePromoter.website}
                            instagram={activePromoter.instagram}
                            facebook={activePromoter.facebook}
                            email={activePromoter.email}
                            className="entity-card-chip-detail-icons"
                        />
                        <div className="entity-card-chip-detail-relations">
                            {activePromoterOtherVenues.length > 0
                                ? `Also promotes at: ${activePromoterOtherVenues.map((v) => v.name).join(", ")}`
                                : "Not linked to any other venues"}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
