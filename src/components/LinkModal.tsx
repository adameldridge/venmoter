import { useRef, useState, useImperativeHandle, type Ref } from "react";
import type { LinkOption } from "../types/venue";
import Spinner from "./Spinner";
import "./Modal.css";
import "./LinkModal.css";

type LinkModalProps = {
    title: string;
    itemLabel: string;
    onSave: (subjectId: string, selectedIds: string[]) => Promise<void>;
    ref?: Ref<LinkModalHandle>;
};

export type LinkModalHandle = {
    open: (subjectId: string, options: LinkOption[], selectedIds: string[]) => void;
};

function LinkModal({ title, itemLabel, onSave, ref }: LinkModalProps) {
    const modalRef = useRef<HTMLDialogElement>(null);
    const [subjectId, setSubjectId] = useState<string | null>(null);
    const [options, setOptions] = useState<LinkOption[]>([]);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useImperativeHandle(ref, () => ({
        open(subjectId, options, selectedIds) {
            setSubjectId(subjectId);
            setOptions(options);
            setCheckedIds(new Set(selectedIds));
            setSearch("");
            modalRef.current?.showModal();
        },
    }));

    function closeModal() {
        setSubjectId(null);
        setOptions([]);
        setCheckedIds(new Set());
        setSearch("");
        modalRef.current?.close();
    }

    function toggleOption(id: string) {
        setCheckedIds((previous) => {
            const next = new Set(previous);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    async function handleSave() {
        if (!subjectId) return;
        setIsSaving(true);
        try {
            await onSave(subjectId, Array.from(checkedIds));
            closeModal();
        } catch (error) {
            console.error("Error saving links:", error);
        } finally {
            setIsSaving(false);
        }
    }

    const visibleOptions = options.filter((option) =>
        option.name.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <dialog id="link-modal" ref={modalRef}>
            <div className="modal-box">
                <div className="modal-title">{title}</div>

                <input
                    className="link-modal-search"
                    type="text"
                    placeholder={`Search ${itemLabel}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="link-modal-list">
                    {visibleOptions.length > 0 ? (
                        visibleOptions.map((option) => (
                            <label className="link-modal-option" key={option.id}>
                                <input
                                    type="checkbox"
                                    checked={checkedIds.has(option.id)}
                                    onChange={() => toggleOption(option.id)}
                                />
                                {option.name}
                            </label>
                        ))
                    ) : (
                        <div className="link-modal-empty">No {itemLabel} found</div>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="create-button" type="button" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Spinner size={14} /> : "Save"}
                    </button>
                    <button className="cancel-button" type="button" onClick={closeModal} disabled={isSaving}>
                        Cancel
                    </button>
                </div>
            </div>
        </dialog>
    );
}

export default LinkModal;
