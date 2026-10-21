import './Cards.css';
import type { Promoter, Venue } from "../types/venue";
import { channelLabel, type Outreach } from "../types/tour";
import { formatDate } from "../utils/date";
import SocialLinks from "./SocialLinks";
import CardMenu from "./CardMenu";
import StatusBadge from "./StatusBadge";

type TourCardProps = {
    outreach: Outreach;
    target: Venue | Promoter;
    onUpdate: () => void;
    onRemove: () => void;
};

export default function TourCard({ outreach, target, onUpdate, onRemove }: TourCardProps) {
    const typeLabel = outreach.targetType === "venue" ? "Venue" : "Promoter";

    return (
        <div className="entity-card">
            <div className="entity-card-header">
                <div>
                    <div className="entity-card-title">{target.name}</div>
                    <div className="entity-card-type">{typeLabel}</div>
                </div>
                <CardMenu
                    items={[
                        { label: "Update status", onClick: onUpdate },
                        { label: "Remove from city", onClick: onRemove, danger: true },
                    ]}
                />
            </div>
            <button className="entity-card-status" type="button" onClick={onUpdate}>
                <StatusBadge status={outreach.status} editable />
                {outreach.showDate && (
                    <span className="entity-card-status-date">{formatDate(outreach.showDate)}</span>
                )}
            </button>
            <SocialLinks
                website={target.website}
                instagram={target.instagram}
                facebook={target.facebook}
                email={target.email}
            />

            {(outreach.lastContacted || outreach.channel || outreach.notes) && (
                <div className="entity-card-relations">
                    <div className="entity-card-relations-header">
                        <div className="entity-card-relations-title">Outreach</div>
                    </div>
                    <div className="entity-card-outreach">
                        {(outreach.lastContacted || outreach.channel) && (
                            <div>
                                Contacted
                                {outreach.lastContacted && ` ${formatDate(outreach.lastContacted)}`}
                                {outreach.channel && ` via ${channelLabel(outreach.channel)}`}
                            </div>
                        )}
                        {outreach.notes && <div className="entity-card-outreach-notes">{outreach.notes}</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
