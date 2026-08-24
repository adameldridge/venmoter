import { useRef, useState, useImperativeHandle, type Ref } from "react";
import "./Modal.css";

export type ConfirmModalHandle = {
    open: (options: { message: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void }) => void;
};

type ConfirmModalProps = {
    ref?: Ref<ConfirmModalHandle>;
};

export default function ConfirmModal({ ref }: ConfirmModalProps) {
    const modalRef = useRef<HTMLDialogElement>(null);
    const [message, setMessage] = useState("");
    const [confirmLabel, setConfirmLabel] = useState("Confirm");
    const [danger, setDanger] = useState(false);
    const onConfirmRef = useRef<() => void>(() => {});

    useImperativeHandle(ref, () => ({
        open({ message, confirmLabel, danger, onConfirm }) {
            setMessage(message);
            setConfirmLabel(confirmLabel ?? "Confirm");
            setDanger(danger ?? false);
            onConfirmRef.current = onConfirm;
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

    return (
        <dialog id="confirm-modal" ref={modalRef}>
            <div className="modal-box">
                <div className="modal-title">{message}</div>
                <div className="modal-actions">
                    <button
                        className={danger ? "danger-button" : "create-button"}
                        type="button"
                        onClick={handleConfirm}
                    >
                        {confirmLabel}
                    </button>
                    <button className="cancel-button" type="button" onClick={closeModal}>
                        Cancel
                    </button>
                </div>
            </div>
        </dialog>
    );
}
