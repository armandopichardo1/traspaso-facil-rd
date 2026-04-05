import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, CreditCard, Phone } from "lucide-react";

export default function CompleteProfile() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("profiles")
      .update({ nombre, cedula, telefono })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      toast({ title: "¡Perfil completado!" });
      navigate("/app");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">TRASPASA.DO</h1>
          <p className="text-muted-foreground mt-1">Completa tu perfil para continuar</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tu Información</CardTitle>
            <CardDescription>Necesitamos estos datos para gestionar tus traspasos</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre completo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cédula (XXX-XXXXXXX-X)"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Teléfono (809-XXX-XXXX)"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <Button type="submit" variant="cta" className="w-full" size="lg" disabled={submitting}>
                {submitting ? "Guardando..." : "Completar Perfil"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
