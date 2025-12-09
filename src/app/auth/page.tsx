
import { AuthView } from "@/components/auth-view";
import { Suspense } from "react";

export default function AuthPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AuthView />
        </Suspense>
    );
}
