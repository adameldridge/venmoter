import { statusLabel, type OutreachStatus } from "../types/tour";
import "./StatusBadge.css";

type StatusBadgeProps = {
    status: OutreachStatus;
    promoterBooked?: boolean;
};

export default function StatusBadge({ status, promoterBooked = false }: StatusBadgeProps) {
    return <span className={`status-badge status-badge-${status}`}>{statusLabel(status, promoterBooked)}</span>;
}
