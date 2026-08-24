import { useEffect, useRef, useState } from "react";
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase/config";
import "./App.css";
import type {
    Venue,
    NewVenue,
    Promoter,
    NewPromoter,
    VenuePromoter,
    VenueWithPromoters,
    PromoterWithVenues,
} from "./types/venue";
import VenueCard from "./components/VenueCard";
import VenueFormModal from "./components/VenueFormModal";
import type { VenueFormModalHandle } from "./components/VenueFormModal";
import PromoterCard from "./components/PromoterCard";
import PromoterFormModal from "./components/PromoterFormModal";
import type { PromoterFormModalHandle } from "./components/PromoterFormModal";
import LinkModal from "./components/LinkModal";
import type { LinkModalHandle } from "./components/LinkModal";
import LoginModal from "./components/LoginModal";
import type { LoginModalHandle } from "./components/LoginModal";
import ConfirmModal from "./components/ConfirmModal";
import type { ConfirmModalHandle } from "./components/ConfirmModal";
import { Toaster, toast } from "sonner";
import Spinner from "./components/Spinner";
import { signOut } from "firebase/auth";
import { auth } from "./firebase/config";
import { useAuth } from "./hooks/useAuth";

type Tab = "venues" | "promoters";

export default function App() {
    const { user } = useAuth();
    const canEdit = !!user;
    const [activeTab, setActiveTab] = useState<Tab>("venues");
    const [venues, setVenues] = useState<Venue[]>([]);
    const [promoters, setPromoters] = useState<Promoter[]>([]);
    const [relationships, setRelationships] = useState<VenuePromoter[]>([]);
    const [cities, setCities] = useState<string[]>();
    const [selectedCity, setSelectedCity] = useState("All");
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const venueFormModalRef = useRef<VenueFormModalHandle>(null);
    const promoterFormModalRef = useRef<PromoterFormModalHandle>(null);
    const venuePromotersLinkModalRef = useRef<LinkModalHandle>(null);
    const promoterVenuesLinkModalRef = useRef<LinkModalHandle>(null);
    const loginModalRef = useRef<LoginModalHandle>(null);
    const confirmModalRef = useRef<ConfirmModalHandle>(null);

    function handleAuthButtonClick() {
        if (user) {
            confirmModalRef.current?.open({
                message: "Are you sure you want to sign out?",
                confirmLabel: "Sign Out",
                danger: true,
                onConfirm: async () => {
                    await signOut(auth);
                    toast.success("Logged out");
                },
            });
        } else {
            loginModalRef.current?.open();
        }
    }

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
                ["All", ...new Set(venuesData.map(venue => venue.city))]
            );

            setVenues(venuesData);
            setPromoters(promotersData);
            setRelationships(relationshipsData);
        } catch (error) {
            console.error("Error loading data:", error);
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

    function confirmDeleteVenue(venue: Venue) {
        confirmModalRef.current?.open({
            message: `Delete ${venue.name}? This cannot be undone.`,
            confirmLabel: "Delete",
            danger: true,
            onConfirm: () => deleteVenue(venue.id),
        });
    }

    function confirmDeletePromoter(promoter: Promoter) {
        confirmModalRef.current?.open({
            message: `Delete ${promoter.name}? This cannot be undone.`,
            confirmLabel: "Delete",
            danger: true,
            onConfirm: () => deletePromoter(promoter.id),
        });
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

    function handleCityChange(e: React.ChangeEvent<HTMLSelectElement>) {
        setSelectedCity(e.target.value);
    }

    const venuesWithPromoters = buildVenuesWithPromoters(venues, promoters, relationships);
    const promotersWithVenues = buildPromotersWithVenues(promoters, venues, relationships);

    const visibleVenues =
        selectedCity === "All"
            ? venuesWithPromoters
            : venuesWithPromoters.filter((venue) => venue.city === selectedCity);

    return (
        <div>
            <div className="tabs">
                <button
                    className={activeTab === "venues" ? "tab-button tab-button-active" : "tab-button"}
                    type="button"
                    onClick={() => setActiveTab("venues")}
                >
                    Venues
                </button>
                <button
                    className={activeTab === "promoters" ? "tab-button tab-button-active" : "tab-button"}
                    type="button"
                    onClick={() => setActiveTab("promoters")}
                >
                    Promoters
                </button>

                <button
                    className={user ? "login-button cancel-button" : "login-button create-button"}
                    type="button"
                    onClick={handleAuthButtonClick}
                >
                    {user ? "Sign Out" : "Sign In"}
                </button>
            </div>

            {isInitialLoading ? (
                <div className="page-loading">
                    <Spinner size={32} />
                </div>
            ) : (
            <>
            {activeTab === "venues" && (
                <div>
                    <div className="venues-header">
                        {canEdit && (
                            <button
                                className="create-button"
                                type="button"
                                onClick={() => venueFormModalRef.current?.open()}
                            >
                                Add Venue
                            </button>
                        )}

                        <select
                            className="cities-select"
                            value={selectedCity}
                            onChange={handleCityChange}
                        >
                            {cities?.map((city) =>(
                                <option value={city} key={city}>{city}</option>
                            ))}
                        </select>
                    </div>

                    <div className="venues">
                        {visibleVenues.map((venue) => (
                            <VenueCard
                                key={venue.id}
                                venue={venue}
                                allPromoters={promotersWithVenues}
                                canEdit={canEdit}
                                onEdit={() => venueFormModalRef.current?.open(venue)}
                                onDelete={() => confirmDeleteVenue(venue)}
                                onManagePromoters={() =>
                                    venuePromotersLinkModalRef.current?.open(
                                        venue.id,
                                        promoters.map((promoter) => ({
                                            id: promoter.id,
                                            name: promoter.name,
                                        })),
                                        venue.promoters.map((promoter) => promoter.id),
                                    )
                                }
                            />
                        ))}
                    </div>
                </div>
            )}

            {activeTab === "promoters" && (
                <div>
                    <div className="venues-header">
                        {canEdit && (
                            <button
                                className="create-button"
                                type="button"
                                onClick={() => promoterFormModalRef.current?.open()}
                            >
                                Add Promoter
                            </button>
                        )}
                    </div>

                    <div className="venues">
                        {promotersWithVenues.map((promoter) => (
                            <PromoterCard
                                key={promoter.id}
                                promoter={promoter}
                                allVenues={venuesWithPromoters}
                                canEdit={canEdit}
                                onEdit={() => promoterFormModalRef.current?.open(promoter)}
                                onDelete={() => confirmDeletePromoter(promoter)}
                                onManageVenues={() =>
                                    promoterVenuesLinkModalRef.current?.open(
                                        promoter.id,
                                        venues.map((venue) => ({
                                            id: venue.id,
                                            name: venue.name,
                                        })),
                                        promoter.venues.map((venue) => venue.id),
                                    )
                                }
                            />
                        ))}
                    </div>
                </div>
            )}
            </>
            )}

            <VenueFormModal ref={venueFormModalRef} onSubmit={saveVenue} />
            <PromoterFormModal ref={promoterFormModalRef} onSubmit={savePromoter} />

            <LinkModal
                ref={venuePromotersLinkModalRef}
                title="Manage Promoters"
                itemLabel="promoters"
                onSave={(venueId, promoterIds) =>
                    saveLinks("venueId", venueId, "promoterId", promoterIds)
                }
            />
            <LinkModal
                ref={promoterVenuesLinkModalRef}
                title="Manage Venues"
                itemLabel="venues"
                onSave={(promoterId, venueIds) =>
                    saveLinks("promoterId", promoterId, "venueId", venueIds)
                }
            />

            <LoginModal ref={loginModalRef} />
            <ConfirmModal ref={confirmModalRef} />

            <Toaster position="top-center" theme="light" richColors />
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
