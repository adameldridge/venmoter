import { useEffect, useRef, useState } from "react";
import "./App.css";
import type { PromoterWithVenues, VenueWithPromoters } from "./types/venue";
import VenuesTab from "./components/VenuesTab";
import PromotersTab from "./components/PromotersTab";
import VenueFormModal, { type VenueFormModalHandle } from "./components/VenueFormModal";
import PromoterFormModal, { type PromoterFormModalHandle } from "./components/PromoterFormModal";
import LinkModal, { type LinkModalHandle } from "./components/LinkModal";
import ConfirmModal, { type ConfirmModalHandle } from "./components/ConfirmModal";
import TourTab from "./components/TourTab";
import TourFormModal, { type TourFormModalHandle } from "./components/TourFormModal";
import OutreachModal, { type OutreachModalHandle } from "./components/OutreachModal";
import ContactLogModal, { type ContactLogModalHandle } from "./components/ContactLogModal";
import StopFormModal, { type StopFormModalHandle } from "./components/StopFormModal";
import { toast } from "sonner";
import Spinner from "./components/Spinner";
import { signOut } from "firebase/auth";
import { auth } from "./firebase/config";
import { useVenueData } from "./hooks/useVenueData";
import { useTourData } from "./hooks/useTourData";
import type { LinkOption } from "./types/venue";
import type { NewOutreach, Outreach, OutreachTarget, OutreachTargetType, StopOutreach, Tour, TourStop } from "./types/tour";
import { sameCity } from "./utils/city";
import { formatDate } from "./utils/date";

type Tab = "venues" | "promoters" | "tour";

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
    const tourFormModalRef = useRef<TourFormModalHandle>(null);
    const outreachModalRef = useRef<OutreachModalHandle>(null);
    const contactLogModalRef = useRef<ContactLogModalHandle>(null);
    const stopFormModalRef = useRef<StopFormModalHandle>(null);
    const stopTargetsLinkModalRef = useRef<LinkModalHandle>(null);

    const {
        tours,
        activeTour,
        activeStops,
        activeOutreach,
        activeContactLog,
        isInitialLoading: isToursLoading,
        setActiveTour,
        saveTour,
        deleteTour,
        saveStop,
        deleteStop,
        saveStopTargets,
        otherHoldsInCity,
        logContact,
        saveOutreach,
        deleteOutreach,
        deleteOutreachForTarget,
    } = useTourData();

    const {
        venues,
        promoters,
        cities,
        isInitialLoading: isVenuesLoading,
        venuesWithPromoters,
        promotersWithVenues,
        saveVenue,
        savePromoter,
        deleteVenue,
        deletePromoter,
        saveLinks,
    } = useVenueData({ onDeleteTarget: deleteOutreachForTarget });

    const isInitialLoading = isVenuesLoading || isToursLoading;

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

    function confirmDeleteTour(tour: Tour) {
        confirmModalRef.current?.open({
            message: `Delete ${tour.name} and all its outreach? This cannot be undone.`,
            confirmLabel: "Delete",
            danger: true,
            onConfirm: () => deleteTour(tour.id),
        });
    }

    function confirmDeleteStop(stop: TourStop) {
        confirmModalRef.current?.open({
            message: `Remove ${stop.city} and everything added to it from ${activeTour?.name ?? "this tour"}?`,
            confirmLabel: "Remove",
            danger: true,
            onConfirm: () => deleteStop(stop.id),
        });
    }

    function confirmRemoveOutreach(outreach: Outreach) {
        const city = activeStops.find((stop) => stop.id === outreach.stopId)?.city ?? "this city";
        confirmModalRef.current?.open({
            message: `Remove ${targetName(outreach)} from ${city}?`,
            confirmLabel: "Remove",
            danger: true,
            onConfirm: () => deleteOutreach(outreach.id),
        });
    }

    function targetName(target: OutreachTarget) {
        const list: { id: string; name: string }[] = target.targetType === "venue" ? venues : promoters;
        return list.find((item) => item.id === target.targetId)?.name ?? "";
    }

    function outreachFor(targetType: OutreachTargetType, targetId: string): StopOutreach[] {
        return activeOutreach
            .filter((o) => o.targetType === targetType && o.targetId === targetId)
            .map((o) => ({ outreach: o, city: activeStops.find((stop) => stop.id === o.stopId)?.city ?? "" }));
    }

    // Picker options: the stop's city venues, promoters linked to them, plus anything already added.
    function openStopTargets(stop: TourStop) {
        const toOptionId = (target: OutreachTarget) => `${target.targetType}:${target.targetId}`;
        const cityVenues = sortedVenues.filter((venue) => sameCity(venue.city, stop.city));
        const cityVenueIds = new Set(cityVenues.map((venue) => venue.id));
        const linkedPromoters = promotersWithVenues
            .filter((promoter) => promoter.venues.some((venue) => cityVenueIds.has(venue.id)))
            .sort((a, b) => a.name.localeCompare(b.name));

        const options: LinkOption[] = [
            ...cityVenues.map((venue) => ({
                id: toOptionId({ targetType: "venue", targetId: venue.id }),
                name: venue.name,
                detail: "Venue",
            })),
            ...linkedPromoters.map((promoter) => ({
                id: toOptionId({ targetType: "promoter", targetId: promoter.id }),
                name: promoter.name,
                detail: "Promoter",
            })),
        ];

        const selectedIds = activeOutreach.filter((o) => o.stopId === stop.id).map(toOptionId);
        for (const o of activeOutreach.filter((o) => o.stopId === stop.id)) {
            if (!options.some((option) => option.id === toOptionId(o))) {
                options.push({
                    id: toOptionId(o),
                    name: targetName(o),
                    detail: o.targetType === "venue" ? "Venue" : "Promoter",
                });
            }
        }

        stopTargetsLinkModalRef.current?.open(stop.id, options, selectedIds);
    }

    function saveStopTargetIds(stopId: string, optionIds: string[]) {
        return saveStopTargets(
            stopId,
            optionIds.map((optionId) => {
                const [targetType, targetId] = optionId.split(":");
                return { targetType: targetType as OutreachTargetType, targetId };
            }),
        );
    }

    function linkedPromoters(venueId: string) {
        const venue = venuesWithPromoters.find((v) => v.id === venueId);
        return [...(venue?.promoters ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    }

    // Confirming a venue sends the city's other holds back to "In discussion", so check first.
    function saveOutreachWithConfirm(values: NewOutreach, outreachId: string) {
        const toRelease = values.status === "confirmed" ? otherHoldsInCity(outreachId, values.stopId) : [];
        if (toRelease.length === 0) return saveOutreach(values, outreachId);

        return new Promise<void>((resolve, reject) => {
            confirmModalRef.current?.open({
                message: `Confirm ${targetName(values)} on ${formatDate(values.showDate)}? ${toRelease
                    .map(targetName)
                    .join(", ")} will go back to In discussion.`,
                confirmLabel: "Confirm",
                onConfirm: () => saveOutreach(values, outreachId).then(resolve, reject),
                onCancel: () => reject(new Error("Confirmation cancelled")),
            });
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
                <button
                    className={activeTab === "tour" ? "tab-button tab-button-active" : "tab-button"}
                    type="button"
                    onClick={() => setActiveTab("tour")}
                >
                    Tour
                </button>

                <button className="login-button ghost-button" type="button" onClick={confirmSignOut}>
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
                            outreachFor={(venueId) => outreachFor("venue", venueId)}
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
                            outreachFor={(promoterId) => outreachFor("promoter", promoterId)}
                        />
                    )}

                    {activeTab === "tour" && (
                        <TourTab
                            tours={tours}
                            activeTour={activeTour}
                            stops={activeStops}
                            outreach={activeOutreach}
                            contactLog={activeContactLog}
                            venues={venues}
                            promoters={promoters}
                            onSelectTour={setActiveTour}
                            onNewTour={() => tourFormModalRef.current?.open()}
                            onEditTour={(tour) => tourFormModalRef.current?.open(tour)}
                            onAddStop={() => stopFormModalRef.current?.open()}
                            onEditStop={(stop) => stopFormModalRef.current?.open(stop)}
                            onFillStop={openStopTargets}
                            onOpenOutreach={(outreach, title) => outreachModalRef.current?.open(outreach, title)}
                            onOpenLog={(outreach, title) => contactLogModalRef.current?.open(outreach, title)}
                            onRemoveOutreach={confirmRemoveOutreach}
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

            <TourFormModal
                ref={tourFormModalRef}
                onSubmit={saveTour}
                onDelete={(tourId) => {
                    const tour = tours.find((t) => t.id === tourId);
                    if (tour) confirmDeleteTour(tour);
                }}
            />
            <StopFormModal
                ref={stopFormModalRef}
                onDelete={(stopId) => {
                    const stop = activeStops.find((s) => s.id === stopId);
                    if (stop) confirmDeleteStop(stop);
                }}
                cities={cities.filter((city) => city !== "All Cities")}
                onSubmit={(stop, editingStopId) =>
                    activeTour ? saveStop({ ...stop, tourId: activeTour.id }, editingStopId) : Promise.resolve()
                }
            />
            <LinkModal
                ref={stopTargetsLinkModalRef}
                title="Venues & Promoters"
                itemLabel="venues & promoters"
                onSave={saveStopTargetIds}
            />
            <OutreachModal
                ref={outreachModalRef}
                linkedPromoters={linkedPromoters}
                onSave={saveOutreachWithConfirm}
                onRemove={confirmRemoveOutreach}
            />
            <ContactLogModal
                ref={contactLogModalRef}
                contactLog={activeContactLog}
                onLogContact={logContact}
            />

            <ConfirmModal ref={confirmModalRef} />
        </div>
    );
}
