import { useState } from "react";

// Collapsed groups are a per-browser convenience, so they're kept in localStorage; storage can
// be unavailable (private mode, blocked site data), in which case everything starts expanded.
function load(storageKey: string): Set<string> {
    try {
        return new Set(JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[]);
    } catch {
        return new Set();
    }
}

function save(storageKey: string, ids: Set<string>) {
    try {
        localStorage.setItem(storageKey, JSON.stringify([...ids]));
    } catch {
        // Not remembered this time; nothing else depends on it.
    }
}

export function useCollapsedGroups(storageKey: string) {
    const [collapsedIds, setCollapsedIds] = useState(() => load(storageKey));

    function setCollapsed(groupId: string, collapsed: boolean) {
        setCollapsedIds((current) => {
            if (current.has(groupId) === collapsed) return current;
            const next = new Set(current);
            if (collapsed) next.add(groupId);
            else next.delete(groupId);
            save(storageKey, next);
            return next;
        });
    }

    return { collapsedIds, setCollapsed };
}
