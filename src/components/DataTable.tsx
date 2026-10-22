import "./DataTable.css";
import type { ReactNode } from "react";
import { FaBuilding, FaBullhorn, FaChevronDown, FaPen } from "react-icons/fa";
import type { RecordKind } from "../types/venue";

export type DataColumn = {
    label: string;
    className?: string;
};

export function DataTable({ columns, children }: { columns: DataColumn[]; children: ReactNode }) {
    return (
        <div className="data-table-wrap">
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((column, index) => (
                            <th key={index} className={column.className}>
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                {children}
            </table>
        </div>
    );
}

type DataGroupProps = {
    title: string;
    count: number;
    colSpan: number;
    collapsed: boolean;
    onToggle: () => void;
    // Green header, e.g. a city with a confirmed show.
    confirmed?: boolean;
    // Tags and chips after the title.
    extras?: ReactNode;
    // Buttons pinned to the right of the header.
    actions?: ReactNode;
    children: ReactNode;
};

// One group of rows (a city), headed by a full-width row with its toggle, tags and actions.
export function DataGroup({ title, count, colSpan, collapsed, onToggle, confirmed, extras, actions, children }: DataGroupProps) {
    return (
        <tbody className="data-group">
            <tr className={confirmed ? "data-group-row data-group-row-confirmed" : "data-group-row"}>
                <th colSpan={colSpan} scope="rowgroup">
                    <div className="data-group-header">
                        <button
                            className="data-group-toggle"
                            type="button"
                            onClick={onToggle}
                            aria-expanded={!collapsed}
                            title={collapsed ? `Show ${title}` : `Hide ${title}`}
                        >
                            <FaChevronDown className="data-group-chevron" aria-hidden="true" />
                            <span className="data-group-city">{title}</span>
                            <span className="data-group-count">{count}</span>
                        </button>
                        {extras}
                        {actions && <div className="data-group-actions">{actions}</div>}
                    </div>
                </th>
            </tr>
            {collapsed ? null : children}
        </tbody>
    );
}

type NameCellProps = {
    kind: RecordKind;
    name: string;
    // Makes the name a button, e.g. to edit the record or view its details.
    onOpen?: () => void;
    openTitle?: string;
    // Shown right after the name, e.g. a warning icon.
    badge?: ReactNode;
    // Shown under the name, e.g. tags.
    children?: ReactNode;
};

// The first cell of every row: building for venues, megaphone for promoters, then the name.
export function NameCell({ kind, name, onOpen, openTitle, badge, children }: NameCellProps) {
    const kindLabel = kind === "venue" ? "Venue" : "Promoter";
    return (
        <td className="data-cell-name">
            <div className="data-row-identity">
                <span className="data-row-kind" role="img" aria-label={kindLabel} title={kindLabel}>
                    {kind === "venue" ? <FaBuilding /> : <FaBullhorn />}
                </span>
                <div>
                    <div className="data-row-name">
                        {onOpen ? (
                            <button className="data-row-name-link" type="button" onClick={onOpen} title={openTitle}>
                                {name}
                            </button>
                        ) : (
                            name
                        )}
                        {badge}
                    </div>
                    {children}
                </div>
            </div>
        </td>
    );
}

// Dashed chip that adds something in one click, e.g. a suggested venue for a tour city.
export function AddChip({ kind, label, title, onClick }: { kind: RecordKind; label: string; title?: string; onClick: () => void }) {
    return (
        <button className="data-add" type="button" onClick={onClick} title={title}>
            {kind === "venue" ? <FaBuilding aria-hidden="true" /> : <FaBullhorn aria-hidden="true" />}+ {label}
        </button>
    );
}

// Chip at the end of a row's linked chips that opens the dialog for changing that whole list.
export function EditChip({ title, onClick }: { title: string; onClick: () => void }) {
    return (
        <button className="data-add" type="button" onClick={onClick} title={title} aria-label={title}>
            <FaPen aria-hidden="true" />
            Edit
        </button>
    );
}
