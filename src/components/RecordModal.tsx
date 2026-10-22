import { useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from "react";
import { FaBuilding, FaBullhorn, FaEnvelope, FaFacebook, FaInstagram, FaLink } from "react-icons/fa";
import type { ContactChannel, PromoterWithVenues, RecordKind, VenueWithPromoters } from "../types/venue";
import { hasContact } from "../utils/contact";
import "./Modal.css";
import "./DataTable.css";
import "./RecordModal.css";

export type RecordModalHandle = {
    open: (kind: RecordKind, id: string) => void;
};

type RecordModalProps = {
    venues: VenueWithPromoters[];
    promoters: PromoterWithVenues[];
    onEditVenue: (venue: VenueWithPromoters) => void;
    onEditPromoter: (promoter: PromoterWithVenues) => void;
    onLinkPromoters: (venue: VenueWithPromoters) => void;
    onLinkVenues: (promoter: PromoterWithVenues) => void;
    ref?: Ref<RecordModalHandle>;
};

// A read-only look at a venue or promoter: contact details and who it's linked to. Linked
// chips swap the modal to that record; Edit hands over to the usual form.
export default function RecordModal({
    venues,
    promoters,
    onEditVenue,
    onEditPromoter,
    onLinkPromoters,
    onLinkVenues,
    ref,
}: RecordModalProps) {
    const modalRef = useRef<HTMLDialogElement>(null);
    const [shown, setShown] = useState<{ kind: RecordKind; id: string } | null>(null);

    useImperativeHandle(ref, () => ({
        open(kind, id) {
            setShown({ kind, id });
            modalRef.current?.showModal();
        },
    }));

    // Looked up on every render so edits made from here show straight away.
    const venue = shown?.kind === "venue" ? venues.find((v) => v.id === shown.id) : undefined;
    const promoter = shown?.kind === "promoter" ? promoters.find((p) => p.id === shown.id) : undefined;
    const record = venue ?? promoter;

    // Closes if the record goes away underneath it, e.g. it was deleted.
    const isMissing = !!shown && !record;
    useEffect(() => {
        if (isMissing) modalRef.current?.close();
    }, [isMissing]);

    function close() {
        modalRef.current?.close();
    }

    // Closes first so the form opens on its own rather than stacked over this.
    function handOver(action: () => void) {
        close();
        action();
    }

    const subtitle = venue
        ? [venue.city, venue.managesInHouse ? "Books in-house" : ""].filter(Boolean).join(" · ")
        : promoter
            ? `Promoter · ${promoter.venues.length} ${promoter.venues.length === 1 ? "venue" : "venues"}`
            : "";

    return (
        <dialog id="record-modal" ref={modalRef} onClose={() => setShown(null)}>
            {record && (
                <div className="modal-box record-modal">
                    <div className="record-modal-header">
                        <span className="record-modal-kind" aria-hidden="true">
                            {venue ? <FaBuilding /> : <FaBullhorn />}
                        </span>
                        <div className="modal-title">
                            {record.name}
                            {subtitle && <div className="modal-subtitle">{subtitle}</div>}
                        </div>
                    </div>

                    <section className="record-modal-section">
                        <h3 className="record-modal-heading">Contact</h3>
                        {hasContact(record) ? (
                            <ul className="record-modal-contacts">
                                <ContactLine channel="email" value={record.email} href={record.email && `mailto:${record.email}`} preferred={record.preferredContact} icon={<FaEnvelope />} />
                                <ContactLine channel="website" value={record.website} href={record.website} preferred={record.preferredContact} icon={<FaLink />} />
                                <ContactLine channel="instagram" value={record.instagram} href={record.instagram} preferred={record.preferredContact} icon={<FaInstagram />} />
                                <ContactLine channel="facebook" value={record.facebook} href={record.facebook} preferred={record.preferredContact} icon={<FaFacebook />} />
                            </ul>
                        ) : (
                            <div className="record-modal-empty">No contact details yet.</div>
                        )}
                    </section>

                    <section className="record-modal-section">
                        <h3 className="record-modal-heading">{venue ? "Promoters" : "Venues"}</h3>
                        <div className="data-tags">
                            {venue?.managesInHouse && <span className="data-pill">In-house</span>}
                            {venue && [...venue.promoters]
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((p) => (
                                    <button key={p.id} className="data-tag" type="button" onClick={() => setShown({ kind: "promoter", id: p.id })}>
                                        <FaBullhorn className="data-tag-icon" aria-hidden="true" />
                                        {p.name}
                                    </button>
                                ))}
                            {promoter && [...promoter.venues]
                                .sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name))
                                .map((v) => (
                                    <button key={v.id} className="data-tag" type="button" onClick={() => setShown({ kind: "venue", id: v.id })}>
                                        <FaBuilding className="data-tag-icon" aria-hidden="true" />
                                        {v.name}
                                        <span className="data-tag-meta">{v.city}</span>
                                    </button>
                                ))}
                            {venue && !venue.managesInHouse && venue.promoters.length === 0 && (
                                <span className="record-modal-empty">No promoters linked.</span>
                            )}
                            {promoter && promoter.venues.length === 0 && (
                                <span className="record-modal-empty">No venues linked.</span>
                            )}
                        </div>
                    </section>

                    <div className="modal-actions">
                        <button
                            className="create-button"
                            type="button"
                            onClick={() => handOver(() => (venue ? onEditVenue(venue) : onEditPromoter(promoter!)))}
                        >
                            Edit
                        </button>
                        <button
                            className="cancel-button"
                            type="button"
                            onClick={() => handOver(() => (venue ? onLinkPromoters(venue) : onLinkVenues(promoter!)))}
                        >
                            {venue ? "Edit promoters" : "Edit venues"}
                        </button>
                        <button className="cancel-button" type="button" onClick={close}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </dialog>
    );
}

type ContactLineProps = {
    channel: ContactChannel;
    value?: string;
    href?: string;
    preferred?: ContactChannel | "";
    icon: ReactNode;
};

function ContactLine({ channel, value, href, preferred, icon }: ContactLineProps) {
    if (!value) return null;
    const isPreferred = channel === preferred;
    const external = channel !== "email";
    return (
        <li className={isPreferred ? "record-modal-contact record-modal-contact-preferred" : "record-modal-contact"}>
            <span className="record-modal-contact-icon" aria-hidden="true">{icon}</span>
            <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {external ? displayUrl(value) : value}
            </a>
            {isPreferred && <span className="record-modal-preferred">Preferred</span>}
        </li>
    );
}

// "https://www.instagram.com/chalkbrighton/" → "instagram.com/chalkbrighton"
function displayUrl(url: string) {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}
