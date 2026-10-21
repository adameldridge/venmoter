import { useRef, useState, useImperativeHandle, type Ref } from "react";
import type { Promoter } from "../types/venue";
import { hasShowDate, statusesFor, type NewOutreach, type Outreach } from "../types/tour";
import Spinner from "./Spinner";
import "./Modal.css";
import "./Forms.css";

export type OutreachModalHandle = {
    open: (outreach: Outreach, title: string) => void;
};

type OutreachModalProps = {
    linkedPromoters: (venueId: string) => Promoter[];
    onSave: (values: NewOutreach, outreachId: string) => Promise<void>;
    onRemove: (outreach: Outreach) => void;
    ref?: Ref<OutreachModalHandle>;
};

export default function OutreachModal({
    linkedPromoters,
    onSave,
    onRemove,
    ref,
}: OutreachModalProps) {
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
                showDate: outreach.showDate,
                viaPromoterId: outreach.viaPromoterId,
                followUpDate: outreach.followUpDate,
                notes: outreach.notes,
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
        setFormValues((current) => (current ? { ...current, [name]: value } : current));
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!formValues || !existing) return;
        const dated = hasShowDate(formValues.status);
        setIsSaving(true);
        try {
            await onSave(
                {
                    ...formValues,
                    showDate: dated ? formValues.showDate : "",
                    viaPromoterId: dated ? formValues.viaPromoterId : "",
                },
                existing.id,
            );
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

    const isVenue = formValues?.targetType === "venue";
    const showDateFields = !!formValues && hasShowDate(formValues.status);
    const viaOptions = isVenue && formValues ? linkedPromoters(formValues.targetId) : [];

    return (
        <dialog id="outreach-modal" ref={modalRef}>
            <div className="modal-box entity-form">
                <div className="modal-title">{title}</div>
                {formValues && (
                    <>
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
                                    {statusesFor(formValues.targetType).map((status) => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {showDateFields && (
                                <>
                                    <div>
                                        <label htmlFor="outreachShowDate">Show date *</label>
                                        <input
                                            id="outreachShowDate"
                                            name="showDate"
                                            type="date"
                                            required
                                            value={formValues.showDate}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="outreachVia">Via promoter</label>
                                        <select
                                            id="outreachVia"
                                            name="viaPromoterId"
                                            value={formValues.viaPromoterId}
                                            onChange={handleChange}
                                        >
                                            <option value="">
                                                {viaOptions.length === 0 ? "No linked promoters" : "— None (direct)"}
                                            </option>
                                            {viaOptions.map((promoter) => (
                                                <option key={promoter.id} value={promoter.id}>
                                                    {promoter.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div>
                                <label htmlFor="outreachFollowUp">Follow up by</label>
                                <input
                                    id="outreachFollowUp"
                                    name="followUpDate"
                                    type="date"
                                    value={formValues.followUpDate}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="outreachNotes">Notes</label>
                                <textarea
                                    id="outreachNotes"
                                    name="notes"
                                    rows={2}
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
                        </form>

                        <button
                            className="form-remove-button"
                            type="button"
                            onClick={handleRemove}
                            disabled={isSaving}
                        >
                            Remove from city
                        </button>
                    </>
                )}
            </div>
        </dialog>
    );
}
