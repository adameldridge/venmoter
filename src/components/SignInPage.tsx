import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { toast } from "sonner";
import Spinner from "./Spinner";
import "./Forms.css";
import "./SignInPage.css";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Logged in");
        } catch (error) {
            console.error("Error logging in:", error);
            toast.error("Invalid email or password");
            setIsSubmitting(false);
        }
    }

    return (
        <div className="sign-in-page">
            <div className="sign-in-box entity-form">
                <div className="sign-in-title">Sign In</div>
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

                    <button className="create-button sign-in-submit" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Spinner size={14} /> : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
