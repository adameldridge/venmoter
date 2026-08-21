import { useState } from "react";
import './Card.css';
import type { VenueWithPromoters, PromoterWithVenues } from "../types/venue";
import { FaPen } from "react-icons/fa";
import SocialLinks from "./SocialLinks";

type VenueCardProps = {
    venue: VenueWithPromoters;
    onEdit: () => void;
    onManagePromoters: () => void;
    allPromoters: PromoterWithVenues[];
};

export default function VenueCard({ venue, onEdit, onManagePromoters, allPromoters }: VenueCardProps) {
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
                <button className="entity-card-edit-button" type="button" onClick={onEdit} aria-label="Edit venue">
                    <FaPen />
                </button>
            </div>
            <div className="entity-card-city">{venue.city}</div>
            <SocialLinks
                website={venue.website}
                instagram={venue.instagram}
                facebook={venue.facebook}
                email={venue.email}
            />

            <div className="entity-card-relations">
                <div className="entity-card-relations-header">
                    <div className="entity-card-relations-title">Promoters</div>
                    <button
                        className="entity-card-edit-button"
                        type="button"
                        onClick={onManagePromoters}
                        aria-label="Manage promoters"
                    >
                        <FaPen />
                    </button>
                </div>

                {venue.promoters.length > 0 ? (
                    <div className="entity-card-chips">
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
