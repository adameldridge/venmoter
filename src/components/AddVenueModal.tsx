import { useRef, useState, forwardRef, useImperativeHandle } from "react";
import type { NewVenue } from "../types/venue";
import "./AddVenueModal.css";

type AddVenueModalProps = {
    onSubmit: (venue: NewVenue) => Promise<void>;
};

const emptyVenue: NewVenue = {
    name: "",
    city: "",
    website: "",
    instagram: "",
    facebook: "",
};

export type AddVenueModalHandle = {
    close: () => void;
};

const AddVenueModal = forwardRef<AddVenueModalHandle, AddVenueModalProps>(
    function AddVenueModal({ onSubmit }, ref) {
        const modalRef = useRef<HTMLDialogElement>(null);
        const [newVenue, setNewVenue] = useState<NewVenue>(emptyVenue);

        function closeModal() {
            setNewVenue(emptyVenue);
            modalRef.current?.close();
        }

        useImperativeHandle(ref, () => ({ close: closeModal }));

        function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
            setNewVenue({
                ...newVenue,
                [e.target.name]: e.target.value,
            });
        }

        async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
            e.preventDefault();
            try {
                await onSubmit(newVenue);
                closeModal();
            } catch (error) {
                console.error("Error adding venue:", error);
            }
        }

        return (
            <dialog id="add-venue-modal" ref={modalRef}>
                <div className="add-venue-form">
                    <div className="add-venue-form-title">Add Venue</div>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="venueName">Name *</label>
                            <input
                                id="venueName"
                                name="name"
                                type="text"
                                required
                                value={newVenue.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="venueCity">City *</label>
                            <input
                                id="venueCity"
                                name="city"
                                type="text"
                                value={newVenue.city}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="venueWebsite">Website</label>
                            <input
                                id="venueWebsite"
                                name="website"
                                type="text"
                                value={newVenue.website}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="venueInstagram">Instagram</label>
                            <input
                                id="venueInstagram"
                                name="instagram"
                                type="text"
                                value={newVenue.instagram}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label htmlFor="venueFacebook">Facebook</label>
                            <input
                                id="venueFacebook"
                                name="facebook"
                                type="text"
                                value={newVenue.facebook}
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

export default AddVenueModal;
