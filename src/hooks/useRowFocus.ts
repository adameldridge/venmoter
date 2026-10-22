import { useEffect } from "react";

export type RowKind = "venue" | "promoter";

// A row another tab sent you to. `seq` changes on every visit, so going to the same row
// twice flashes it again.
export type RowFocus = {
    kind: RowKind;
    id: string;
    seq: number;
};

export function rowId(kind: RowKind, id: string) {
    return `${kind}-row-${id}`;
}

// Scrolls the focused row into view and flashes it green so it's easy to spot.
export function useRowFocus(focus: RowFocus | null) {
    useEffect(() => {
        if (!focus) return;
        const row = document.getElementById(rowId(focus.kind, focus.id));
        if (!row) return;
        row.scrollIntoView({ block: "center" });
        row.animate(
            [{ backgroundColor: "rgba(2, 151, 66, 0.35)" }, { backgroundColor: "rgba(2, 151, 66, 0)" }],
            { duration: 2000, easing: "ease-out" },
        );
    }, [focus]);
}
