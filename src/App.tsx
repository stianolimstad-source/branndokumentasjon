import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Konsept from "./pages/Konsept";
import Verktoy from "./pages/Verktoy";
import Romningsvei from "./pages/verktoy/Romningsvei";
import Straling from "./pages/verktoy/Straling";
import Flammehoyde from "./pages/verktoy/Flammehoyde";
import Omhyllingsflate from "./pages/verktoy/Omhyllingsflate";
import Persontall from "./pages/verktoy/Persontall";
import Priskalkulator from "./pages/Priskalkulator";
import Auth from "./pages/Auth";
import MineProsjekter from "./pages/MineProsjekter";
import MineKontakter from "./pages/MineKontakter";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/konsept" element={<Konsept />} />
            <Route path="/verktoy" element={<Verktoy />} />
            <Route path="/verktoy/romningsvei" element={<Romningsvei />} />
            <Route path="/verktoy/straling" element={<Straling />} />
            <Route path="/verktoy/flammehoyde" element={<Flammehoyde />} />
            <Route path="/verktoy/omhyllingsflate" element={<Omhyllingsflate />} />
            <Route path="/verktoy/persontall" element={<Persontall />} />
            <Route path="/priskalkulator" element={<Priskalkulator />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/mine-prosjekter" element={<MineProsjekter />} />
            <Route path="/mine-kontakter" element={<MineKontakter />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
