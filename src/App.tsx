import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import AjouterPage from "./pages/AjouterPage";
import ScannerPage from "./pages/ScannerPage";
import DetailPage from "./pages/DetailPage";
import ModifierPage from "./pages/ModifierPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/ajouter" element={<AjouterPage />} />
          <Route path="/scanner" element={<ScannerPage />} />
          <Route path="/medicament/:id" element={<DetailPage />} />
          <Route path="/medicament/:id/modifier" element={<ModifierPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
