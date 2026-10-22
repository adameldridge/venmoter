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
        setManyCollapsed([groupId], collapsed);
    }

    function setManyCollapsed(groupIds: string[], collapsed: boolean) {
        setCollapsedIds((current) => {
            const changed = groupIds.filter((id) => current.has(id) !== collapsed);
            if (changed.length === 0) return current;
            const next = new Set(current);
            for (const id of changed) {
                if (collapsed) next.add(id);
                else next.delete(id);
            }
            save(storageKey, next);
            return next;
        });
    }

    return { collapsedIds, setCollapsed, setManyCollapsed };
}
