import type { ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import SignInPage from "./SignInPage";
import Spinner from "./Spinner";

type AuthGateProps = {
    children: ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="page-loading">
                <Spinner size={32} />
            </div>
        );
    }

    return user ? children : <SignInPage />;
}
