import type { AttentionItem, AttentionKind } from "../utils/tourInsights";
import { NO_REPLY_DAYS } from "../utils/tourInsights";
import "./NeedsAttention.css";

const GROUPS: { kind: AttentionKind; label: string }[] = [
    { kind: "no-reply", label: `No reply after ${NO_REPLY_DAYS} days` },
];

type NeedsAttentionProps = {
    items: AttentionItem[];
    onSelect: (item: AttentionItem) => void;
};

export default function NeedsAttention({ items, onSelect }: NeedsAttentionProps) {
    if (items.length === 0) return null;

    return (
        <details className="needs-attention" open>
            <summary className="needs-attention-summary">
                Needs attention
                <span className="needs-attention-count">{items.length}</span>
            </summary>

            {GROUPS.map(({ kind, label }) => {
                const groupItems = items.filter((item) => item.kind === kind);
                if (groupItems.length === 0) return null;

                return (
                    <div key={kind} className={`needs-attention-group needs-attention-${kind}`}>
                        <div className="needs-attention-group-title">{label}</div>
                        <ul>
                            {groupItems.map((item) => (
                                <li key={item.key}>
                                    <button type="button" className="needs-attention-item" onClick={() => onSelect(item)}>
                                        {item.message}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </details>
    );
}
