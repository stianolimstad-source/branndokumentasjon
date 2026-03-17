import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import Index from "./pages/Index";
import Konsept from "./pages/Konsept";
import Verktoy from "./pages/Verktoy";
import Romningsvei from "./pages/verktoy/Romningsvei";
import Straling from "./pages/verktoy/Straling";
import Flammehoyde from "./pages/verktoy/Flammehoyde";
import Omhyllingsflate from "./pages/verktoy/Omhyllingsflate";
import Persontall from "./pages/verktoy/Persontall";
import Brannenergi from "./pages/verktoy/Brannenergi";

import Auth from "./pages/Auth";
import MineProsjekter from "./pages/MineProsjekter";
import ProsjektDetalj from "./pages/ProsjektDetalj";
import MineKontakter from "./pages/MineKontakter";
import MineOppgaver from "./pages/MineOppgaver";
import GruppeDetalj from "./pages/GruppeDetalj";
import KSGjennomgang from "./pages/KSGjennomgang";
import KvalitativAnalyse from "./pages/fraviksdokumentasjon/KvalitativAnalyse";
import MinProfil from "./pages/MinProfil";
import Sikkerhetsrutiner from "./pages/Sikkerhetsrutiner";
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
            <Route path="/verktoy" element={<Verktoy />} />
            <Route path="/verktoy/romningsvei" element={<Romningsvei />} />
            <Route path="/verktoy/straling" element={<Straling />} />
            <Route path="/verktoy/flammehoyde" element={<Flammehoyde />} />
            <Route path="/verktoy/omhyllingsflate" element={<Omhyllingsflate />} />
            <Route path="/verktoy/persontall" element={<Persontall />} />
            <Route path="/verktoy/brannenergi" element={<Brannenergi />} />
            
            <Route path="/auth" element={<Auth />} />
            <Route path="/mine-prosjekter" element={<MineProsjekter />} />
            <Route path="/prosjekt/:id" element={<ProsjektDetalj />} />
            <Route path="/mine-oppgaver" element={<MineOppgaver />} />
            <Route path="/ks-gjennomgang" element={<KSGjennomgang />} />
            <Route path="/mine-kontakter" element={<MineKontakter />} />
            <Route path="/mine-kontakter/gruppe/:id" element={<GruppeDetalj />} />
            <Route path="/fraviksdokumentasjon/kvalitativ" element={<KvalitativAnalyse />} />
            <Route path="/min-profil" element={<MinProfil />} />
            <Route path="/sikkerhetsrutiner" element={<Sikkerhetsrutiner />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
