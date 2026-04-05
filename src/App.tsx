import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import GuiaTraspaso from "./pages/GuiaTraspaso.tsx";
import Norma0325 from "./pages/Norma0325.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminTraspasoDetail from "./pages/admin/AdminTraspasoDetail.tsx";
import AdminHistoriales from "./pages/admin/AdminHistoriales.tsx";
import Calculadora from "./pages/Calculadora.tsx";
import NotFound from "./pages/NotFound.tsx";
import Seguimiento from "./pages/Seguimiento.tsx";
import Login from "./pages/app/Login.tsx";
import CompleteProfile from "./pages/app/CompleteProfile.tsx";
import AppLayout from "./components/app/AppLayout.tsx";
import Dashboard from "./pages/app/Dashboard.tsx";
import HistorialDetail from "./pages/app/HistorialDetail.tsx";
import NuevoTraspaso from "./pages/app/NuevoTraspaso.tsx";
import TraspasoDetail from "./pages/app/TraspasoDetail.tsx";
import EscrowView from "./pages/app/EscrowView.tsx";
import Profile from "./pages/app/Profile.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/guia-traspaso" element={<GuiaTraspaso />} />
            <Route path="/norma-03-25" element={<Norma0325 />} />
            <Route path="/calculadora" element={<Calculadora />} />
            <Route path="/seguimiento/:code" element={<Seguimiento />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Auth */}
            <Route path="/app/login" element={<Login />} />
            <Route path="/app/complete-profile" element={<CompleteProfile />} />

            {/* Protected customer app */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="historial/:id" element={<HistorialDetail />} />
              <Route path="nuevo" element={<NuevoTraspaso />} />
              <Route path="traspaso/:id" element={<TraspasoDetail />} />
              <Route path="traspaso/:id/escrow" element={<EscrowView />} />
              <Route path="perfil" element={<Profile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
