import { useState, type Ref } from "react";
import type { NewTourStop, TourStop } from "../types/tour";
import { useEntityFormModal, type EntityFormModalHandle } from "../hooks/useEntityFormModal";
import Spinner from "./Spinner";
import "./Modal.css";
import "./Forms.css";

type StopFormValues = Omit<NewTourStop, "tourId">;

type StopFormModalProps = {
    cities: string[];
    onSubmit: (stop: StopFormValues, editingStopId: string | null) => Promise<void>;
    onDelete: (stopId: string) => void;
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

const OTHER_CITY = "__other__";

function StopFormModal({ cities, onSubmit, onDelete, ref }: StopFormModalProps) {
    const [isOtherCity, setIsOtherCity] = useState(false);

    const {
        modalRef,
        formValues,
        setFormValues,
        editingId: editingStopId,
        isSaving,
        closeModal,
        handleChange,
        handleSubmit,
    } = useEntityFormModal<TourStop, StopFormValues>(ref, {
        emptyValues: emptyStop,
        toFormValues,
        onSubmit: (values, editingId) => onSubmit({ ...values, city: values.city.trim() }, editingId),
        // A saved city that isn't one of the venue cities is shown in the "Other" text box.
        onOpen: (stop) => setIsOtherCity(!!stop && !cities.includes(stop.city)),
    });

    function handleCitySelect(e: React.ChangeEvent<HTMLSelectElement>) {
        const value = e.target.value;
        setIsOtherCity(value === OTHER_CITY);
        setFormValues((current) => ({ ...current, city: value === OTHER_CITY ? "" : value }));
    }

    return (
        <dialog id="stop-form-modal" ref={modalRef}>
            <div className="modal-box entity-form">
                <div className="modal-title">
                    {editingStopId ? "Edit City" : "Add City"}
                </div>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="stopCity">City *</label>
                        <select
                            id="stopCity"
                            required
                            value={isOtherCity ? OTHER_CITY : formValues.city}
                            onChange={handleCitySelect}
                        >
                            <option value="" disabled>Choose a city…</option>
                            {cities.map((city) => (
                                <option value={city} key={city}>{city}</option>
                            ))}
                            <option value={OTHER_CITY}>Other city…</option>
                        </select>
                    </div>

                    {isOtherCity && (
                        <div>
                            <label htmlFor="stopOtherCity">City name *</label>
                            <input
                                id="stopOtherCity"
                                name="city"
                                type="text"
                                required
                                autoFocus
                                autoComplete="off"
                                value={formValues.city}
                                onChange={handleChange}
                            />
                        </div>
                    )}

                    <div className="modal-actions">
                        <button className="create-button" type="submit" disabled={isSaving}>
                            {isSaving ? <Spinner size={14} /> : "Save"}
                        </button>
                        <button className="cancel-button" type="button" onClick={closeModal} disabled={isSaving}>
                            Cancel
                        </button>
                    </div>

                    {editingStopId && (
                        <button
                            className="form-remove-button"
                            type="button"
                            onClick={() => {
                                closeModal();
                                onDelete(editingStopId);
                            }}
                            disabled={isSaving}
                        >
                            Remove city
                        </button>
                    )}
                </form>
            </div>
        </dialog>
    );
}

export default StopFormModal;
