import type { Promoter, Venue } from "../types/venue";
import type { Hold } from "../types/tour";
import { formatDate } from "../utils/date";
import CardMenu from "./CardMenu";
import "./StopHolds.css";

type StopHoldsProps = {
    holds: Hold[];
    venues: Venue[];
    promoters: Promoter[];
    onEdit: (hold: Hold) => void;
    onConfirm: (hold: Hold) => void;
    onUnconfirm: (hold: Hold) => void;
    onDelete: (hold: Hold) => void;
};

export default function StopHolds({
    holds,
    venues,
    promoters,
    onEdit,
    onConfirm,
    onUnconfirm,
    onDelete,
}: StopHoldsProps) {
    if (holds.length === 0) return null;

    const sortedHolds = [...holds].sort((a, b) => a.date.localeCompare(b.date));

    return (
        <ul className="stop-holds">
            {sortedHolds.map((hold) => {
                const venue = venues.find((v) => v.id === hold.venueId);
                const promoter = promoters.find((p) => p.id === hold.promoterId);
                const isConfirmed = hold.status === "confirmed";

                return (
                    <li key={hold.id} className={isConfirmed ? "stop-hold stop-hold-confirmed" : "stop-hold"}>
                        <div className="stop-hold-date">{formatDate(hold.date)}</div>
                        <div className="stop-hold-details">
                            <div className="stop-hold-venue">
                                {venue?.name ?? "Unknown venue"}
                                {promoter && <span className="stop-hold-promoter"> · {promoter.name}</span>}
                            </div>
                            {hold.notes && <div className="stop-hold-notes">{hold.notes}</div>}
                        </div>
                        <span className={isConfirmed ? "hold-badge hold-badge-confirmed" : "hold-badge hold-badge-provisional"}>
                            {isConfirmed ? "Confirmed" : "Provisional"}
                        </span>
                        <div className="stop-hold-actions">
                            {!isConfirmed && (
                                <button className="create-button" type="button" onClick={() => onConfirm(hold)}>
                                    Confirm
                                </button>
                            )}
                            <CardMenu
                                items={[
                                    { label: "Edit hold", onClick: () => onEdit(hold) },
                                    ...(isConfirmed
                                        ? [{ label: "Set back to provisional", onClick: () => onUnconfirm(hold) }]
                                        : []),
                                    { label: "Delete hold", onClick: () => onDelete(hold), danger: true },
                                ]}
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
