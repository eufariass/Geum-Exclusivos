import { Suspense, lazy } from "react";
import { AssistantWrapper } from "@/components/assistant/AssistantWrapper";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AssistantProvider } from "@/contexts/AssistantContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const SetupPassword = lazy(() => import("./pages/SetupPassword"));
const ImovelLanding = lazy(() => import("./pages/ImovelLanding"));
const ImoveisPublic = lazy(() => import("./pages/ImoveisPublic"));
const ImovelArboLanding = lazy(() => import("./pages/ImovelArboLanding"));
const ImoveisArboPublic = lazy(() => import("./pages/ImoveisArboPublic"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Configure React Query with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/imoveis" element={<ImoveisArboPublic />} />
                <Route path="/vitrine" element={<ImoveisArboPublic />} />
                <Route path="/imovel/:listingId" element={<ImovelArboLanding />} />
                <Route path="/" element={<ImoveisPublic />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/redefinir-senha" element={<ResetPassword />} />
                <Route path="/definir-senha" element={<SetupPassword />} />
                <Route path="/:codigo" element={<ImovelLanding />} />
                <Route
                  path="/sistema"
                  element={
                    <ProtectedRoute>
                      <AssistantProvider>
                        <Index />
                        <AssistantWrapper />
                      </AssistantProvider>
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
