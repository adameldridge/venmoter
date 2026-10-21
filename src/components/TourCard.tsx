import './Cards.css';
import type { Promoter, Venue } from "../types/venue";
import { channelLabel, type ContactLogEntry, type Outreach } from "../types/tour";
import { formatDate, todayIsoDate } from "../utils/date";
import SocialLinks from "./SocialLinks";
import CardMenu from "./CardMenu";
import StatusBadge from "./StatusBadge";

type TourCardProps = {
    outreach: Outreach;
    target: Venue | Promoter;
    latestContact?: ContactLogEntry;
    viaPromoterName?: string;
    clashMessages: string[];
    onUpdate: () => void;
    onOpenLog: () => void;
    onRemove: () => void;
};

export default function TourCard({
    outreach,
    target,
    latestContact,
    viaPromoterName,
    clashMessages,
    onUpdate,
    onOpenLog,
    onRemove,
}: TourCardProps) {
    const typeLabel = outreach.targetType === "venue" ? "Venue" : "Promoter";
    const isClosed = outreach.status === "confirmed" || outreach.status === "declined";
    const followUpDue = !isClosed && outreach.followUpDate && outreach.followUpDate <= todayIsoDate();

    return (
        <div className={clashMessages.length > 0 ? "entity-card entity-card-clash" : "entity-card"}>
            <div className="entity-card-header">
                <div>
                    <div className="entity-card-title">{target.name}</div>
                    <div className="entity-card-type">{typeLabel}</div>
                </div>
                <CardMenu
                    items={[
                        { label: "Update status", onClick: onUpdate },
                        { label: "Contact log", onClick: onOpenLog },
                        { label: "Remove from city", onClick: onRemove, danger: true },
                    ]}
                />
            </div>
            <div className="entity-card-status">
                <StatusBadge status={outreach.status} />
                {outreach.showDate && (
                    <span className="entity-card-status-date">
                        {formatDate(outreach.showDate)}
                        {viaPromoterName && ` · via ${viaPromoterName}`}
                    </span>
                )}
            </div>
            {clashMessages.map((message) => (
                <div key={message} className="entity-card-clash-note">{message}</div>
            ))}
            <SocialLinks
                website={target.website}
                instagram={target.instagram}
                facebook={target.facebook}
                email={target.email}
            />

            {(latestContact || outreach.followUpDate || outreach.notes) && (
                <div className="entity-card-relations">
                    <div className="entity-card-outreach">
                        {latestContact && (
                            <button className="entity-card-latest-contact" type="button" onClick={onOpenLog}>
                                {formatDate(latestContact.date)}
                                {latestContact.channel && ` - ${channelLabel(latestContact.channel)}`}
                                {latestContact.note && (
                                    <span className="entity-card-outreach-latest">“{latestContact.note}”</span>
                                )}
                            </button>
                        )}
                        {outreach.followUpDate && !isClosed && (
                            <div className={followUpDue ? "entity-card-follow-up-due" : undefined}>
                                Follow up by {formatDate(outreach.followUpDate)}
                            </div>
                        )}
                        {outreach.notes && <div className="entity-card-outreach-notes">{outreach.notes}</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
