import { forwardRef } from "react";
import type { NewPromoter, Promoter } from "../types/venue";
import { useEntityFormModal, type EntityFormModalHandle } from "../hooks/useEntityFormModal";
import Spinner from "./Spinner";
import "./FormModal.css";

type PromoterFormModalProps = {
    onSubmit: (promoter: NewPromoter, editingPromoterId: string | null) => Promise<void>;
};

const emptyPromoter: NewPromoter = {
    name: "",
    website: "",
    instagram: "",
    facebook: "",
    email: "",
};

function toFormValues(promoter: Promoter): NewPromoter {
    return {
        name: promoter.name,
        website: promoter.website,
        instagram: promoter.instagram ?? "",
        facebook: promoter.facebook ?? "",
        email: promoter.email ?? "",
    };
}

export type PromoterFormModalHandle = EntityFormModalHandle<Promoter>;

const PromoterFormModal = forwardRef<PromoterFormModalHandle, PromoterFormModalProps>(
    function PromoterFormModal({ onSubmit }, ref) {
        const {
            modalRef,
            formValues,
            editingId: editingPromoterId,
            isSaving,
            closeModal,
            handleChange,
            handleSubmit,
        } = useEntityFormModal<Promoter, NewPromoter>(ref, {
            emptyValues: emptyPromoter,
            toFormValues,
            onSubmit,
        });

        return (
            <dialog id="promoter-form-modal" ref={modalRef}>
                <div className="entity-form">
                    <div className="entity-form-title">
                        {editingPromoterId ? "Edit Promoter" : "Add Promoter"}
                    </div>
                    <form onSubmit={handleSubmit}>
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
);

export default PromoterFormModal;
