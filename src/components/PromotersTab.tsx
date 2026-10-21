import type { PromoterWithVenues, VenueWithPromoters } from "../types/venue";
import PromoterCard from "./PromoterCard";
import ListHeader from "./ListHeader";
import type { StopOutreach } from "../types/tour";

type PromotersTabProps = {
    promoters: PromoterWithVenues[];
    allVenues: VenueWithPromoters[];
    searchInput: string;
    onSearchChange: (search: string) => void;
    onAddPromoter: () => void;
    onEditPromoter: (promoter: PromoterWithVenues) => void;
    onDeletePromoter: (promoter: PromoterWithVenues) => void;
    onManageVenues: (promoter: PromoterWithVenues) => void;
    outreachFor: (promoterId: string) => StopOutreach[];
};

export default function PromotersTab({
    promoters,
    allVenues,
    searchInput,
    onSearchChange,
    onAddPromoter,
    onEditPromoter,
    onDeletePromoter,
    onManageVenues,
    outreachFor,
}: PromotersTabProps) {
    return (
        <div>
            <ListHeader addLabel="Add Promoter" onAdd={onAddPromoter}>
                <input
                    className="search-input"
                    type="search"
                    value={searchInput}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search promoters..."
                    aria-label="Search promoters"
                />
            </ListHeader>

            <div className="card-grid">
                {promoters.map((promoter) => (
                    <PromoterCard
                        key={promoter.id}
                        promoter={promoter}
                        allVenues={allVenues}
                        onEdit={() => onEditPromoter(promoter)}
                        onDelete={() => onDeletePromoter(promoter)}
                        onManageVenues={() => onManageVenues(promoter)}
                        outreach={outreachFor(promoter.id)}
                    />
                ))}
            </div>
        </div>
    );
}
