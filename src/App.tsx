import { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "./firebase/config";
import './App.css';
import type {
    Venue,
    NewVenue,
    Promoter,
    VenuePromoter,
    VenueWithPromoters,
} from "./types/venue";
import VenueCard from "./components/VenueCard";

export default function Venues() {
    const [venues, setVenues] = useState<VenueWithPromoters[]>([]);

    // Form inputs
    const [newVenue, setNewVenue] = useState<NewVenue>({
        name: "",
        city: "",
        website: "",
        instagram: "",
        facebook: "",
    });

    async function loadVenues() {
        try {
            // Get all three collections at the same time
            const [
                venuesSnapshot,
                promotersSnapshot,
                venuePromotersSnapshot,
            ] = await Promise.all([
                getDocs(collection(db, "venues")),
                getDocs(collection(db, "promoters")),
                getDocs(collection(db, "venue-promoters")),
            ]);

            // Get all venues
            const venuesData: Venue[] = venuesSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Venue[];

            // Get all promoters
            const promotersData: Promoter[] = promotersSnapshot.docs.map(
                (doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })
            ) as Promoter[];

            // Get all venue/promoter relationships
            const relationships: VenuePromoter[] =
                venuePromotersSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as VenuePromoter[];

            // Add promoters to each venue
            const venuesWithPromoters: VenueWithPromoters[] =
                venuesData.map((venue) => {
                    const venueRelationships = relationships.filter(
                        (relationship) => relationship.venueId === venue.id
                    );

                    const promoterIds = venueRelationships.map(
                        (relationship) => relationship.promoterId
                    );

                    const promoters = promotersData.filter((promoter) =>
                        promoterIds.includes(promoter.id)
                    );

                    return {
                        ...venue,
                        promoters,
                    };
                });

            setVenues(venuesWithPromoters);
        } catch (error) {
            console.error("Error loading venues:", error);
        }
    }

    useEffect(() => {
        loadVenues();
    }, []);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setNewVenue({
            ...newVenue,
            [e.target.name]: e.target.value,
        });
    }

    async function addVenue(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            await addDoc(collection(db, "venues"), newVenue);

            // Get the updated venues from Firebase
            await loadVenues();

            // Clear the form
            setNewVenue({
                name: "",
                city: "",
                website: "",
                instagram: "",
                facebook: "",
            });
        } catch (error) {
            console.error("Error adding venue:", error);
        }
    }

    return (
        <div>
            <div className="venues-title"><h1>Venues</h1></div>

            <div className="venues">
                {venues.map((venue) => (
                    <VenueCard key={venue.id} venue={venue} />
                ))}
            </div>

            <hr />

            <div className="add-venue-form">
                <h2>Add Venue</h2>

                <form onSubmit={addVenue}>
                    <div>
                        <label htmlFor="venueName">Name</label>
                        <input
                            id="venueName"
                            name="name"
                            type="text"
                            value={newVenue.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="venueCity">City</label>
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


                    <button type="submit">Add</button>
                </form>
            </div>
        </div>
    );

}