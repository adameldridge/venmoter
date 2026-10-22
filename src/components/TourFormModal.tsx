import type { Ref } from "react";
import type { NewTour, Tour } from "../types/tour";
import { useEntityFormModal, type EntityFormModalHandle } from "../hooks/useEntityFormModal";
import Spinner from "./Spinner";
import "./Modal.css";
import "./Forms.css";

type TourFormModalProps = {
    onSubmit: (tour: NewTour, editingTourId: string | null) => Promise<void>;
    onDelete: (tourId: string) => void;
    ref?: Ref<TourFormModalHandle>;
};

const emptyTour: NewTour = {
    name: "",
    startDate: "",
    endDate: "",
};

function toFormValues(tour: Tour): NewTour {
    return {
        name: tour.name,
        startDate: tour.startDate ?? "",
        endDate: tour.endDate ?? "",
    };
}

export type TourFormModalHandle = EntityFormModalHandle<Tour>;

function TourFormModal({ onSubmit, onDelete, ref }: TourFormModalProps) {
    const {
        modalRef,
        formValues,
        editingId: editingTourId,
        isSaving,
        closeModal,
        handleChange,
        handleSubmit,
    } = useEntityFormModal<Tour, NewTour>(ref, {
        emptyValues: emptyTour,
        toFormValues,
        onSubmit,
    });

    return (
        <dialog id="tour-form-modal" ref={modalRef}>
            <div className="modal-box entity-form">
                <div className="modal-title">
                    {editingTourId ? "Edit tour" : "New tour"}
                </div>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="tourName">Name *</label>
                        <input
                            id="tourName"
                            name="name"
                            type="text"
                            required
                            value={formValues.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="tourStartDate">Start date</label>
                        <input
                            id="tourStartDate"
                            name="startDate"
                            type="date"
                            value={formValues.startDate}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="tourEndDate">End date</label>
                        <input
                            id="tourEndDate"
                            name="endDate"
                            type="date"
                            min={formValues.startDate || undefined}
                            value={formValues.endDate}
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

                    {editingTourId && (
                        <button
                            className="form-remove-button"
                            type="button"
                            onClick={() => {
                                closeModal();
                                onDelete(editingTourId);
                            }}
                            disabled={isSaving}
                        >
                            Delete tour
                        </button>
                    )}
                </form>
            </div>
        </dialog>
    );
}

export default TourFormModal;
