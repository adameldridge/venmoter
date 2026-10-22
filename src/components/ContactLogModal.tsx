import { useRef, useState, useImperativeHandle, type Ref } from "react";
import {
    OUTREACH_CHANNELS,
    channelLabel,
    newestLogFirst,
    type ContactLogEntry,
    type NewContactLogEntry,
    type Outreach,
} from "../types/tour";
import { formatDate, nowTime, todayIsoDate } from "../utils/date";
import Spinner from "./Spinner";
import "./Modal.css";
import "./Forms.css";
import "./ContactLogModal.css";

export type ContactLogModalHandle = {
    open: (outreach: Outreach, title: string) => void;
};

type LogDraft = Omit<NewContactLogEntry, "outreachId" | "tourId">;

type ContactLogModalProps = {
    contactLog: ContactLogEntry[];
    onLogContact: (outreach: Outreach, entry: LogDraft) => Promise<void>;
    ref?: Ref<ContactLogModalHandle>;
};

const emptyDraft = (): LogDraft => ({ date: todayIsoDate(), time: nowTime(), channel: "", note: "" });

export default function ContactLogModal({ contactLog, onLogContact, ref }: ContactLogModalProps) {
    const modalRef = useRef<HTMLDialogElement>(null);
    const noteRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState("");
    const [outreach, setOutreach] = useState<Outreach | null>(null);
    const [draft, setDraft] = useState<LogDraft>(emptyDraft);
    const [isLogging, setIsLogging] = useState(false);

    useImperativeHandle(ref, () => ({
        open(outreach, title) {
            setTitle(title);
            setOutreach(outreach);
            setDraft(emptyDraft());
            modalRef.current?.showModal();
            // Wait a tick so the note field has rendered on the first open.
            setTimeout(() => noteRef.current?.focus());
        },
    }));

    function closeModal() {
        modalRef.current?.close();
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        setDraft((current) => ({ ...current, [name]: value }));
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!outreach) return;
        setIsLogging(true);
        try {
            await onLogContact(outreach, draft);
            closeModal();
        } catch (error) {
            console.error("Error logging contact:", error);
        } finally {
            setIsLogging(false);
        }
    }

    const entries = outreach
        ? contactLog
            .filter((entry) => entry.outreachId === outreach.id)
            .sort(newestLogFirst)
        : [];

    return (
        <dialog id="contact-log-modal" ref={modalRef}>
            <div className="modal-box entity-form contact-log-modal">
                <div className="modal-title">
                    Contact log
                    <div className="modal-subtitle">{title}</div>
                </div>

                <form className="contact-log-add" onSubmit={handleSubmit}>
                    <input
                        name="date"
                        type="date"
                        required
                        aria-label="Contact date"
                        value={draft.date}
                        onChange={handleChange}
                    />
                    <input name="time" type="time" aria-label="Contact time" value={draft.time} onChange={handleChange} />
                    <select name="channel" aria-label="Channel" value={draft.channel} onChange={handleChange}>
                        <option value="">Channel…</option>
                        {OUTREACH_CHANNELS.map((channel) => (
                            <option key={channel.value} value={channel.value}>
                                {channel.label}
                            </option>
                        ))}
                    </select>
                    <input
                        ref={noteRef}
                        name="note"
                        type="text"
                        placeholder="What happened?"
                        aria-label="Contact note"
                        value={draft.note}
                        onChange={handleChange}
                    />
                    <button className="create-button" type="submit" disabled={isLogging}>
                        {isLogging ? <Spinner size={14} /> : "Log contact"}
                    </button>
                </form>

                {entries.length === 0 ? (
                    <div className="contact-log-empty">No contact logged yet.</div>
                ) : (
                    <ul className="contact-log-list">
                        {entries.map((entry) => (
                            <li key={entry.id} className="contact-log-entry">
                                <div>
                                    <span className="contact-log-date">{formatDate(entry.date)}</span>
                                    {entry.time && <span className="contact-log-time"> {entry.time}</span>}
                                    {entry.channel && (
                                        <span className="contact-log-channel"> · {channelLabel(entry.channel)}</span>
                                    )}
                                    {entry.note && <div className="contact-log-note">{entry.note}</div>}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="modal-actions">
                    <button className="cancel-button" type="button" onClick={closeModal}>
                        Close
                    </button>
                </div>
            </div>
        </dialog>
    );
}
