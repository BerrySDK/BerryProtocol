import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { StudioAuthGate } from "@/components/flow/StudioAuthGate";
import { Skeleton } from "@/components/ui/skeleton";

const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const ConnectionsPage = lazy(() => import("@/pages/ConnectionsPage"));
const FlowEditorPage = lazy(() => import("@/pages/FlowEditorPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const StudioPage = lazy(() => import("@/pages/StudioPage"));
const TutorialsPage = lazy(() => import("@/pages/TutorialsPage"));

export default function App() {
  return (
    <StudioAuthGate>
      <BrowserRouter basename="/studio">
        <Suspense
          fallback={
            <main className="flex min-h-svh flex-col gap-3 p-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="min-h-0 flex-1 w-full" />
            </main>
          }
        >
          <Routes>
            <Route path="/" element={<StudioPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/flows/:flowId" element={<FlowEditorPage />} />
            <Route path="/conexoes" element={<ConnectionsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/notificacoes" element={<NotificationsPage />} />
            <Route path="/tutoriais" element={<TutorialsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </StudioAuthGate>
  );
}
