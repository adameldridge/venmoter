import { statusLabel, type OutreachStatus } from "../types/tour";
import "./StatusBadge.css";

type StatusBadgeProps = {
    status: OutreachStatus;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    return <span className={`status-badge status-badge-${status}`}>{statusLabel(status)}</span>;
}
