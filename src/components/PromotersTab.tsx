import type { PromoterWithVenues, VenueWithPromoters } from "../types/venue";
import PromoterCard from "./PromoterCard";
import ListHeader from "./ListHeader";

type PromotersTabProps = {
    promoters: PromoterWithVenues[];
    allVenues: VenueWithPromoters[];
    searchInput: string;
    onSearchChange: (search: string) => void;
    canEdit: boolean;
    onAddPromoter: () => void;
    onEditPromoter: (promoter: PromoterWithVenues) => void;
    onDeletePromoter: (promoter: PromoterWithVenues) => void;
    onManageVenues: (promoter: PromoterWithVenues) => void;
};

export default function PromotersTab({
    promoters,
    allVenues,
    searchInput,
    onSearchChange,
    canEdit,
    onAddPromoter,
    onEditPromoter,
    onDeletePromoter,
    onManageVenues,
}: PromotersTabProps) {
    return (
        <div>
            <ListHeader canEdit={canEdit} addLabel="Add Promoter" onAdd={onAddPromoter}>
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
                        canEdit={canEdit}
                        onEdit={() => onEditPromoter(promoter)}
                        onDelete={() => onDeletePromoter(promoter)}
                        onManageVenues={() => onManageVenues(promoter)}
                    />
                ))}
            </div>
        </div>
    );
}
