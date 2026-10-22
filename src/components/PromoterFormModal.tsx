import type { Ref } from "react";
import type { NewPromoter, Promoter } from "../types/venue";
import { useEntityFormModal, type EntityFormModalHandle } from "../hooks/useEntityFormModal";
import Spinner from "./Spinner";
import PreferredContactField from "./PreferredContactField";
import "./Modal.css";
import "./Forms.css";

type PromoterFormModalProps = {
    onSubmit: (promoter: NewPromoter, editingPromoterId: string | null) => Promise<void>;
    onDelete: (promoterId: string) => void;
    ref?: Ref<PromoterFormModalHandle>;
};

const emptyPromoter: NewPromoter = {
    name: "",
    website: "",
    instagram: "",
    facebook: "",
    email: "",
    preferredContact: "",
};

function toFormValues(promoter: Promoter): NewPromoter {
    return {
        name: promoter.name,
        website: promoter.website,
        instagram: promoter.instagram ?? "",
        facebook: promoter.facebook ?? "",
        email: promoter.email ?? "",
        preferredContact: promoter.preferredContact ?? "",
    };
}

export type PromoterFormModalHandle = EntityFormModalHandle<Promoter>;

function PromoterFormModal({ onSubmit, onDelete, ref }: PromoterFormModalProps) {
    const {
        modalRef,
        formValues,
        setFormValues,
        editingId: editingPromoterId,
        isSaving,
        closeModal,
        closeWithoutReturning,
        handleDialogClose,
        handleChange,
        handleSubmit,
    } = useEntityFormModal<Promoter, NewPromoter>(ref, {
        emptyValues: emptyPromoter,
        toFormValues,
        onSubmit,
    });

    return (
        <dialog id="promoter-form-modal" ref={modalRef} onClose={handleDialogClose}>
            <div className="modal-box entity-form">
                <div className="modal-title">
                    {editingPromoterId ? "Edit promoter" : "Add promoter"}
                </div>
                <form onSubmit={handleSubmit}>
                    <fieldset className="form-section">
                        <legend>Promoter</legend>

                        <div>
                            <label htmlFor="promoterName">Name *</label>
                            <input
                                id="promoterName"
                                name="name"
                                type="text"
                                required
                                value={formValues.name}
                                onChange={handleChange}
                            />
                        </div>
                    </fieldset>

                    <fieldset className="form-section">
                        <legend>Contact</legend>

                        <div>
                            <label htmlFor="promoterEmail">Email</label>
                            <input
                                id="promoterEmail"
                                name="email"
                                type="email"
                                value={formValues.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="promoterWebsite">Website</label>
                            <input
                                id="promoterWebsite"
                                name="website"
                                type="text"
                                value={formValues.website}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="promoterInstagram">Instagram</label>
                            <input
                                id="promoterInstagram"
                                name="instagram"
                                type="text"
                                value={formValues.instagram}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="promoterFacebook">Facebook</label>
                            <input
                                id="promoterFacebook"
                                name="facebook"
                                type="text"
                                value={formValues.facebook}
                                onChange={handleChange}
                            />
                        </div>

                        <PreferredContactField
                            id="promoterPreferredContact"
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

                    {editingPromoterId && (
                        <button
                            className="form-remove-button"
                            type="button"
                            onClick={() => {
                                closeWithoutReturning();
                                onDelete(editingPromoterId);
                            }}
                            disabled={isSaving}
                        >
                            Delete promoter
                        </button>
                    )}
                </form>
            </div>
        </dialog>
    );
}

export default PromoterFormModal;
