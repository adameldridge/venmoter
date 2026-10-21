import { useRef, useState, useImperativeHandle, type Ref } from "react";
import type { VenueWithPromoters } from "../types/venue";
import type { Hold, NewHold, TourStop } from "../types/tour";
import Spinner from "./Spinner";
import "./Modal.css";
import "./Forms.css";

export type HoldFormModalHandle = {
    open: (stop: TourStop, cityVenues: VenueWithPromoters[], existing?: Hold) => void;
};

type HoldFormModalProps = {
    onSave: (values: NewHold, editingHoldId: string | null) => Promise<void>;
    ref?: Ref<HoldFormModalHandle>;
};

export default function HoldFormModal({ onSave, ref }: HoldFormModalProps) {
    const modalRef = useRef<HTMLDialogElement>(null);
    const [stop, setStop] = useState<TourStop | null>(null);
    const [cityVenues, setCityVenues] = useState<VenueWithPromoters[]>([]);
    const [existing, setExisting] = useState<Hold | null>(null);
    const [formValues, setFormValues] = useState({ date: "", venueId: "", promoterId: "", notes: "" });
    const [isSaving, setIsSaving] = useState(false);

    useImperativeHandle(ref, () => ({
        open(stop, cityVenues, existing) {
            setStop(stop);
            setCityVenues(cityVenues);
            setExisting(existing ?? null);
            setFormValues({
                date: existing?.date ?? "",
                venueId: existing?.venueId ?? (cityVenues.length === 1 ? cityVenues[0].id : ""),
                promoterId: existing?.promoterId ?? "",
                notes: existing?.notes ?? "",
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
        setFormValues((current) => ({
            ...current,
            [name]: value,
            // Promoter options depend on the venue, so reset it when the venue changes.
            ...(name === "venueId" ? { promoterId: "" } : {}),
        }));
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!stop) return;
        setIsSaving(true);
        try {
            await onSave(
                {
                    tourId: stop.tourId,
                    stopId: stop.id,
                    ...formValues,
                    status: existing?.status ?? "provisional",
                },
                existing?.id ?? null,
            );
            closeModal();
        } catch (error) {
            console.error("Error saving hold:", error);
        } finally {
            setIsSaving(false);
        }
    }

    const selectedVenue = cityVenues.find((venue) => venue.id === formValues.venueId);
    const venuePromoters = [...(selectedVenue?.promoters ?? [])].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <dialog id="hold-form-modal" ref={modalRef}>
            <div className="modal-box entity-form">
                <div className="modal-title">
                    {existing ? "Edit Hold" : "Add Hold"}
                    {stop && <div className="modal-subtitle">{stop.city}</div>}
                </div>

                {cityVenues.length === 0 ? (
                    <>
                        <p className="modal-message">
                            There are no venues in {stop?.city} yet. Add one on the Venues tab first.
                        </p>
                        <div className="modal-actions">
                            <button className="cancel-button" type="button" onClick={closeModal}>
                                Close
                            </button>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="holdDate">Date *</label>
                            <input
                                id="holdDate"
                                name="date"
                                type="date"
                                required
                                value={formValues.date}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="holdVenue">Venue *</label>
                            <select
                                id="holdVenue"
                                name="venueId"
                                required
                                value={formValues.venueId}
                                onChange={handleChange}
                            >
                                <option value="" disabled>Choose a venue…</option>
                                {cityVenues.map((venue) => (
                                    <option value={venue.id} key={venue.id}>{venue.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="holdPromoter">Promoter</label>
                            <select
                                id="holdPromoter"
                                name="promoterId"
                                value={formValues.promoterId}
                                onChange={handleChange}
                                disabled={!selectedVenue}
                            >
                                <option value="">
                                    {selectedVenue && venuePromoters.length === 0 ? "No linked promoters" : "—"}
                                </option>
                                {venuePromoters.map((promoter) => (
                                    <option value={promoter.id} key={promoter.id}>{promoter.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="holdNotes">Notes</label>
                            <textarea
                                id="holdNotes"
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
                )}
            </div>
        </dialog>
    );
}
