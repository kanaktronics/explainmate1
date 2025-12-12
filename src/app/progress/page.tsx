
import { ProgressView } from "@/components/progress-view";
import { Suspense } from "react";

export default function ProgressPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProgressView />
        </Suspense>
    );
}
