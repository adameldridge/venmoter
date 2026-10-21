import { useRef, useState, useImperativeHandle, type Ref } from "react";
import { OUTREACH_CHANNELS, OUTREACH_STATUSES, type NewOutreach, type Outreach } from "../types/tour";
import { todayIsoDate } from "../utils/date";
import Spinner from "./Spinner";
import "./Modal.css";
import "./Forms.css";

export type OutreachModalHandle = {
    open: (outreach: Outreach, title: string) => void;
};

type OutreachModalProps = {
    onSave: (values: NewOutreach, outreachId: string) => Promise<void>;
    onRemove: (outreach: Outreach) => void;
    ref?: Ref<OutreachModalHandle>;
};

export default function OutreachModal({ onSave, onRemove, ref }: OutreachModalProps) {
    const modalRef = useRef<HTMLDialogElement>(null);
    const [title, setTitle] = useState("");
    const [existing, setExisting] = useState<Outreach | null>(null);
    const [formValues, setFormValues] = useState<NewOutreach | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useImperativeHandle(ref, () => ({
        open(outreach, title) {
            setTitle(title);
            setExisting(outreach);
            setFormValues({
                tourId: outreach.tourId,
                stopId: outreach.stopId,
                targetType: outreach.targetType,
                targetId: outreach.targetId,
                status: outreach.status,
                channel: outreach.channel ?? "",
                lastContacted: outreach.lastContacted ?? "",
                showDate: outreach.showDate ?? "",
                notes: outreach.notes ?? "",
            });
            modalRef.current?.showModal();
        },
    }));

    function closeModal() {
        modalRef.current?.close();
    }

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) {
        const { name, value } = e.target;
        setFormValues((current) => {
            if (!current) return current;
            const next = { ...current, [name]: value };
            // Moving past "To contact" implies a contact was made; default the date to today.
            if (name === "status" && value !== "to-contact" && !current.lastContacted) {
                next.lastContacted = todayIsoDate();
            }
            return next;
        });
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!formValues || !existing) return;
        setIsSaving(true);
        try {
            await onSave(formValues, existing.id);
            closeModal();
        } catch (error) {
            console.error("Error saving:", error);
        } finally {
            setIsSaving(false);
        }
    }

    function handleRemove() {
        if (!existing) return;
        closeModal();
        onRemove(existing);
    }

    return (
        <dialog id="outreach-modal" ref={modalRef}>
            <div className="modal-box entity-form">
                <div className="modal-title">{title}</div>
                {formValues && (
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="outreachStatus">Status *</label>
                            <select
                                id="outreachStatus"
                                name="status"
                                required
                                value={formValues.status}
                                onChange={handleChange}
                            >
                                {OUTREACH_STATUSES.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="outreachChannel">Channel</label>
                            <select
                                id="outreachChannel"
                                name="channel"
                                value={formValues.channel}
                                onChange={handleChange}
                            >
                                <option value="">—</option>
                                {OUTREACH_CHANNELS.map((channel) => (
                                    <option key={channel.value} value={channel.value}>
                                        {channel.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="outreachLastContacted">Last contacted</label>
                            <input
                                id="outreachLastContacted"
                                name="lastContacted"
                                type="date"
                                value={formValues.lastContacted}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="outreachShowDate">Show date</label>
                            <input
                                id="outreachShowDate"
                                name="showDate"
                                type="date"
                                value={formValues.showDate}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="outreachNotes">Notes</label>
                            <textarea
                                id="outreachNotes"
                                name="notes"
                                rows={3}
                                value={formValues.notes}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="create-button" type="submit" disabled={isSaving}>
                                {isSaving ? <Spinner size={14} /> : "Save"}
                            </button>
                            <button className="cancel-button" type="button" onClick={closeModal} disabled={isSaving}>
                                Cancel
                            </button>
                        </div>

                        <button
                            className="form-remove-button"
                            type="button"
                            onClick={handleRemove}
                            disabled={isSaving}
                        >
                            Remove from city
                        </button>
                    </form>
                )}
            </div>
        </dialog>
    );
}
