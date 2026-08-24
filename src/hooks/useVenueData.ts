import { useEffect, useState } from "react";
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "../firebase/config";
import type {
    Venue,
    NewVenue,
    Promoter,
    NewPromoter,
    VenuePromoter,
    VenueWithPromoters,
    PromoterWithVenues,
} from "../types/venue";

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

function buildPromotersWithVenues(
    promoters: Promoter[],
    venues: Venue[],
    relationships: VenuePromoter[],
): PromoterWithVenues[] {
    return promoters.map((promoter) => {
        const promoterRelationships = relationships.filter(
            (relationship) => relationship.promoterId === promoter.id,
        );

        const venueIds = promoterRelationships.map(
            (relationship) => relationship.venueId,
        );

        const promoterVenues = venues.filter((venue) =>
            venueIds.includes(venue.id),
        );

        return {
            ...promoter,
            venues: promoterVenues,
        };
    });
}

export function useVenueData() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [promoters, setPromoters] = useState<Promoter[]>([]);
    const [relationships, setRelationships] = useState<VenuePromoter[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    async function loadAll() {
        try {
            const [venuesSnapshot, promotersSnapshot, venuePromotersSnapshot] =
                await Promise.all([
                    getDocs(collection(db, "venues")),
                    getDocs(collection(db, "promoters")),
                    getDocs(collection(db, "venue-promoters")),
                ]);

            const venuesData: Venue[] = venuesSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Venue[];

            const promotersData: Promoter[] = promotersSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }),
            ) as Promoter[];

            const relationshipsData: VenuePromoter[] =
                venuePromotersSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as VenuePromoter[];

            setCities(
                ["All Cities", ...new Set(venuesData.map(venue => venue.city))].sort((a, b) =>
                    a === "All Cities" ? -1 : b === "All Cities" ? 1 : a.localeCompare(b),
                )
            );

            setVenues(venuesData);
            setPromoters(promotersData);
            setRelationships(relationshipsData);
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load data");
        } finally {
            setIsInitialLoading(false);
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadAll();
    }, []);

    async function saveVenue(venue: NewVenue, editingVenueId: string | null) {
        try {
            if (editingVenueId) {
                await updateDoc(doc(db, "venues", editingVenueId), venue);
            } else {
                await addDoc(collection(db, "venues"), venue);
            }
            await loadAll();
            toast.success(editingVenueId ? "Venue updated" : "Venue added");
        } catch (error) {
            console.error("Error saving venue:", error);
            toast.error("Failed to save venue");
            throw error;
        }
    }

    async function savePromoter(promoter: NewPromoter, editingPromoterId: string | null) {
        try {
            if (editingPromoterId) {
                await updateDoc(doc(db, "promoters", editingPromoterId), promoter);
            } else {
                await addDoc(collection(db, "promoters"), promoter);
            }
            await loadAll();
            toast.success(editingPromoterId ? "Promoter updated" : "Promoter added");
        } catch (error) {
            console.error("Error saving promoter:", error);
            toast.error("Failed to save promoter");
            throw error;
        }
    }

    async function deleteRelationshipsFor(field: "venueId" | "promoterId", id: string) {
        const toDelete = relationships.filter((r) => r[field] === id);
        await Promise.all(toDelete.map((r) => deleteDoc(doc(db, "venue-promoters", r.id))));
    }

    async function deleteVenue(id: string) {
        try {
            await deleteRelationshipsFor("venueId", id);
            await deleteDoc(doc(db, "venues", id));
            await loadAll();
            toast.success("Venue deleted");
        } catch (error) {
            console.error("Error deleting venue:", error);
            toast.error("Failed to delete venue");
        }
    }

    async function deletePromoter(id: string) {
        try {
            await deleteRelationshipsFor("promoterId", id);
            await deleteDoc(doc(db, "promoters", id));
            await loadAll();
            toast.success("Promoter deleted");
        } catch (error) {
            console.error("Error deleting promoter:", error);
            toast.error("Failed to delete promoter");
        }
    }

    async function saveLinks(
        fixedField: "venueId" | "promoterId",
        fixedId: string,
        otherField: "venueId" | "promoterId",
        selectedOtherIds: string[],
    ) {
        try {
            const current = relationships.filter((r) => r[fixedField] === fixedId);
            const currentOtherIds = current.map((r) => r[otherField]);

            const toAdd = selectedOtherIds.filter((id) => !currentOtherIds.includes(id));
            const toRemove = current.filter((r) => !selectedOtherIds.includes(r[otherField]));

            await Promise.all([
                ...toAdd.map((otherId) =>
                    addDoc(collection(db, "venue-promoters"), {
                        [fixedField]: fixedId,
                        [otherField]: otherId,
                    }),
                ),
                ...toRemove.map((r) => deleteDoc(doc(db, "venue-promoters", r.id))),
            ]);

            await loadAll();
            toast.success(fixedField === "venueId" ? "Promoters updated" : "Venues updated");
        } catch (error) {
            console.error("Error saving links:", error);
            toast.error("Failed to save links");
            throw error;
        }
    }

    const venuesWithPromoters = buildVenuesWithPromoters(venues, promoters, relationships);
    const promotersWithVenues = buildPromotersWithVenues(promoters, venues, relationships);

    return {
        venues,
        promoters,
        cities,
        isInitialLoading,
        venuesWithPromoters,
        promotersWithVenues,
        saveVenue,
        savePromoter,
        deleteVenue,
        deletePromoter,
        saveLinks,
    };
}
