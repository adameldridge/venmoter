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
    Outreach,
    NewOutreach,
    ContactLogEntry,
    NewContactLogEntry,
    OutreachTarget,
    OutreachTargetType,
    TourListing,
} from "../types/tour";
import { todayIsoDate } from "../utils/date";
import { sameCity } from "../utils/city";

const settingsDoc = doc(db, "settings", "app");

function sameTarget(outreach: Outreach, target: OutreachTarget) {
    return outreach.targetType === target.targetType && outreach.targetId === target.targetId;
}

// Fills in fields added after a record was created, so older documents still render.
function toOutreach(id: string, data: Record<string, unknown>): Outreach {
    return {
        showDate: "",
        viaPromoterId: "",
        ...data,
        id,
    } as Outreach;
}

export function useTourData() {
    const [tours, setTours] = useState<Tour[]>([]);
    const [stops, setStops] = useState<TourStop[]>([]);
    const [outreach, setOutreach] = useState<Outreach[]>([]);
    const [contactLog, setContactLog] = useState<ContactLogEntry[]>([]);
    const [activeTourId, setActiveTourId] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    async function loadAll() {
        try {
            const [toursSnapshot, stopsSnapshot, outreachSnapshot, logSnapshot, settingsSnapshot] =
                await Promise.all([
                    getDocs(collection(db, "tours")),
                    getDocs(collection(db, "tour-stops")),
                    getDocs(collection(db, "outreach")),
                    getDocs(collection(db, "contact-log")),
                    getDoc(settingsDoc),
                ]);

            setTours(toursSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Tour[]);
            setStops(stopsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as TourStop[]);
            setOutreach(outreachSnapshot.docs.map((doc) => toOutreach(doc.id, doc.data())));
            setContactLog(logSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ContactLogEntry[]);
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

    function deleteLogFor(outreachIds: string[]) {
        return contactLog
            .filter((entry) => outreachIds.includes(entry.outreachId))
            .map((entry) => deleteDoc(doc(db, "contact-log", entry.id)));
    }

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
            await Promise.all([
                ...deleteLogFor(outreachToDelete.map((o) => o.id)),
                ...outreachToDelete.map((o) => deleteDoc(doc(db, "outreach", o.id))),
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

    // A city can only appear once per tour (compared ignoring case and spacing).
    async function saveStop(stop: NewTourStop, editingStopId: string | null) {
        const duplicate = stops.some(
            (s) => s.tourId === stop.tourId && s.id !== editingStopId && sameCity(s.city, stop.city),
        );
        if (duplicate) {
            toast.error(`${stop.city} is already in this tour`);
            throw new Error(`Duplicate city: ${stop.city}`);
        }

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
            await Promise.all([
                ...deleteLogFor(toDelete.map((o) => o.id)),
                ...toDelete.map((o) => deleteDoc(doc(db, "outreach", o.id))),
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
    // "To contact", unselected ones are removed along with their status and contact log.
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
                        showDate: "",
                        viaPromoterId: "",
                    };
                    return addDoc(collection(db, "outreach"), values);
                }),
                ...deleteLogFor(toRemove.map((o) => o.id)),
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

    // Other venues on hold in the same city as `outreachId`; these are released when it's confirmed.
    function otherHoldsInCity(outreachId: string, stopId: string) {
        return outreach.filter(
            (o) => o.stopId === stopId && o.id !== outreachId && o.targetType === "venue" && o.status === "on-hold",
        );
    }

    async function saveOutreach(values: NewOutreach, outreachId: string) {
        try {
            const toRelease = values.status === "confirmed" ? otherHoldsInCity(outreachId, values.stopId) : [];
            await Promise.all([
                updateDoc(doc(db, "outreach", outreachId), values),
                ...toRelease.map((o) =>
                    updateDoc(doc(db, "outreach", o.id), { status: "in-discussion", showDate: "" }),
                ),
                ...toRelease.map((o) => {
                    const entry: NewContactLogEntry = {
                        outreachId: o.id,
                        tourId: o.tourId,
                        date: todayIsoDate(),
                        channel: "",
                        note: "Hold released (another venue confirmed)",
                    };
                    return addDoc(collection(db, "contact-log"), entry);
                }),
            ]);
            await loadAll();
            toast.success(
                toRelease.length > 0
                    ? `Saved; ${toRelease.length} other ${toRelease.length === 1 ? "hold" : "holds"} released`
                    : "Saved",
            );
        } catch (error) {
            console.error("Error saving outreach:", error);
            toast.error("Failed to save");
            throw error;
        }
    }

    async function deleteOutreach(id: string) {
        try {
            await Promise.all([...deleteLogFor([id]), deleteDoc(doc(db, "outreach", id))]);
            await loadAll();
            toast.success("Removed from city");
        } catch (error) {
            console.error("Error deleting outreach:", error);
            toast.error("Failed to remove from city");
        }
    }

    // Logging a contact against someone still "To contact" moves them to "Contacted".
    async function logContact(target: Outreach, entry: Omit<NewContactLogEntry, "outreachId" | "tourId">) {
        try {
            const values: NewContactLogEntry = { ...entry, outreachId: target.id, tourId: target.tourId };
            await Promise.all([
                addDoc(collection(db, "contact-log"), values),
                ...(target.status === "to-contact"
                    ? [updateDoc(doc(db, "outreach", target.id), { status: "contacted" })]
                    : []),
            ]);
            await loadAll();
            toast.success("Contact logged");
        } catch (error) {
            console.error("Error logging contact:", error);
            toast.error("Failed to log contact");
            throw error;
        }
    }

    // Called when a venue or promoter is deleted. Errors propagate to the caller.
    // A deleted promoter is also cleared from any "via promoter" on venue records.
    async function deleteOutreachForTarget(targetType: OutreachTargetType, targetId: string) {
        const toDelete = outreach.filter((o) => sameTarget(o, { targetType, targetId }));
        const toClear = targetType === "promoter" ? outreach.filter((o) => o.viaPromoterId === targetId) : [];
        await Promise.all([
            ...deleteLogFor(toDelete.map((o) => o.id)),
            ...toDelete.map((o) => deleteDoc(doc(db, "outreach", o.id))),
            ...toClear.map((o) => updateDoc(doc(db, "outreach", o.id), { viaPromoterId: "" })),
        ]);
        setOutreach((current) =>
            current
                .filter((o) => !toDelete.includes(o))
                .map((o) => (toClear.includes(o) ? { ...o, viaPromoterId: "" } : o)),
        );
        setContactLog((current) => current.filter((entry) => !toDelete.some((o) => o.id === entry.outreachId)));
    }

    // Every tour city a venue or promoter is listed under, across all tours, not just the active one.
    function listingsFor(targetType: OutreachTargetType, targetId: string): TourListing[] {
        return outreach
            .filter((o) => sameTarget(o, { targetType, targetId }))
            .flatMap((o) => {
                const stop = stops.find((s) => s.id === o.stopId);
                const tour = stop && tours.find((t) => t.id === stop.tourId);
                if (!stop || !tour) return [];
                return [{
                    tourName: tour.name,
                    city: stop.city,
                    status: o.status,
                    showDate: o.showDate,
                    logCount: contactLog.filter((entry) => entry.outreachId === o.id).length,
                }];
            })
            .sort((a, b) => a.tourName.localeCompare(b.tourName) || a.city.localeCompare(b.city));
    }

    // Venue bookings that name this promoter as the one they went through.
    function bookingsViaPromoter(promoterId: string) {
        return outreach.filter((o) => o.viaPromoterId === promoterId).length;
    }

    const activeTour = tours.find((tour) => tour.id === activeTourId) ?? null;
    const activeStops = activeTour ? stops.filter((s) => s.tourId === activeTour.id) : [];
    // Outreach without a stop in the active tour (e.g. created before cities existed) is ignored.
    const activeOutreach = outreach.filter((o) => activeStops.some((s) => s.id === o.stopId));
    const activeContactLog = contactLog.filter((entry) => activeOutreach.some((o) => o.id === entry.outreachId));

    return {
        tours,
        activeTour,
        activeStops,
        activeOutreach,
        activeContactLog,
        isInitialLoading,
        setActiveTour,
        saveTour,
        deleteTour,
        saveStop,
        deleteStop,
        saveStopTargets,
        otherHoldsInCity,
        saveOutreach,
        deleteOutreach,
        logContact,
        deleteOutreachForTarget,
        listingsFor,
        bookingsViaPromoter,
    };
}
