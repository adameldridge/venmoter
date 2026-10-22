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
import type { NewOutreach, Outreach, OutreachTarget, Tour, TourStop } from "./types/tour";
import { sameCity } from "./utils/city";
import { formatDate } from "./utils/date";
import type { RowFocus, RowKind } from "./hooks/useRowFocus";

type Tab = "venues" | "promoters" | "tour";

const ALL_CITIES = "All Cities";

export default function App() {
    const [activeTab, setActiveTab] = useState<Tab>("tour");
    const [selectedCity, setSelectedCity] = useState(ALL_CITIES);
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    // The venue or promoter row another tab sent you to.
    const [rowFocus, setRowFocus] = useState<RowFocus | null>(null);

    const venueFormModalRef = useRef<VenueFormModalHandle>(null);
    const promoterFormModalRef = useRef<PromoterFormModalHandle>(null);
    const venuePromotersLinkModalRef = useRef<LinkModalHandle>(null);
    const promoterVenuesLinkModalRef = useRef<LinkModalHandle>(null);
    const confirmModalRef = useRef<ConfirmModalHandle>(null);
    const tourFormModalRef = useRef<TourFormModalHandle>(null);
    const outreachModalRef = useRef<OutreachModalHandle>(null);
    const contactLogModalRef = useRef<ContactLogModalHandle>(null);
    const stopFormModalRef = useRef<StopFormModalHandle>(null);

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

    // Removing a venue also removes promoters that were only on the list for it.
    function confirmRemoveOutreach(outreach: Outreach) {
        const city = activeStops.find((stop) => stop.id === outreach.stopId)?.city ?? "this city";
        if (outreach.targetType === "promoter") {
            confirmModalRef.current?.open({
                message: `Remove ${targetName(outreach)} from ${city}?`,
                confirmLabel: "Remove",
                danger: true,
                onConfirm: () => deleteOutreach(outreach.id),
            });
            return;
        }

        const remainingVenueIds = activeOutreach
            .filter((o) => o.stopId === outreach.stopId && o.targetType === "venue" && o.id !== outreach.id)
            .map((o) => o.targetId);
        const remaining = stopTargetsFor(outreach.stopId, remainingVenueIds);
        const goingPromoters = activeOutreach
            .filter((o) => o.stopId === outreach.stopId && o.targetType === "promoter")
            .filter((o) => !remaining.some((t) => t.targetType === "promoter" && t.targetId === o.targetId))
            .map(targetName);
        const names = [targetName(outreach), ...goingPromoters];
        const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];

        confirmModalRef.current?.open({
            message: `Remove ${list} from ${city}?`,
            confirmLabel: "Remove",
            danger: true,
            onConfirm: () => saveStopTargets(outreach.stopId, remaining),
        });
    }

    function targetName(target: OutreachTarget) {
        const list: { id: string; name: string }[] = target.targetType === "venue" ? venues : promoters;
        return list.find((item) => item.id === target.targetId)?.name ?? "";
    }

    // The full list for a city given its venues: those venues, every promoter linked to them,
    // and any promoter already on the list that's still linked to one of them (or to none, if
    // it was added before promoters followed venues). Promoters left with only removed venues go.
    function stopTargetsFor(stopId: string, venueIds: string[]): OutreachTarget[] {
        const promotersOf = (venueId: string) => venuesWithPromoters.find((v) => v.id === venueId)?.promoters ?? [];
        const linkedIds = new Set(venueIds.flatMap((id) => promotersOf(id).map((p) => p.id)));
        const current = activeOutreach.filter((o) => o.stopId === stopId);
        const listedVenueIds = current.filter((o) => o.targetType === "venue").map((o) => o.targetId);
        const orphanedIds = new Set(
            listedVenueIds.filter((id) => !venueIds.includes(id)).flatMap((id) => promotersOf(id).map((p) => p.id)),
        );
        const keptPromoterIds = current
            .filter((o) => o.targetType === "promoter" && !orphanedIds.has(o.targetId))
            .map((o) => o.targetId);

        return [
            ...venueIds.map((targetId) => ({ targetType: "venue" as const, targetId })),
            ...[...new Set([...linkedIds, ...keptPromoterIds])].map((targetId) => ({
                targetType: "promoter" as const,
                targetId,
            })),
        ];
    }

    function addStopPromoter(stop: TourStop, promoterId: string) {
        const current = activeOutreach
            .filter((o) => o.stopId === stop.id)
            .map((o) => ({ targetType: o.targetType, targetId: o.targetId }));
        return saveStopTargets(stop.id, [...current, { targetType: "promoter", targetId: promoterId }]);
    }

    function saveStopTargetIds(stopId: string, venueIds: string[]) {
        return saveStopTargets(stopId, stopTargetsFor(stopId, venueIds));
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

    function addStopVenue(stop: TourStop, venueId: string) {
        const listedVenueIds = activeOutreach
            .filter((o) => o.stopId === stop.id && o.targetType === "venue")
            .map((o) => o.targetId);
        return saveStopTargetIds(stop.id, [...listedVenueIds, venueId]);
    }

    function matchesSearch(name: string) {
        return name.toLowerCase().includes(searchTerm.trim().toLowerCase());
    }

    function promoterInCity(promoter: PromoterWithVenues, city: string) {
        return promoter.venues.some((venue) => venue.city === city);
    }

    function switchTab(tab: Tab) {
        setActiveTab(tab);
        setRowFocus(null);
    }

    // Opens a venue or promoter on its own tab, clearing any filter that would hide its row.
    function goTo(kind: RowKind, id: string) {
        const venue = kind === "venue" ? venuesWithPromoters.find((v) => v.id === id) : undefined;
        const promoter = kind === "promoter" ? promotersWithVenues.find((p) => p.id === id) : undefined;
        const target = venue ?? promoter;
        if (!target) return;

        if (!matchesSearch(target.name)) {
            setSearchInput("");
            setSearchTerm("");
        }
        const inCity = venue ? venue.city === selectedCity : promoterInCity(promoter!, selectedCity);
        if (selectedCity !== ALL_CITIES && !inCity) setSelectedCity(ALL_CITIES);

        setActiveTab(kind === "venue" ? "venues" : "promoters");
        setRowFocus({ kind, id, seq: Date.now() });
    }

    const visibleVenues = venuesWithPromoters
        .filter((venue) => selectedCity === ALL_CITIES || venue.city === selectedCity)
        .filter((venue) => matchesSearch(venue.name))
        .sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));

    const sortedVenues = [...venues].sort(
        (a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name),
    );

    const sortedPromoters = [...promoters].sort((a, b) => a.name.localeCompare(b.name));

    const visiblePromoters = promotersWithVenues
        .filter((promoter) => selectedCity === ALL_CITIES || promoterInCity(promoter, selectedCity))
        .filter((promoter) => matchesSearch(promoter.name))
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div>
            <div className="tabs">
                <button
                    className={activeTab === "tour" ? "tab-button tab-button-active" : "tab-button"}
                    type="button"
                    onClick={() => switchTab("tour")}
                >
                    Tour
                </button>
                <button
                    className={activeTab === "venues" ? "tab-button tab-button-active" : "tab-button"}
                    type="button"
                    onClick={() => switchTab("venues")}
                >
                    Venues
                </button>
                <button
                    className={activeTab === "promoters" ? "tab-button tab-button-active" : "tab-button"}
                    type="button"
                    onClick={() => switchTab("promoters")}
                >
                    Promoters
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
                            tour={activeTour ? { tour: activeTour, stops: activeStops, outreach: activeOutreach } : null}
                            onOpenOutreach={(outreach, title) => outreachModalRef.current?.open(outreach, title)}
                            onAddToStop={addStopVenue}
                            focus={rowFocus}
                            onGoTo={goTo}
                        />
                    )}

                    {activeTab === "promoters" && (
                        <PromotersTab
                            promoters={visiblePromoters}
                            cities={cities}
                            selectedCity={selectedCity}
                            onCityChange={setSelectedCity}
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
                            focus={rowFocus}
                            onGoTo={goTo}
                        />
                    )}

                    {activeTab === "tour" && (
                        <TourTab
                            tours={tours}
                            activeTour={activeTour}
                            stops={activeStops}
                            outreach={activeOutreach}
                            contactLog={activeContactLog}
                            venues={venuesWithPromoters}
                            promoters={promotersWithVenues}
                            onSelectTour={setActiveTour}
                            onNewTour={() => tourFormModalRef.current?.open()}
                            onEditTour={(tour) => tourFormModalRef.current?.open(tour)}
                            onAddStop={() => stopFormModalRef.current?.open()}
                            onRemoveStop={confirmDeleteStop}
                            onAddPromoter={addStopPromoter}
                            onAddVenue={addStopVenue}
                            onOpenOutreach={(outreach, title) => outreachModalRef.current?.open(outreach, title)}
                            onOpenLog={(outreach, title) => contactLogModalRef.current?.open(outreach, title)}
                            onRemoveOutreach={confirmRemoveOutreach}
                            onGoTo={goTo}
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
                cities={cities.filter(
                    (city) => city !== ALL_CITIES && !activeStops.some((stop) => sameCity(stop.city, city)),
                )}
                onSubmit={(stop, editingStopId) =>
                    activeTour ? saveStop({ ...stop, tourId: activeTour.id }, editingStopId) : Promise.resolve()
                }
            />
            <OutreachModal
                ref={outreachModalRef}
                linkedPromoters={linkedPromoters}
                isInHouse={(venueId) => !!venues.find((venue) => venue.id === venueId)?.managesInHouse}
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
