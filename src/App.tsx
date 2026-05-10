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
import Brannsimulering from "./pages/verktoy/Brannsimulering";

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
import BrannfarligeStoffer from "./pages/eksempelkatalog/BrannfarligeStoffer";
import ResetPassword from "./pages/ResetPassword";
import Brensellagring from "./pages/Brensellagring";
import TEK17Assistent from "./pages/TEK17Assistent";

import Tilbud from "./pages/Tilbud";
import Oppdragsbekreftelse from "./pages/Oppdragsbekreftelse";
import NotFound from "./pages/NotFound";
import RequireFullAccess from "./components/RequireFullAccess";
import RequireSubscription from "./components/RequireSubscription";
import Abonnement from "./pages/Abonnement";
import { PaymentTestModeBanner } from "./components/PaymentTestModeBanner";
import { PastDueBanner } from "./components/PastDueBanner";
import Vilkar from "./pages/legal/Vilkar";
import Refusjon from "./pages/legal/Refusjon";
import Personvern from "./pages/legal/Personvern";
import Kontakt from "./pages/Kontakt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PaymentTestModeBanner />
          <PastDueBanner />
          <AppHeader />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/abonnement" element={<Abonnement />} />
            <Route path="/vilkar" element={<Vilkar />} />
            <Route path="/refusjon" element={<Refusjon />} />
            <Route path="/personvern" element={<Personvern />} />
            <Route path="/kontakt" element={<Kontakt />} />
            <Route path="/konsept" element={<RequireSubscription feature="Brannkonsept"><Konsept /></RequireSubscription>} />
            <Route path="/tilstandsvurdering" element={<RequireSubscription feature="Tilstandsvurdering"><Tilstandsvurdering /></RequireSubscription>} />
            <Route path="/brensellagring" element={<RequireSubscription feature="Brensellagring"><Brensellagring /></RequireSubscription>} />
            <Route path="/fraviksdokumentasjon/kvalitativ" element={<RequireSubscription feature="Fraviksdokumentasjon"><KvalitativAnalyse /></RequireSubscription>} />
            <Route path="/mine-prosjekter" element={<RequireSubscription feature="Prosjekter"><MineProsjekter /></RequireSubscription>} />
            <Route path="/prosjekt/:id" element={<RequireSubscription feature="Prosjekter"><ProsjektDetalj /></RequireSubscription>} />
            <Route path="/verktoy" element={<RequireSubscription feature="Beregningsverktøy"><Verktoy /></RequireSubscription>} />
            <Route path="/verktoy/romningsvei" element={<RequireSubscription feature="Beregningsverktøy"><Romningsvei /></RequireSubscription>} />
            <Route path="/verktoy/straling" element={<RequireSubscription feature="Beregningsverktøy"><Straling /></RequireSubscription>} />
            <Route path="/verktoy/flammehoyde" element={<RequireSubscription feature="Beregningsverktøy"><Flammehoyde /></RequireSubscription>} />
            <Route path="/verktoy/omhyllingsflate" element={<RequireSubscription feature="Beregningsverktøy"><Omhyllingsflate /></RequireSubscription>} />
            <Route path="/verktoy/persontall" element={<RequireSubscription feature="Beregningsverktøy"><Persontall /></RequireSubscription>} />
            <Route path="/verktoy/brannenergi" element={<RequireSubscription feature="Beregningsverktøy"><Brannenergi /></RequireSubscription>} />
            <Route path="/verktoy/brannmotstand" element={<RequireSubscription feature="Beregningsverktøy"><Brannmotstand /></RequireSubscription>} />
            <Route path="/verktoy/brannareal" element={<RequireSubscription feature="Beregningsverktøy"><Brannareal /></RequireSubscription>} />
            <Route path="/verktoy/roykventilasjon" element={<RequireSubscription feature="Beregningsverktøy"><RoykventilasjonPage /></RequireSubscription>} />
            <Route path="/verktoy/brannsimulering" element={<RequireFullAccess><Brannsimulering /></RequireFullAccess>} />
            
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/mine-oppgaver" element={<MineOppgaver />} />
            <Route path="/ks-gjennomgang" element={<KSGjennomgang />} />
            <Route path="/mine-kontakter" element={<MineKontakter />} />
            <Route path="/mine-kontakter/gruppe/:id" element={<GruppeDetalj />} />
            <Route path="/min-profil" element={<MinProfil />} />
            <Route path="/sikkerhetsrutiner" element={<RequireFullAccess><Sikkerhetsrutiner /></RequireFullAccess>} />
            <Route path="/eksempelkatalog" element={<RequireFullAccess><Eksempelkatalog /></RequireFullAccess>} />
            <Route path="/eksempelkatalog/branncellevegger" element={<RequireFullAccess><BranntekniskeKonstruksjoner /></RequireFullAccess>} />
            <Route path="/eksempelkatalog/brannfarlige-stoffer" element={<RequireFullAccess><BrannfarligeStoffer /></RequireFullAccess>} />
            <Route path="/tek17-assistent" element={<RequireFullAccess><TEK17Assistent /></RequireFullAccess>} />
            <Route path="/tilbud" element={<RequireFullAccess><Tilbud /></RequireFullAccess>} />
            <Route path="/oppdragsbekreftelse" element={<RequireFullAccess><Oppdragsbekreftelse /></RequireFullAccess>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
