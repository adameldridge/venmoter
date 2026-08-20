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
import AddVenueModal from "./components/AddVenueModal";

export default function Venues() {
    const [venues, setVenues] = useState<VenueWithPromoters[]>([]);

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

    async function addVenue(venue: NewVenue) {
        await addDoc(collection(db, "venues"), venue);
        await loadVenues();
    }

    return (
        <div>
            <div className="venues-header">
                <div className="venues-title">Venues</div>
                <button className="create-button" command="show-modal" commandfor="add-venue-modal">Add Venue</button>
            </div>

            <div className="venues">
                {venues.map((venue) => (
                    <VenueCard key={venue.id} venue={venue} />
                ))}
            </div>

            <AddVenueModal onSubmit={addVenue} />
        </div>
    );

}