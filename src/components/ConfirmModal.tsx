import { useRef, useState, useImperativeHandle, type Ref } from "react";
import "./Modal.css";

export type ConfirmModalHandle = {
    open: (options: {
        message: string;
        // Smaller lines under the message, e.g. what else a delete will remove.
        details?: string[];
        confirmLabel?: string;
        danger?: boolean;
        onConfirm: () => void;
        onCancel?: () => void;
    }) => void;
};

type ConfirmModalProps = {
    ref?: Ref<ConfirmModalHandle>;
};

export default function ConfirmModal({ ref }: ConfirmModalProps) {
    const modalRef = useRef<HTMLDialogElement>(null);
    const [message, setMessage] = useState("");
    const [details, setDetails] = useState<string[]>([]);
    const [confirmLabel, setConfirmLabel] = useState("Confirm");
    const [danger, setDanger] = useState(false);
    const onConfirmRef = useRef<() => void>(() => {});
    const onCancelRef = useRef<(() => void) | undefined>(undefined);

    useImperativeHandle(ref, () => ({
        open({ message, details, confirmLabel, danger, onConfirm, onCancel }) {
            setMessage(message);
            setDetails(details ?? []);
            setConfirmLabel(confirmLabel ?? "Confirm");
            setDanger(danger ?? false);
            onConfirmRef.current = onConfirm;
            onCancelRef.current = onCancel;
            modalRef.current?.showModal();
        },
    }));

    function closeModal() {
        modalRef.current?.close();
    }

    function handleConfirm() {
        closeModal();
        onConfirmRef.current();
    }

    function handleCancel() {
        closeModal();
        onCancelRef.current?.();
    }

    return (
        <dialog id="confirm-modal" ref={modalRef} onCancel={() => onCancelRef.current?.()}>
            <div className="modal-box">
                <div className="modal-title">{message}</div>
                {details.length > 0 && (
                    <ul className="modal-details">
                        {details.map((detail) => <li key={detail}>{detail}</li>)}
                    </ul>
                )}
                <div className="modal-actions">
                    <button
                        className={danger ? "danger-button" : "create-button"}
                        type="button"
                        onClick={handleConfirm}
                    >
                        {confirmLabel}
                    </button>
                    <button className="cancel-button" type="button" onClick={handleCancel}>
                        Cancel
                    </button>
                </div>
            </div>
        </dialog>
    );
}
