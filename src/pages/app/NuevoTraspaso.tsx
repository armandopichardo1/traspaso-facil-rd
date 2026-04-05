import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Car, User, Shield, CreditCard, CheckCircle, Upload } from "lucide-react";

const STEPS = [
  { title: "Vehículo", icon: Car },
  { title: "Vendedor", icon: User },
  { title: "Comprador", icon: User },
  { title: "Antifraude", icon: Shield },
  { title: "Plan y Pago", icon: CreditCard },
];

type TipoPersona = "fisica" | "juridica";

type FormData = {
  vehiculo_marca: string;
  vehiculo_modelo: string;
  vehiculo_ano: string;
  vehiculo_placa: string;
  vehiculo_color: string;
  vendedor_tipo_persona: TipoPersona;
  vendedor_nombre: string;
  vendedor_cedula: string;
  vendedor_rnc: string;
  vendedor_telefono: string;
  comprador_tipo_persona: TipoPersona;
  comprador_nombre: string;
  comprador_cedula: string;
  comprador_rnc: string;
  comprador_telefono: string;
  plan: "basico" | "express";
  pago_seguro: boolean;
  precio_vehiculo: string;
  acepta_terminos: boolean;
};

export default function NuevoTraspaso() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [codigo, setCodigo] = useState("");

  const [form, setForm] = useState<FormData>({
    vehiculo_marca: "",
    vehiculo_modelo: "",
    vehiculo_ano: "",
    vehiculo_placa: "",
    vehiculo_color: "",
    vendedor_tipo_persona: "fisica",
    vendedor_nombre: "",
    vendedor_cedula: "",
    vendedor_rnc: "",
    vendedor_telefono: "",
    comprador_tipo_persona: "fisica",
    comprador_nombre: profile?.nombre || "",
    comprador_cedula: profile?.cedula || "",
    comprador_rnc: "",
    comprador_telefono: profile?.telefono || "",
    plan: "basico",
    pago_seguro: false,
    precio_vehiculo: "",
    acepta_terminos: false,
  });

  const update = (field: keyof FormData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleFile = (tipo: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [tipo]: file }));
  };

  const uploadFiles = async (traspasoId: string) => {
    for (const [tipo, file] of Object.entries(files)) {
      if (!file) continue;
      const path = `${user!.id}/${traspasoId}/${tipo}_${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(path, file);
      if (uploadError) continue;
      const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(path);
      await supabase.from("traspaso_documentos").insert({
        traspaso_id: traspasoId,
        tipo,
        file_url: urlData.publicUrl,
      });
    }
  };

  const handleSubmit = async () => {
    if (!form.acepta_terminos) {
      toast({ title: "Debes aceptar los términos y condiciones", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    const precio_servicio = form.plan === "express" ? 5000 : 3500;

    const { data, error } = await supabase
      .from("traspasos")
      .insert({
        customer_id: user!.id,
        vehiculo_marca: form.vehiculo_marca,
        vehiculo_modelo: form.vehiculo_modelo,
        vehiculo_ano: parseInt(form.vehiculo_ano) || null,
        vehiculo_placa: form.vehiculo_placa.toUpperCase(),
        vehiculo_color: form.vehiculo_color,
        vendedor_tipo_persona: form.vendedor_tipo_persona,
        vendedor_nombre: form.vendedor_nombre,
        vendedor_cedula: form.vendedor_tipo_persona === "fisica" ? form.vendedor_cedula : null,
        vendedor_rnc: form.vendedor_tipo_persona === "juridica" ? form.vendedor_rnc : null,
        vendedor_telefono: form.vendedor_telefono,
        comprador_tipo_persona: form.comprador_tipo_persona,
        comprador_nombre: form.comprador_nombre,
        comprador_cedula: form.comprador_tipo_persona === "fisica" ? form.comprador_cedula : null,
        comprador_rnc: form.comprador_tipo_persona === "juridica" ? form.comprador_rnc : null,
        comprador_telefono: form.comprador_telefono,
        plan: form.plan,
        precio_servicio,
        precio_vehiculo: form.pago_seguro ? parseFloat(form.precio_vehiculo) || null : null,
        escrow_status: form.pago_seguro ? "depositado" : "no_aplica",
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    if (data) {
      await uploadFiles(data.id);
      setCodigo(data.codigo || "");
      setStep(5);
    }
    setSubmitting(false);
  };

  const FileInput = ({ tipo, label }: { tipo: string; label: string }) => (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center">
        <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
        <input type="file" accept="image/*" className="hidden" id={`file-${tipo}`}
          onChange={(e) => handleFile(tipo, e.target.files?.[0] || null)} />
        <label htmlFor={`file-${tipo}`} className="text-sm text-accent cursor-pointer hover:underline">
          {files[tipo] ? files[tipo]!.name : "Seleccionar archivo"}
        </label>
      </div>
    </div>
  );

  const TipoPersonaToggle = ({ value, onChange }: { value: TipoPersona; onChange: (v: TipoPersona) => void }) => (
    <div className="grid grid-cols-2 gap-2 mb-3">
      {([["fisica", "Persona Física"], ["juridica", "Empresa"]] as const).map(([val, label]) => (
        <button key={val} onClick={() => onChange(val)}
          className={`border-2 rounded-lg py-2 px-3 text-sm font-medium transition-all ${
            value === val ? "border-accent bg-accent/5 text-accent" : "border-border text-muted-foreground"
          }`}>
          {label}
        </button>
      ))}
    </div>
  );

  if (step === 5) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 text-center">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-xl font-bold mb-2">¡Solicitud recibida! 🎉</h1>
        <p className="text-muted-foreground mb-2">Tu código de seguimiento:</p>
        <p className="text-2xl font-bold text-accent mb-6">{codigo}</p>
        <Button variant="cta" onClick={() => navigate("/app")} className="w-full" size="lg">
          Ir al Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <button onClick={() => step === 0 ? navigate("/app") : setStep(step - 1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> {step === 0 ? "Volver" : "Atrás"}
      </button>

      <h1 className="text-xl font-bold mb-1">Nuevo Traspaso</h1>
      <div className="flex gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? "bg-accent" : "bg-muted"}`} />
            <p className={`text-[10px] mt-1 text-center ${i <= step ? "text-accent font-medium" : "text-muted-foreground"}`}>{s.title}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {(() => { const Icon = STEPS[step].icon; return <Icon className="h-4 w-4" />; })()}
            {STEPS[step].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div><Label>Marca</Label><Input value={form.vehiculo_marca} onChange={(e) => update("vehiculo_marca", e.target.value)} placeholder="Toyota" /></div>
              <div><Label>Modelo</Label><Input value={form.vehiculo_modelo} onChange={(e) => update("vehiculo_modelo", e.target.value)} placeholder="Corolla" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Año</Label><Input type="number" value={form.vehiculo_ano} onChange={(e) => update("vehiculo_ano", e.target.value)} placeholder="2020" /></div>
                <div><Label>Color</Label><Input value={form.vehiculo_color} onChange={(e) => update("vehiculo_color", e.target.value)} placeholder="Blanco" /></div>
              </div>
              <div><Label>Placa</Label><Input value={form.vehiculo_placa} onChange={(e) => update("vehiculo_placa", e.target.value.toUpperCase())} placeholder="A123456" /></div>
            </>
          )}

          {step === 1 && (
            <>
              <TipoPersonaToggle value={form.vendedor_tipo_persona} onChange={(v) => update("vendedor_tipo_persona", v)} />
              <div><Label>Nombre del Vendedor</Label><Input value={form.vendedor_nombre} onChange={(e) => update("vendedor_nombre", e.target.value)} /></div>
              {form.vendedor_tipo_persona === "fisica" ? (
                <div><Label>Cédula (XXX-XXXXXXX-X)</Label><Input value={form.vendedor_cedula} onChange={(e) => update("vendedor_cedula", e.target.value)} placeholder="001-0000000-0" /></div>
              ) : (
                <div><Label>RNC (X-XX-XXXXX-X)</Label><Input value={form.vendedor_rnc} onChange={(e) => update("vendedor_rnc", e.target.value)} placeholder="1-01-00000-0" /></div>
              )}
              <div><Label>Teléfono</Label><Input value={form.vendedor_telefono} onChange={(e) => update("vendedor_telefono", e.target.value)} /></div>
            </>
          )}

          {step === 2 && (
            <>
              <TipoPersonaToggle value={form.comprador_tipo_persona} onChange={(v) => update("comprador_tipo_persona", v)} />
              <div><Label>Nombre del Comprador</Label><Input value={form.comprador_nombre} onChange={(e) => update("comprador_nombre", e.target.value)} /></div>
              {form.comprador_tipo_persona === "fisica" ? (
                <div><Label>Cédula (XXX-XXXXXXX-X)</Label><Input value={form.comprador_cedula} onChange={(e) => update("comprador_cedula", e.target.value)} placeholder="001-0000000-0" /></div>
              ) : (
                <div><Label>RNC (X-XX-XXXXX-X)</Label><Input value={form.comprador_rnc} onChange={(e) => update("comprador_rnc", e.target.value)} placeholder="1-01-00000-0" /></div>
              )}
              <div><Label>Teléfono</Label><Input value={form.comprador_telefono} onChange={(e) => update("comprador_telefono", e.target.value)} /></div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm text-muted-foreground">Sube los documentos de identidad para la verificación antifraude.</p>
              <FileInput tipo="cedula_comprador" label="Cédula del Comprador (frente)" />
              <FileInput tipo="selfie_comprador" label="Selfie del Comprador" />
              <FileInput tipo="cedula_vendedor" label="Cédula del Vendedor (frente)" />
              <FileInput tipo="selfie_vendedor" label="Selfie del Vendedor" />
              <FileInput tipo="matricula_foto" label="Foto de la Matrícula" />
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-sm text-accent">
                🛡️ Nuestro sistema verificará identidades y cruzará con DGII
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <Label className="mb-2 block">Plan de Servicio</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "basico" as const, label: "Básico", price: "RD$3,500", desc: "5-7 días" },
                    { value: "express" as const, label: "Express", price: "RD$5,000", desc: "2-3 días" },
                  ].map((p) => (
                    <button key={p.value} onClick={() => update("plan", p.value)}
                      className={`border-2 rounded-xl p-4 text-left transition-all ${form.plan === p.value ? "border-accent bg-accent/5" : "border-border"}`}>
                      <p className="font-semibold text-sm">{p.label}</p>
                      <p className="text-lg font-bold text-accent">{p.price}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox checked={form.pago_seguro} onCheckedChange={(v) => update("pago_seguro", !!v)} />
                <Label>¿Activar Pago Seguro (Escrow)?</Label>
              </div>
              {form.pago_seguro && (
                <div><Label>Precio del Vehículo (RD$)</Label><Input type="number" value={form.precio_vehiculo} onChange={(e) => update("precio_vehiculo", e.target.value)} placeholder="500,000" /></div>
              )}
              <div className="bg-muted rounded-lg p-4 text-sm space-y-1">
                <p className="font-semibold">Resumen</p>
                <p>Vehículo: {form.vehiculo_marca} {form.vehiculo_modelo} {form.vehiculo_ano}</p>
                <p>Placa: {form.vehiculo_placa}</p>
                <p>Plan: {form.plan === "express" ? "Express (RD$5,000)" : "Básico (RD$3,500)"}</p>
                {form.pago_seguro && <p>Pago Seguro: RD$ {parseInt(form.precio_vehiculo || "0").toLocaleString()}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Checkbox checked={form.acepta_terminos} onCheckedChange={(v) => update("acepta_terminos", !!v)} />
                <Label className="text-sm">Acepto los términos y condiciones</Label>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            {step < 4 ? (
              <Button variant="cta" className="w-full" onClick={() => setStep(step + 1)}>
                Siguiente <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button variant="cta" className="w-full" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Enviando..." : "Confirmar Solicitud →"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
