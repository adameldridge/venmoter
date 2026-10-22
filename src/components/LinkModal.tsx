import { useRef, useState, useImperativeHandle, type Ref } from "react";
import type { LinkOption } from "../types/venue";
import Spinner from "./Spinner";
import "./Modal.css";
import "./LinkModal.css";

type LinkModalProps = {
    title: string;
    itemLabel: string;
    cities?: string[];
    onSave: (subjectId: string, selectedIds: string[]) => Promise<void>;
    ref?: Ref<LinkModalHandle>;
};

export type LinkModalHandle = {
    // onClose runs however the dialog closes, e.g. to go back to what opened it.
    open: (subjectId: string, options: LinkOption[], selectedIds: string[], onClose?: () => void) => void;
};

function LinkModal({ title, itemLabel, cities, onSave, ref }: LinkModalProps) {
    const modalRef = useRef<HTMLDialogElement>(null);
    const [subjectId, setSubjectId] = useState<string | null>(null);
    const [options, setOptions] = useState<LinkOption[]>([]);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const onCloseRef = useRef<(() => void) | undefined>(undefined);

    useImperativeHandle(ref, () => ({
        open(subjectId, options, selectedIds, onClose) {
            onCloseRef.current = onClose;
            setSubjectId(subjectId);
            setOptions(options);
            setCheckedIds(new Set(selectedIds));
            setSearch("");
            setSelectedCity("");
            modalRef.current?.showModal();
        },
    }));

    function closeModal() {
        setSubjectId(null);
        setOptions([]);
        setCheckedIds(new Set());
        setSearch("");
        setSelectedCity("");
        modalRef.current?.close();
    }

    function handleDialogClose() {
        const onClose = onCloseRef.current;
        onCloseRef.current = undefined;
        onClose?.();
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

    const visibleOptions = options
        .filter((option) => !selectedCity || option.city === selectedCity)
        .filter((option) => option.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <dialog id="link-modal" ref={modalRef} onClose={handleDialogClose}>
            <div className="modal-box">
                <div className="modal-title">{title}</div>

                <div className="filter-group link-modal-filters">
                    {cities && (
                        <select
                            className="cities-select"
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                        >
                            <option value="">All cities</option>
                            {cities.map((city) => (
                                <option value={city} key={city}>{city}</option>
                            ))}
                        </select>
                    )}

                    <input
                        className="search-input link-modal-search"
                        type="text"
                        placeholder={`Search ${itemLabel}…`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

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
                                {option.city && (
                                    <span className="link-modal-option-city">{option.city}</span>
                                )}
                                {option.detail && (
                                    <span className="link-modal-option-city">{option.detail}</span>
                                )}
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
