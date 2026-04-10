import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import Index from "./pages/Index";
import Konsept from "./pages/Konsept";
import Tilstandsvurdering from "./pages/Tilstandsvurdering";
import Verktoy from "./pages/Verktoy";
import Romningsvei from "./pages/verktoy/Romningsvei";
import Straling from "./pages/verktoy/Straling";
import Flammehoyde from "./pages/verktoy/Flammehoyde";
import Omhyllingsflate from "./pages/verktoy/Omhyllingsflate";
import Persontall from "./pages/verktoy/Persontall";
import Brannenergi from "./pages/verktoy/Brannenergi";
import Brannmotstand from "./pages/verktoy/Brannmotstand";
import Brannareal from "./pages/verktoy/Brannareal";
import RoykventilasjonPage from "./pages/verktoy/Roykventilasjon";

import Auth from "./pages/Auth";
import MineProsjekter from "./pages/MineProsjekter";
import ProsjektDetalj from "./pages/ProsjektDetalj";
import MineKontakter from "./pages/MineKontakter";
import MineOppgaver from "./pages/MineOppgaver";
import GruppeDetalj from "./pages/GruppeDetalj";
import KSGjennomgang from "./pages/KSGjennomgang";
import KvalitativAnalyse from "./pages/fraviksdokumentasjon/KvalitativAnalyse";
import MinProfil from "./pages/MinProfil";
import Dashboard from "./pages/Dashboard";
import Sikkerhetsrutiner from "./pages/Sikkerhetsrutiner";
import Eksempelkatalog from "./pages/Eksempelkatalog";
import BranntekniskeKonstruksjoner from "./pages/eksempelkatalog/BranntekniskeKonstruksjoner";
import ResetPassword from "./pages/ResetPassword";
import Brensellagring from "./pages/Brensellagring";
import TEK17Assistent from "./pages/TEK17Assistent";
import TEK17Chat from "./components/tek17/TEK17Chat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppHeader />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/konsept" element={<Konsept />} />
            <Route path="/tilstandsvurdering" element={<Tilstandsvurdering />} />
            <Route path="/verktoy" element={<Verktoy />} />
            <Route path="/verktoy/romningsvei" element={<Romningsvei />} />
            <Route path="/verktoy/straling" element={<Straling />} />
            <Route path="/verktoy/flammehoyde" element={<Flammehoyde />} />
            <Route path="/verktoy/omhyllingsflate" element={<Omhyllingsflate />} />
            <Route path="/verktoy/persontall" element={<Persontall />} />
            <Route path="/verktoy/brannenergi" element={<Brannenergi />} />
            <Route path="/verktoy/brannmotstand" element={<Brannmotstand />} />
            <Route path="/verktoy/brannareal" element={<Brannareal />} />
            <Route path="/verktoy/roykventilasjon" element={<RoykventilasjonPage />} />
            
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/mine-prosjekter" element={<MineProsjekter />} />
            <Route path="/prosjekt/:id" element={<ProsjektDetalj />} />
            <Route path="/mine-oppgaver" element={<MineOppgaver />} />
            <Route path="/ks-gjennomgang" element={<KSGjennomgang />} />
            <Route path="/mine-kontakter" element={<MineKontakter />} />
            <Route path="/mine-kontakter/gruppe/:id" element={<GruppeDetalj />} />
            <Route path="/fraviksdokumentasjon/kvalitativ" element={<KvalitativAnalyse />} />
            <Route path="/min-profil" element={<MinProfil />} />
            <Route path="/brensellagring" element={<Brensellagring />} />
            <Route path="/sikkerhetsrutiner" element={<Sikkerhetsrutiner />} />
            <Route path="/eksempelkatalog" element={<Eksempelkatalog />} />
            <Route path="/eksempelkatalog/branncellevegger" element={<BranntekniskeKonstruksjoner />} />
            <Route path="/tek17-assistent" element={<TEK17Assistent />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <TEK17Chat />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
