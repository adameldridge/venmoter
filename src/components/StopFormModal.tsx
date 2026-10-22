import { useState, type Ref } from "react";
import type { NewTourStop, TourStop } from "../types/tour";
import { useEntityFormModal, type EntityFormModalHandle } from "../hooks/useEntityFormModal";
import Spinner from "./Spinner";
import CityField from "./CityField";
import "./Modal.css";
import "./Forms.css";

type StopFormValues = Omit<NewTourStop, "tourId">;

type StopFormModalProps = {
    cities: string[];
    onSubmit: (stop: StopFormValues) => Promise<void>;
    ref?: Ref<StopFormModalHandle>;
};

const emptyStop: StopFormValues = {
    city: "",
};

function toFormValues(stop: TourStop): StopFormValues {
    return {
        city: stop.city,
    };
}

export type StopFormModalHandle = EntityFormModalHandle<TourStop>;

function StopFormModal({ cities, onSubmit, ref }: StopFormModalProps) {
    const [isOtherCity, setIsOtherCity] = useState(false);

    const {
        modalRef,
        formValues,
        setFormValues,
        isSaving,
        closeModal,
        handleSubmit,
    } = useEntityFormModal<TourStop, StopFormValues>(ref, {
        emptyValues: emptyStop,
        toFormValues,
        onSubmit: (values) => onSubmit({ ...values, city: values.city.trim() }),
        onOpen: () => setIsOtherCity(false),
    });

    return (
        <dialog id="stop-form-modal" ref={modalRef}>
            <div className="modal-box entity-form">
                <div className="modal-title">Add city</div>
                <form onSubmit={handleSubmit}>
                    <CityField
                        id="stopCity"
                        cities={cities}
                        value={formValues.city}
                        isOther={isOtherCity}
                        onChange={(city, isOther) => {
                            setIsOtherCity(isOther);
                            setFormValues((current) => ({ ...current, city }));
                        }}
                    />

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

export default StopFormModal;
