import { useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from "react";
import { FaBuilding, FaBullhorn, FaTimes } from "react-icons/fa";
import { FiFacebook, FiInstagram, FiLink, FiMail, FiMapPin } from "react-icons/fi";
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

// A read-only look at a venue or promoter in two sections, each with its own Edit: Details (the
// record's own fields, edited in the usual form) and its links, titled like the table column
// ("Booked by" for a venue, "Venues" for a promoter) and edited in the link dialog. Linked chips
// swap the modal to that record.
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

    // Clicking the backdrop closes it, since there's nothing here to lose. Both the press and the
    // release must be outside the box, so selecting text and dragging out doesn't count.
    const pressedOutsideRef = useRef(false);

    function isOutside(e: React.MouseEvent<HTMLDialogElement>) {
        const box = e.currentTarget.getBoundingClientRect();
        return e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom;
    }

    // Closes first so the form opens on its own rather than stacked over this.
    function handOver(action: () => void) {
        close();
        action();
    }


    return (
        <dialog
            id="record-modal"
            ref={modalRef}
            onClose={() => setShown(null)}
            onMouseDown={(e) => {
                pressedOutsideRef.current = isOutside(e);
            }}
            onClick={(e) => {
                if (pressedOutsideRef.current && isOutside(e)) close();
            }}
        >
            {record && (
                <div className="modal-box record-modal">
                    <button className="modal-close" type="button" onClick={close} aria-label="Close" title="Close">
                        <FaTimes />
                    </button>
                    <div className="record-modal-header">
                        <span className="record-modal-kind" aria-hidden="true">
                            {venue ? <FaBuilding /> : <FaBullhorn />}
                        </span>
                        <div className="modal-title">
                            {record.name}
                            <div className="modal-subtitle">{venue ? "Venue" : "Promoter"}</div>
                        </div>
                    </div>

                    <section className="record-modal-section">
                        <SectionHeading
                            title="Details"
                            editLabel={`Edit ${record.name}'s details`}
                            onEdit={() => handOver(() => (venue ? onEditVenue(venue) : onEditPromoter(promoter!)))}
                        />
                        <ul className="record-modal-lines">
                            {venue && (
                                <li className="record-modal-line">
                                    <span className="record-modal-line-icon" aria-hidden="true"><FiMapPin /></span>
                                    {venue.city}
                                </li>
                            )}
                            <ContactLine channel="email" value={record.email} href={record.email && `mailto:${record.email}`} preferred={record.preferredContact} icon={<FiMail />} />
                            <ContactLine channel="website" value={record.website} href={record.website} preferred={record.preferredContact} icon={<FiLink />} />
                            <ContactLine channel="instagram" value={record.instagram} href={record.instagram} preferred={record.preferredContact} icon={<FiInstagram />} />
                            <ContactLine channel="facebook" value={record.facebook} href={record.facebook} preferred={record.preferredContact} icon={<FiFacebook />} />
                            {!hasContact(record) && (
                                <li className="record-modal-line record-modal-empty">No contact details yet.</li>
                            )}
                        </ul>
                    </section>

                    <section className="record-modal-section">
                        <SectionHeading
                            title={venue ? "Booked by" : "Venues"}
                            editLabel={venue ? `Edit who books ${record.name}` : `Edit ${record.name}'s venues`}
                            onEdit={() => handOver(() => (venue ? onLinkPromoters(venue) : onLinkVenues(promoter!)))}
                        />
                        {/* Same chips as the table's Booked by / Venues column. */}
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
                                <span className="data-pill">No promoters</span>
                            )}
                            {promoter && promoter.venues.length === 0 && <span className="data-pill">No venues</span>}
                        </div>
                    </section>
                </div>
            )}
        </dialog>
    );
}

// A section title with its own Edit on the right, so it's clear what each Edit changes.
function SectionHeading({ title, editLabel, onEdit }: { title: string; editLabel: string; onEdit: () => void }) {
    return (
        <div className="record-modal-heading-row">
            <h3 className="record-modal-heading">{title}</h3>
            <button className="data-edit-link" type="button" onClick={onEdit} aria-label={editLabel} title={editLabel}>
                Edit
            </button>
        </div>
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
        <li className={isPreferred ? "record-modal-line record-modal-line-preferred" : "record-modal-line"}>
            <span className="record-modal-line-icon" aria-hidden="true">{icon}</span>
            <a href={href} title={isPreferred ? `${value} (preferred)` : value} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {external ? displayUrl(value) : value}
            </a>
        </li>
    );
}

// "https://www.instagram.com/chalkbrighton/" → "instagram.com/chalkbrighton"
function displayUrl(url: string) {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}
