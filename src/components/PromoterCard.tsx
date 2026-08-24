import { useState } from "react";
import './Card.css';
import type { PromoterWithVenues, VenueWithPromoters } from "../types/venue";
import { FaPen } from "react-icons/fa";
import SocialLinks from "./SocialLinks";

type PromoterCardProps = {
    promoter: PromoterWithVenues;
    onEdit: () => void;
    onManageVenues: () => void;
    allVenues: VenueWithPromoters[];
    canEdit: boolean;
};

export default function PromoterCard({ promoter, onEdit, onManageVenues, allVenues, canEdit }: PromoterCardProps) {
    const [activeVenueId, setActiveVenueId] = useState<string | null>(null);

    function toggleActiveVenue(venueId: string) {
        setActiveVenueId((current) => (current === venueId ? null : venueId));
    }

    const activeVenue = allVenues.find((venue) => venue.id === activeVenueId);
    const activeVenueOtherPromoters = activeVenue?.promoters.filter((p) => p.id !== promoter.id) ?? [];

    return (
        <div className="entity-card">
            <div className="entity-card-header">
                <div className="entity-card-title">{promoter.name}</div>
                {canEdit && (
                    <button className="entity-card-edit-button" type="button" onClick={onEdit} aria-label="Edit promoter">
                        <FaPen />
                    </button>
                )}
            </div>
            <SocialLinks
                website={promoter.website}
                instagram={promoter.instagram}
                facebook={promoter.facebook}
                email={promoter.email}
            />

            <div className="entity-card-relations">
                <div className="entity-card-relations-header">
                    <div className="entity-card-relations-title">Venues</div>
                    {canEdit && (
                        <button
                            className="entity-card-edit-button"
                            type="button"
                            onClick={onManageVenues}
                            aria-label="Manage venues"
                        >
                            <FaPen />
                        </button>
                    )}
                </div>

                {promoter.venues.length > 0 ? (
                    <div className="entity-card-chips">
                        {promoter.venues.map((venue) => (
                            <button
                                key={venue.id}
                                type="button"
                                className={
                                    venue.id === activeVenueId
                                        ? "entity-card-chip entity-card-chip-active"
                                        : "entity-card-chip"
                                }
                                onClick={() => toggleActiveVenue(venue.id)}
                            >
                                {venue.name}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="entity-card-relations-empty">No venues</div>
                )}

                {activeVenue && (
                    <div className="entity-card-chip-detail">
                        <div className="entity-card-chip-detail-title">{activeVenue.name}</div>
                        <div className="entity-card-chip-detail-city">{activeVenue.city}</div>
                        <SocialLinks
                            website={activeVenue.website}
                            instagram={activeVenue.instagram}
                            facebook={activeVenue.facebook}
                            email={activeVenue.email}
                            className="entity-card-chip-detail-icons"
                        />
                        <div className="entity-card-chip-detail-relations">
                            {activeVenueOtherPromoters.length > 0
                                ? `Also booked by: ${activeVenueOtherPromoters.map((p) => p.name).join(", ")}`
                                : "Not linked to any other promoters"}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
