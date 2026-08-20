import { useEffect, useRef, useState } from "react";
import { collection, doc, getDocs, addDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase/config";
import "./App.css";
import type {
    Venue,
    NewVenue,
    Promoter,
    VenuePromoter,
    VenueWithPromoters,
} from "./types/venue";
import VenueCard from "./components/VenueCard";
import VenueFormModal from "./components/VenueFormModal";
import type { VenueFormModalHandle } from "./components/VenueFormModal";

export default function Venues() {
    const [venues, setVenues] = useState<VenueWithPromoters[]>([]);
    const formModalRef = useRef<VenueFormModalHandle>(null);

    async function loadVenues() {
        try {
            // Get all three collections at the same time
            const [venuesSnapshot, promotersSnapshot, venuePromotersSnapshot] =
                await Promise.all([
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
            const promotersData: Promoter[] = promotersSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }),
            ) as Promoter[];

            // Get all venue/promoter relationships
            const relationships: VenuePromoter[] =
                venuePromotersSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as VenuePromoter[];

            // Add promoters to each venue
            setVenues(
                buildVenuesWithPromoters(
                    venuesData,
                    promotersData,
                    relationships,
                ),
            );
        } catch (error) {
            console.error("Error loading venues:", error);
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadVenues();
    }, []);

    async function saveVenue(venue: NewVenue, editingVenueId: string | null) {
        if (editingVenueId) {
            await updateDoc(doc(db, "venues", editingVenueId), venue);
        } else {
            await addDoc(collection(db, "venues"), venue);
        }
        await loadVenues();
    }

    return (
        <div>
            <div className="venues-header">
                <div className="venues-title">Venues</div>
                <button
                    className="create-button"
                    type="button"
                    onClick={() => formModalRef.current?.open()}
                >
                    Add Venue
                </button>
            </div>

            <div className="venues">
                {venues.map((venue) => (
                    <VenueCard
                        key={venue.id}
                        venue={venue}
                        onEdit={() => formModalRef.current?.open(venue)}
                    />
                ))}
            </div>

            <VenueFormModal ref={formModalRef} onSubmit={saveVenue} />
        </div>
    );
}

function buildVenuesWithPromoters(
    venues: Venue[],
    promoters: Promoter[],
    relationships: VenuePromoter[],
): VenueWithPromoters[] {
    return venues.map((venue) => {
        const venueRelationships = relationships.filter(
            (relationship) => relationship.venueId === venue.id,
        );

        const promoterIds = venueRelationships.map(
            (relationship) => relationship.promoterId,
        );

        const venuePromoters = promoters.filter((promoter) =>
            promoterIds.includes(promoter.id),
        );

        return {
            ...venue,
            promoters: venuePromoters,
        };
    });
}
