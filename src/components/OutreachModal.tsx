import { useRef, useState, useImperativeHandle, type Ref } from "react";
import type { Promoter } from "../types/venue";
import { hasShowDate, statusLabel, statusesFor, type NewOutreach, type Outreach } from "../types/tour";
import Spinner from "./Spinner";
import "./Modal.css";
import "./Forms.css";

export type OutreachModalHandle = {
    open: (outreach: Outreach, title: string) => void;
};

type OutreachModalProps = {
    linkedPromoters: (venueId: string) => Promoter[];
    isInHouse: (venueId: string) => boolean;
    onSave: (values: NewOutreach, outreachId: string) => Promise<void>;
    onRemove: (outreach: Outreach) => void;
    ref?: Ref<OutreachModalHandle>;
};

export default function OutreachModal({
    linkedPromoters,
    isInHouse,
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
    const inHouse = isVenue && !!formValues && isInHouse(formValues.targetId);
    // Same rule as isPromoterBooked, from the props this modal is given.
    const promoterBooked = isVenue && !inHouse && viaOptions.length > 0;
    // Keep a status that no longer fits the booking method selectable, so saving doesn't silently change it.
    const statusOptions = formValues ? statusesFor(formValues.targetType, promoterBooked) : [];
    if (formValues && !statusOptions.some((s) => s.value === formValues.status)) {
        statusOptions.push(...statusesFor(formValues.targetType).filter((s) => s.value === formValues.status));
    }
    // Confirming a promoter-booked venue needs to say which promoter booked it (holds can wait).
    const bookedByRequired = promoterBooked && formValues?.status === "confirmed";
    const bookedByEmptyLabel = inHouse
        ? "In-house"
        : viaOptions.length === 0
            ? "Direct (no linked promoters)"
            : bookedByRequired ? "Choose a promoter…" : "Not decided yet";
    const viaNames = viaOptions.map((p) => p.name).join(", ");
    const bookingMethod = inHouse
        ? viaOptions.length > 0 ? `In-house, or via promoter: ${viaNames}` : "In-house"
        : promoterBooked ? `Via promoter: ${viaNames}` : "Direct (no promoter linked)";

    return (
        <dialog id="outreach-modal" ref={modalRef}>
            <div className="modal-box entity-form">
                <div className="modal-title">
                    Update status
                    <div className="modal-subtitle">{title}</div>
                </div>
                {formValues && (
                    <>
                        <form onSubmit={handleSubmit}>
                            {isVenue && (
                                <div className="outreach-booking-method">
                                    <span>Booking</span> {bookingMethod}
                                </div>
                            )}

                            <div>
                                <label htmlFor="outreachStatus">Status *</label>
                                <select
                                    id="outreachStatus"
                                    name="status"
                                    required
                                    value={formValues.status}
                                    onChange={handleChange}
                                >
                                    {statusOptions.map((status) => (
                                        <option key={status.value} value={status.value}>
                                            {statusLabel(status.value, promoterBooked)}
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
                                        <label htmlFor="outreachVia">Booked by{bookedByRequired && " *"}</label>
                                        <select
                                            id="outreachVia"
                                            name="viaPromoterId"
                                            required={bookedByRequired}
                                            value={formValues.viaPromoterId}
                                            onChange={handleChange}
                                        >
                                            <option value="" disabled={bookedByRequired}>
                                                {bookedByEmptyLabel}
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
