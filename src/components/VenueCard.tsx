import './VenueCard.css';
import type { VenueWithPromoters } from "../types/venue";
import { FaLink, FaFacebook, FaInstagram  } from "react-icons/fa";

type VenueCardProps = {
    venue: VenueWithPromoters;
};

export default function VenueCard({ venue }: VenueCardProps) {
    return (
        <div className="venue-card">
            <div className="venue-card-title">{venue.name}</div>
            <div className="venue-card-city">{venue.city}</div>
            <div className="venue-card-social-icons">
                <a href={venue.website} target="_blank"><FaLink /></a>
                <a href={venue.instagram} target="_blank"><FaInstagram /></a>
                <a href={venue.facebook} target="_blank"><FaFacebook /></a>
            </div>

            <div className="venue-card-promoters">
                <div className="venue-card-promoters-title">Promoters</div>

                <div className="venue-card-promoters-list">
                    {venue.promoters.length > 0 ? (
                        <ul>
                            {venue.promoters.map((promoter) => (
                                <li key={promoter.id}>
                                    <a
                                        href={promoter.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {promoter.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="venue-card-promoters-empty">No promoters</div>
                    )}
                </div>
            </div>
        </div>
    );
}