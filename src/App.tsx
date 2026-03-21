import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomTabBar } from "@/components/BottomTabBar";
import { RightSidebar } from "@/components/RightSidebar";
import { ProfileNotificationProvider } from "@/contexts/ProfileNotificationContext";
import { GlobalConfirmModal } from "@/components/GlobalConfirmModal";
import Index from "./pages/Index";
import AjouterPage from "./pages/AjouterPage";
import ScannerPage from "./pages/ScannerPage";
import DetailPage from "./pages/DetailPage";
import ModifierPage from "./pages/ModifierPage";
import ConsultationsPage from "./pages/ConsultationsPage";
import NouvelleConsultationPage from "./pages/NouvelleConsultationPage";
import ConsultationDetailPage from "./pages/ConsultationDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ProfileNotificationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/ajouter" element={<AjouterPage />} />
            <Route path="/scanner" element={<ScannerPage />} />
            <Route path="/medicament/:id" element={<DetailPage />} />
            <Route path="/medicament/:id/modifier" element={<ModifierPage />} />
            <Route path="/consultations" element={<ConsultationsPage />} />
            <Route path="/consultations/nouvelle" element={<NouvelleConsultationPage />} />
            <Route path="/consultations/:id" element={<ConsultationDetailPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomTabBar />
          <RightSidebar />
        </BrowserRouter>
        <GlobalConfirmModal />
      </ProfileNotificationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
