import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, ArrowRight, User, Briefcase, Shield, Zap } from "lucide-react";

type RoleTab = "cliente" | "gestor" | "admin";
type AdminSubRole = "admin" | "notario" | "mensajero";

const roleTabs: { key: RoleTab; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: "cliente", label: "Cliente", icon: <User className="h-4 w-4" />, desc: "Gestiona tus traspasos" },
  { key: "gestor", label: "Gestor", icon: <Briefcase className="h-4 w-4" />, desc: "Panel de gestión" },
  { key: "admin", label: "Administrativo", icon: <Shield className="h-4 w-4" />, desc: "Admin, Notario, Mensajero" },
];

const adminSubRoleLabels: Record<AdminSubRole, { label: string; desc: string }> = {
  admin: { label: "Administrador", desc: "Panel de administración general" },
  notario: { label: "Notario", desc: "Certificación y firma de contratos" },
  mensajero: { label: "Mensajero", desc: "Recogida y entrega de matrículas" },
};

export default function Login() {
  const [activeRole, setActiveRole] = useState<RoleTab>("cliente");
  const [adminSubRole, setAdminSubRole] = useState<AdminSubRole>("admin");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({
          title: "¡Cuenta creada!",
          description: "Ya puedes iniciar sesión.",
        });
      }
    } else {
      const { error, data } = await signIn(email, password);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        const userId = data?.user?.id;
        if (userId) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .single();
          if (profileData?.role === "gestor") {
            navigate("/gestor");
            setSubmitting(false);
            return;
          }
          if (profileData?.role === "admin") {
            navigate("/admin");
            setSubmitting(false);
            return;
          }
          if (profileData?.role === "notario") {
            navigate("/notario");
            setSubmitting(false);
            return;
          }
          if (profileData?.role === "mensajero") {
            navigate("/mensajero");
            setSubmitting(false);
            return;
          }
        }
        navigate("/app");
      }
    }
    setSubmitting(false);
  };

  const getDescription = () => {
    if (activeRole === "cliente") return "Accede a tu panel de traspasos";
    if (activeRole === "gestor") return "Accede al panel de gestión";
    return adminSubRoleLabels[adminSubRole].desc;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>
              <span className="text-primary">TRASPASA</span>
              <span className="text-teal">.DO</span>
            </span>
          </a>
          <p className="text-muted-foreground mt-1">Tu traspaso vehicular, simplificado</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {roleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveRole(tab.key);
                setIsSignUp(false);
              }}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all text-center ${
                activeRole === tab.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40"
              }`}
            >
              {tab.icon}
              <span className="text-sm font-semibold">{tab.label}</span>
              <span className="text-[11px] leading-tight opacity-70">{tab.desc}</span>
            </button>
          ))}
        </div>

        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">
              {isSignUp ? "Crear Cuenta" : `Iniciar Sesión`}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? "Regístrate para gestionar tus traspasos"
                : getDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Admin sub-role dropdown */}
            {activeRole === "admin" && (
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-1.5 block">Tipo de acceso</label>
                <Select value={adminSubRole} onValueChange={(v) => setAdminSubRole(v as AdminSubRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="notario">Notario</SelectItem>
                    <SelectItem value="mensajero">Mensajero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" variant="cta" className="w-full" size="lg" disabled={submitting}>
                {submitting ? "Procesando..." : isSignUp ? "Crear Cuenta" : "Entrar"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            {activeRole === "cliente" && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-accent hover:underline"
                >
                  {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
                </button>
              </div>
            )}

            {activeRole !== "cliente" && (
              <p className="mt-4 text-xs text-center text-muted-foreground">
                Las cuentas de {activeRole === "gestor" ? "gestores" : "administradores, notarios y mensajeros"} son creadas por un administrador.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick access buttons */}
        <div className="mt-6 p-4 rounded-xl border border-dashed border-accent/40 bg-accent/5">
          <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Acceso Rápido (Dev)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Cliente", email: "cliente@test.com", password: "Test1234!", icon: "👤" },
              { label: "Gestor", email: "gestor@test.com", password: "Test1234!", icon: "💼" },
              { label: "Admin", email: "admin@traspasa.do", password: "Test1234!", icon: "🛡️" },
              { label: "Notario", email: "testnotario@traspasa.do", password: "Test1234!", icon: "📋" },
              { label: "Mensajero", email: "mensajero@test.com", password: "Test1234!", icon: "🏍️" },
            ].map((acc) => (
              <Button
                key={acc.label}
                variant="outline"
                size="sm"
                className="text-xs justify-start gap-1.5"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  const { error, data } = await signIn(acc.email, acc.password);
                  if (error) {
                    toast({ title: "Error", description: `${acc.label}: ${error.message}`, variant: "destructive" });
                    setSubmitting(false);
                    return;
                  }
                  const userId = data?.user?.id;
                  if (userId) {
                    const { data: profileData } = await supabase
                      .from("profiles")
                      .select("role")
                      .eq("id", userId)
                      .single();
                    const role = profileData?.role;
                    if (role === "gestor") { navigate("/gestor"); setSubmitting(false); return; }
                    if (role === "admin") { navigate("/admin"); setSubmitting(false); return; }
                    if (role === "notario") { navigate("/notario"); setSubmitting(false); return; }
                    if (role === "mensajero") { navigate("/mensajero"); setSubmitting(false); return; }
                  }
                  navigate("/app");
                  setSubmitting(false);
                }}
              >
                <span>{acc.icon}</span> {acc.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="text-center mt-4">
          <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground">
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
