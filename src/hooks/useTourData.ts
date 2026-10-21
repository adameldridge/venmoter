import { useEffect, useState } from "react";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
} from "firebase/firestore";
import { toast } from "sonner";
import { db } from "../firebase/config";
import type {
    Tour,
    NewTour,
    TourStop,
    NewTourStop,
    Hold,
    NewHold,
    Outreach,
    NewOutreach,
    OutreachTarget,
    OutreachTargetType,
} from "../types/tour";

const settingsDoc = doc(db, "settings", "app");

function sameTarget(outreach: Outreach, target: OutreachTarget) {
    return outreach.targetType === target.targetType && outreach.targetId === target.targetId;
}

export function useTourData() {
    const [tours, setTours] = useState<Tour[]>([]);
    const [stops, setStops] = useState<TourStop[]>([]);
    const [holds, setHolds] = useState<Hold[]>([]);
    const [outreach, setOutreach] = useState<Outreach[]>([]);
    const [activeTourId, setActiveTourId] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    async function loadAll() {
        try {
            const [toursSnapshot, stopsSnapshot, holdsSnapshot, outreachSnapshot, settingsSnapshot] = await Promise.all([
                getDocs(collection(db, "tours")),
                getDocs(collection(db, "tour-stops")),
                getDocs(collection(db, "holds")),
                getDocs(collection(db, "outreach")),
                getDoc(settingsDoc),
            ]);

            setTours(toursSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Tour[]);
            setStops(stopsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as TourStop[]);
            setHolds(holdsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Hold[]);
            setOutreach(outreachSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Outreach[]);
            setActiveTourId(settingsSnapshot.data()?.activeTourId ?? null);
        } catch (error) {
            console.error("Error loading tours:", error);
            toast.error("Failed to load tours");
        } finally {
            setIsInitialLoading(false);
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadAll();
    }, []);

    async function setActiveTour(tourId: string | null) {
        try {
            await setDoc(settingsDoc, { activeTourId: tourId }, { merge: true });
            setActiveTourId(tourId);
        } catch (error) {
            console.error("Error setting active tour:", error);
            toast.error("Failed to switch tour");
        }
    }

    async function saveTour(tour: NewTour, editingTourId: string | null) {
        try {
            if (editingTourId) {
                await updateDoc(doc(db, "tours", editingTourId), tour);
            } else {
                const newTour = await addDoc(collection(db, "tours"), tour);
                await setDoc(settingsDoc, { activeTourId: newTour.id }, { merge: true });
            }
            await loadAll();
            toast.success(editingTourId ? "Tour updated" : "Tour created");
        } catch (error) {
            console.error("Error saving tour:", error);
            toast.error("Failed to save tour");
            throw error;
        }
    }

    async function deleteTour(id: string) {
        try {
            const outreachToDelete = outreach.filter((o) => o.tourId === id);
            const stopsToDelete = stops.filter((s) => s.tourId === id);
            const holdsToDelete = holds.filter((h) => h.tourId === id);
            await Promise.all([
                ...outreachToDelete.map((o) => deleteDoc(doc(db, "outreach", o.id))),
                ...holdsToDelete.map((h) => deleteDoc(doc(db, "holds", h.id))),
                ...stopsToDelete.map((s) => deleteDoc(doc(db, "tour-stops", s.id))),
            ]);
            await deleteDoc(doc(db, "tours", id));
            if (activeTourId === id) {
                const nextTour = tours.find((tour) => tour.id !== id);
                await setDoc(settingsDoc, { activeTourId: nextTour?.id ?? null }, { merge: true });
            }
            await loadAll();
            toast.success("Tour deleted");
        } catch (error) {
            console.error("Error deleting tour:", error);
            toast.error("Failed to delete tour");
        }
    }

    async function saveStop(stop: NewTourStop, editingStopId: string | null) {
        try {
            if (editingStopId) {
                await updateDoc(doc(db, "tour-stops", editingStopId), stop);
            } else {
                await addDoc(collection(db, "tour-stops"), stop);
            }
            await loadAll();
            toast.success(editingStopId ? "City updated" : "City added");
        } catch (error) {
            console.error("Error saving city:", error);
            toast.error("Failed to save city");
            throw error;
        }
    }

    async function deleteStop(id: string) {
        try {
            const toDelete = outreach.filter((o) => o.stopId === id);
            const holdsToDelete = holds.filter((h) => h.stopId === id);
            await Promise.all([
                ...toDelete.map((o) => deleteDoc(doc(db, "outreach", o.id))),
                ...holdsToDelete.map((h) => deleteDoc(doc(db, "holds", h.id))),
            ]);
            await deleteDoc(doc(db, "tour-stops", id));
            await loadAll();
            toast.success("City removed");
        } catch (error) {
            console.error("Error removing city:", error);
            toast.error("Failed to remove city");
        }
    }

    // Makes the stop's venues/promoters match `selected`: new targets are added as
    // "To contact", unselected ones are removed along with their status.
    async function saveStopTargets(stopId: string, selected: OutreachTarget[]) {
        const stop = stops.find((s) => s.id === stopId);
        if (!stop) return;

        try {
            const current = outreach.filter((o) => o.stopId === stopId);
            const toAdd = selected.filter((target) => !current.some((o) => sameTarget(o, target)));
            const toRemove = current.filter((o) => !selected.some((target) => sameTarget(o, target)));

            await Promise.all([
                ...toAdd.map((target) => {
                    const values: NewOutreach = {
                        tourId: stop.tourId,
                        stopId,
                        ...target,
                        status: "to-contact",
                        channel: "",
                        lastContacted: "",
                        showDate: "",
                        notes: "",
                    };
                    return addDoc(collection(db, "outreach"), values);
                }),
                ...toRemove.map((o) => deleteDoc(doc(db, "outreach", o.id))),
            ]);

            await loadAll();
            toast.success(`${stop.city} updated`);
        } catch (error) {
            console.error("Error saving city venues/promoters:", error);
            toast.error("Failed to update city");
            throw error;
        }
    }

    async function saveHold(values: NewHold, editingHoldId: string | null) {
        try {
            if (editingHoldId) {
                await updateDoc(doc(db, "holds", editingHoldId), values);
            } else {
                await addDoc(collection(db, "holds"), values);
            }
            await loadAll();
            toast.success(editingHoldId ? "Hold updated" : "Hold added");
        } catch (error) {
            console.error("Error saving hold:", error);
            toast.error("Failed to save hold");
            throw error;
        }
    }

    async function deleteHold(id: string) {
        try {
            await deleteDoc(doc(db, "holds", id));
            await loadAll();
            toast.success("Hold deleted");
        } catch (error) {
            console.error("Error deleting hold:", error);
            toast.error("Failed to delete hold");
        }
    }

    // Confirms the hold, deletes the city's other holds, and marks the venue (and promoter,
    // if set) as Confirmed with the show date, adding them to the city if needed.
    async function confirmHold(hold: Hold) {
        try {
            const otherHolds = holds.filter((h) => h.stopId === hold.stopId && h.id !== hold.id);
            const targets: OutreachTarget[] = [
                { targetType: "venue", targetId: hold.venueId },
                ...(hold.promoterId ? [{ targetType: "promoter" as const, targetId: hold.promoterId }] : []),
            ];

            await Promise.all([
                updateDoc(doc(db, "holds", hold.id), { status: "confirmed" }),
                ...otherHolds.map((h) => deleteDoc(doc(db, "holds", h.id))),
                ...targets.map((target) => {
                    const existing = outreach.find((o) => o.stopId === hold.stopId && sameTarget(o, target));
                    if (existing) {
                        return updateDoc(doc(db, "outreach", existing.id), {
                            status: "confirmed",
                            showDate: hold.date,
                        });
                    }
                    const values: NewOutreach = {
                        tourId: hold.tourId,
                        stopId: hold.stopId,
                        ...target,
                        status: "confirmed",
                        channel: "",
                        lastContacted: "",
                        showDate: hold.date,
                        notes: "",
                    };
                    return addDoc(collection(db, "outreach"), values);
                }),
            ]);

            await loadAll();
            toast.success("Booking confirmed");
        } catch (error) {
            console.error("Error confirming hold:", error);
            toast.error("Failed to confirm booking");
        }
    }

    async function unconfirmHold(id: string) {
        try {
            await updateDoc(doc(db, "holds", id), { status: "provisional" });
            await loadAll();
            toast.success("Booking set back to provisional");
        } catch (error) {
            console.error("Error unconfirming hold:", error);
            toast.error("Failed to update booking");
        }
    }

    async function saveOutreach(values: NewOutreach, outreachId: string) {
        try {
            await updateDoc(doc(db, "outreach", outreachId), values);
            await loadAll();
            toast.success("Outreach updated");
        } catch (error) {
            console.error("Error saving outreach:", error);
            toast.error("Failed to save outreach");
            throw error;
        }
    }

    async function deleteOutreach(id: string) {
        try {
            await deleteDoc(doc(db, "outreach", id));
            await loadAll();
            toast.success("Removed from city");
        } catch (error) {
            console.error("Error deleting outreach:", error);
            toast.error("Failed to remove from city");
        }
    }

    // Called when a venue or promoter is deleted. Errors propagate to the caller.
    // Holds for a deleted venue are deleted; a deleted promoter is just cleared from its holds.
    async function deleteOutreachForTarget(targetType: OutreachTargetType, targetId: string) {
        const toDelete = outreach.filter((o) => sameTarget(o, { targetType, targetId }));
        const holdsToDelete = targetType === "venue" ? holds.filter((h) => h.venueId === targetId) : [];
        const holdsToClear = targetType === "promoter" ? holds.filter((h) => h.promoterId === targetId) : [];
        await Promise.all([
            ...toDelete.map((o) => deleteDoc(doc(db, "outreach", o.id))),
            ...holdsToDelete.map((h) => deleteDoc(doc(db, "holds", h.id))),
            ...holdsToClear.map((h) => updateDoc(doc(db, "holds", h.id), { promoterId: "" })),
        ]);
        setOutreach((current) => current.filter((o) => !toDelete.includes(o)));
        setHolds((current) =>
            current
                .filter((h) => !holdsToDelete.includes(h))
                .map((h) => (holdsToClear.includes(h) ? { ...h, promoterId: "" } : h)),
        );
    }

    const activeTour = tours.find((tour) => tour.id === activeTourId) ?? null;
    const activeStops = activeTour ? stops.filter((s) => s.tourId === activeTour.id) : [];
    // Outreach without a stop in the active tour (e.g. created before cities existed) is ignored.
    const activeOutreach = outreach.filter((o) => activeStops.some((s) => s.id === o.stopId));
    const activeHolds = holds.filter((h) => activeStops.some((s) => s.id === h.stopId));

    return {
        tours,
        activeTour,
        activeStops,
        activeOutreach,
        activeHolds,
        isInitialLoading,
        setActiveTour,
        saveTour,
        deleteTour,
        saveStop,
        deleteStop,
        saveStopTargets,
        saveHold,
        deleteHold,
        confirmHold,
        unconfirmHold,
        saveOutreach,
        deleteOutreach,
        deleteOutreachForTarget,
    };
}
