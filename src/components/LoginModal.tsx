import { useRef, useState, useImperativeHandle, type Ref } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { toast } from "sonner";
import Spinner from "./Spinner";
import "./Modal.css";
import "./Forms.css";

export type LoginModalHandle = {
    open: () => void;
};

type LoginModalProps = {
    ref?: Ref<LoginModalHandle>;
};

export default function LoginModal({ ref }: LoginModalProps) {
    const modalRef = useRef<HTMLDialogElement>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useImperativeHandle(ref, () => ({
        open() {
            setEmail("");
            setPassword("");
            modalRef.current?.showModal();
        },
    }));

    function closeModal() {
        modalRef.current?.close();
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            closeModal();
            toast.success("Logged in");
        } catch (error) {
            console.error("Error logging in:", error);
            toast.error("Invalid email or password");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <dialog id="login-modal" ref={modalRef}>
            <div className="modal-box entity-form">
                <div className="modal-title">Log In</div>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="loginEmail">Email *</label>
                        <input
                            id="loginEmail"
                            name="email"
                            type="email"
                            required
                            autoComplete="username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="loginPassword">Password *</label>
                        <input
                            id="loginPassword"
                            name="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="modal-actions">
                        <button className="create-button" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Spinner size={14} /> : "Log In"}
                        </button>
                        <button className="cancel-button" type="button" onClick={closeModal} disabled={isSubmitting}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </dialog>
    );
}
