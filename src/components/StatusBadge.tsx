import { FaPen } from "react-icons/fa";
import { statusLabel, type OutreachStatus } from "../types/tour";
import "./StatusBadge.css";

type StatusBadgeProps = {
    status: OutreachStatus;
    editable?: boolean;
};

export default function StatusBadge({ status, editable }: StatusBadgeProps) {
    return (
        <span className={`status-badge status-badge-${status}`}>
            {statusLabel(status)}
            {editable && <FaPen className="status-badge-edit" aria-hidden="true" />}
        </span>
    );
}
