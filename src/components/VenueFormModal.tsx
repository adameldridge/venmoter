import type { Ref } from "react";
import type { NewVenue, Venue } from "../types/venue";
import { useEntityFormModal, type EntityFormModalHandle } from "../hooks/useEntityFormModal";
import Spinner from "./Spinner";
import PreferredContactField from "./PreferredContactField";
import "./Modal.css";
import "./Forms.css";

type VenueFormModalProps = {
    onSubmit: (venue: NewVenue, editingVenueId: string | null) => Promise<void>;
    onDelete: (venueId: string) => void;
    // A note for when the city no longer matches where the venue is listed on a tour.
    cityWarning: (venueId: string, city: string) => string;
    ref?: Ref<VenueFormModalHandle>;
};

const emptyVenue: NewVenue = {
    name: "",
    city: "",
    website: "",
    instagram: "",
    facebook: "",
    email: "",
    preferredContact: "",
    managesInHouse: false,
};

function toFormValues(venue: Venue): NewVenue {
    return {
        name: venue.name,
        city: venue.city,
        website: venue.website,
        instagram: venue.instagram ?? "",
        facebook: venue.facebook ?? "",
        email: venue.email ?? "",
        preferredContact: venue.preferredContact ?? "",
        managesInHouse: venue.managesInHouse ?? false,
    };
}

export type VenueFormModalHandle = EntityFormModalHandle<Venue>;

function VenueFormModal({ onSubmit, onDelete, cityWarning, ref }: VenueFormModalProps) {
    const {
        modalRef,
        formValues,
        setFormValues,
        editingId: editingVenueId,
        isSaving,
        closeModal,
        closeWithoutReturning,
        handleDialogClose,
        handleChange,
        handleSubmit,
    } = useEntityFormModal<Venue, NewVenue>(ref, {
        emptyValues: emptyVenue,
        toFormValues,
        onSubmit,
    });

    const cityNote = editingVenueId && formValues.city ? cityWarning(editingVenueId, formValues.city) : "";

    return (
        <dialog id="venue-form-modal" ref={modalRef} onClose={handleDialogClose}>
            <div className="modal-box entity-form">
                <div className="modal-title">
                    {editingVenueId ? "Edit venue" : "Add venue"}
                </div>
                <form onSubmit={handleSubmit}>
                    <fieldset className="form-section">
                        <legend>Venue</legend>

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
                            {cityNote && <div className="form-warning">{cityNote}</div>}
                        </div>
                    </fieldset>

                    <fieldset className="form-section">
                        <legend>Contact</legend>

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

                        <PreferredContactField
                            id="venuePreferredContact"
                            value={formValues.preferredContact ?? ""}
                            details={formValues}
                            onChange={(preferredContact) => setFormValues((current) => ({ ...current, preferredContact }))}
                        />
                    </fieldset>

                    <div className="modal-actions">
                        <button className="create-button" type="submit" disabled={isSaving}>
                            {isSaving ? <Spinner size={14} /> : "Save"}
                        </button>
                        <button className="cancel-button" type="button" onClick={closeModal} disabled={isSaving}>
                            Cancel
                        </button>
                    </div>

                    {editingVenueId && (
                        <button
                            className="form-remove-button"
                            type="button"
                            onClick={() => {
                                closeWithoutReturning();
                                onDelete(editingVenueId);
                            }}
                            disabled={isSaving}
                        >
                            Delete venue
                        </button>
                    )}
                </form>
            </div>
        </dialog>
    );
}

export default VenueFormModal;
