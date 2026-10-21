import { useEffect, useRef, useState } from "react";
import "./App.css";
import type { PromoterWithVenues, VenueWithPromoters } from "./types/venue";
import VenuesTab from "./components/VenuesTab";
import PromotersTab from "./components/PromotersTab";
import VenueFormModal, { type VenueFormModalHandle } from "./components/VenueFormModal";
import PromoterFormModal, { type PromoterFormModalHandle } from "./components/PromoterFormModal";
import LinkModal, { type LinkModalHandle } from "./components/LinkModal";
import ConfirmModal, { type ConfirmModalHandle } from "./components/ConfirmModal";
import { toast } from "sonner";
import Spinner from "./components/Spinner";
import { signOut } from "firebase/auth";
import { auth } from "./firebase/config";
import { useVenueData } from "./hooks/useVenueData";

type Tab = "venues" | "promoters";

export default function App() {
    const [activeTab, setActiveTab] = useState<Tab>("venues");
    const [selectedCity, setSelectedCity] = useState("All Cities");
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const venueFormModalRef = useRef<VenueFormModalHandle>(null);
    const promoterFormModalRef = useRef<PromoterFormModalHandle>(null);
    const venuePromotersLinkModalRef = useRef<LinkModalHandle>(null);
    const promoterVenuesLinkModalRef = useRef<LinkModalHandle>(null);
    const confirmModalRef = useRef<ConfirmModalHandle>(null);

    const {
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
    } = useVenueData();

    useEffect(() => {
        const timeoutId = setTimeout(() => setSearchTerm(searchInput), 300);
        return () => clearTimeout(timeoutId);
    }, [searchInput]);

    function confirmSignOut() {
        confirmModalRef.current?.open({
            message: "Are you sure you want to sign out?",
            confirmLabel: "Sign Out",
            danger: true,
            onConfirm: async () => {
                await signOut(auth);
                toast.success("Logged out");
            },
        });
    }

    function confirmDeleteVenue(venue: VenueWithPromoters) {
        confirmModalRef.current?.open({
            message: `Delete ${venue.name}? This cannot be undone.`,
            confirmLabel: "Delete",
            danger: true,
            onConfirm: () => deleteVenue(venue.id),
        });
    }

    function confirmDeletePromoter(promoter: PromoterWithVenues) {
        confirmModalRef.current?.open({
            message: `Delete ${promoter.name}? This cannot be undone.`,
            confirmLabel: "Delete",
            danger: true,
            onConfirm: () => deletePromoter(promoter.id),
        });
    }

    function matchesSearch(name: string) {
        return name.toLowerCase().includes(searchTerm.trim().toLowerCase());
    }

    const visibleVenues = venuesWithPromoters
        .filter((venue) => selectedCity === "All Cities" || venue.city === selectedCity)
        .filter((venue) => matchesSearch(venue.name))
        .sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));

    const sortedVenues = [...venues].sort(
        (a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name),
    );

    const sortedPromoters = [...promoters].sort((a, b) => a.name.localeCompare(b.name));

    const visiblePromoters = promotersWithVenues
        .filter((promoter) => matchesSearch(promoter.name))
        .sort((a, b) => a.name.localeCompare(b.name));

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

                <button className="login-button cancel-button" type="button" onClick={confirmSignOut}>
                    Sign Out
                </button>
            </div>

            {isInitialLoading ? (
                <div className="page-loading">
                    <Spinner size={32} />
                </div>
            ) : (
                <>
                    {activeTab === "venues" && (
                        <VenuesTab
                            venues={visibleVenues}
                            allPromoters={promotersWithVenues}
                            cities={cities}
                            selectedCity={selectedCity}
                            onCityChange={setSelectedCity}
                            searchInput={searchInput}
                            onSearchChange={setSearchInput}
                            onAddVenue={() => venueFormModalRef.current?.open()}
                            onEditVenue={(venue) => venueFormModalRef.current?.open(venue)}
                            onDeleteVenue={confirmDeleteVenue}
                            onManagePromoters={(venue) =>
                                venuePromotersLinkModalRef.current?.open(
                                    venue.id,
                                    sortedPromoters.map((promoter) => ({
                                        id: promoter.id,
                                        name: promoter.name,
                                    })),
                                    venue.promoters.map((promoter) => promoter.id),
                                )
                            }
                        />
                    )}

                    {activeTab === "promoters" && (
                        <PromotersTab
                            promoters={visiblePromoters}
                            allVenues={venuesWithPromoters}
                            searchInput={searchInput}
                            onSearchChange={setSearchInput}
                            onAddPromoter={() => promoterFormModalRef.current?.open()}
                            onEditPromoter={(promoter) => promoterFormModalRef.current?.open(promoter)}
                            onDeletePromoter={confirmDeletePromoter}
                            onManageVenues={(promoter) =>
                                promoterVenuesLinkModalRef.current?.open(
                                    promoter.id,
                                    sortedVenues.map((venue) => ({
                                        id: venue.id,
                                        name: venue.name,
                                        city: venue.city,
                                    })),
                                    promoter.venues.map((venue) => venue.id),
                                )
                            }
                        />
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
                cities={cities}
                onSave={(promoterId, venueIds) =>
                    saveLinks("promoterId", promoterId, "venueId", venueIds)
                }
            />

            <ConfirmModal ref={confirmModalRef} />
        </div>
    );
}
