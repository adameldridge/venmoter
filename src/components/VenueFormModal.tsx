import type { Ref } from "react";
import type { NewVenue, Venue } from "../types/venue";
import { useEntityFormModal, type EntityFormModalHandle } from "../hooks/useEntityFormModal";
import Spinner from "./Spinner";
import "./Modal.css";
import "./Forms.css";

type VenueFormModalProps = {
    onSubmit: (venue: NewVenue, editingVenueId: string | null) => Promise<void>;
    ref?: Ref<VenueFormModalHandle>;
};

const emptyVenue: NewVenue = {
    name: "",
    city: "",
    website: "",
    instagram: "",
    facebook: "",
    email: "",
};

function toFormValues(venue: Venue): NewVenue {
    return {
        name: venue.name,
        city: venue.city,
        website: venue.website,
        instagram: venue.instagram ?? "",
        facebook: venue.facebook ?? "",
        email: venue.email ?? "",
    };
}

export type VenueFormModalHandle = EntityFormModalHandle<Venue>;

function VenueFormModal({ onSubmit, ref }: VenueFormModalProps) {
    const {
        modalRef,
        formValues,
        editingId: editingVenueId,
        isSaving,
        closeModal,
        handleChange,
        handleSubmit,
    } = useEntityFormModal<Venue, NewVenue>(ref, {
        emptyValues: emptyVenue,
        toFormValues,
        onSubmit,
    });

    return (
        <dialog id="venue-form-modal" ref={modalRef}>
            <div className="modal-box entity-form">
                <div className="modal-title">
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
                        <label htmlFor="venueEmail">Email</label>
                        <input
                            id="venueEmail"
                            name="email"
                            type="email"
                            value={formValues.email}
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
            </div>
        </dialog>
    );
}

export default VenueFormModal;
