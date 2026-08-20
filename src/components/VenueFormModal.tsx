import { useRef, useState, forwardRef, useImperativeHandle } from "react";
import type { NewVenue, Venue } from "../types/venue";
import "./VenueFormModal.css";

type VenueFormModalProps = {
    onSubmit: (venue: NewVenue, editingVenueId: string | null) => Promise<void>;
};

const emptyVenue: NewVenue = {
    name: "",
    city: "",
    website: "",
    instagram: "",
    facebook: "",
};

function toFormValues(venue: Venue): NewVenue {
    return {
        name: venue.name,
        city: venue.city,
        website: venue.website,
        instagram: venue.instagram ?? "",
        facebook: venue.facebook ?? "",
    };
}

export type VenueFormModalHandle = {
    open: (venue?: Venue) => void;
};

const VenueFormModal = forwardRef<VenueFormModalHandle, VenueFormModalProps>(
    function VenueFormModal({ onSubmit }, ref) {
        const modalRef = useRef<HTMLDialogElement>(null);
        const [formValues, setFormValues] = useState<NewVenue>(emptyVenue);
        const [editingVenueId, setEditingVenueId] = useState<string | null>(null);

        useImperativeHandle(ref, () => ({
            open(venue) {
                setEditingVenueId(venue?.id ?? null);
                setFormValues(venue ? toFormValues(venue) : emptyVenue);
                modalRef.current?.showModal();
            },
        }));

        function closeModal() {
            setFormValues(emptyVenue);
            setEditingVenueId(null);
            modalRef.current?.close();
        }

        function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
            setFormValues({
                ...formValues,
                [e.target.name]: e.target.value,
            });
        }

        async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
            e.preventDefault();
            try {
                await onSubmit(formValues, editingVenueId);
                closeModal();
            } catch (error) {
                console.error("Error saving venue:", error);
            }
        }

        return (
            <dialog id="venue-form-modal" ref={modalRef}>
                <div className="venue-form">
                    <div className="venue-form-title">
                        {editingVenueId ? "Edit Venue" : "Add Venue"}
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="venueName">Name *</label>
                            <input
                                id="venueName"
                                name="name"
                                type="text"
                                required
                                value={formValues.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="venueCity">City *</label>
                            <input
                                id="venueCity"
                                name="city"
                                type="text"
                                value={formValues.city}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="venueWebsite">Website</label>
                            <input
                                id="venueWebsite"
                                name="website"
                                type="text"
                                value={formValues.website}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="venueInstagram">Instagram</label>
                            <input
                                id="venueInstagram"
                                name="instagram"
                                type="text"
                                value={formValues.instagram}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="venueFacebook">Facebook</label>
                            <input
                                id="venueFacebook"
                                name="facebook"
                                type="text"
                                value={formValues.facebook}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <button className="create-button" type="submit">Save</button>
                            <button className="cancel-button" type="button" onClick={closeModal}>Cancel</button>
                        </div>
                    </form>
                </div>
            </dialog>
        );
    }
);

export default VenueFormModal;
