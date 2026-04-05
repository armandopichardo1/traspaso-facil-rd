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
import { ArrowLeft, ArrowRight, Car, User, Shield, CreditCard, CheckCircle, Upload, BadgePercent } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  { title: "Vehículo", icon: Car },
  { title: "Vendedor", icon: User },
  { title: "Comprador", icon: User },
  { title: "Antifraude", icon: Shield },
  { title: "Plan y Pago", icon: CreditCard },
];

const GESTOR_PLANS = [
  { value: "basico" as const, label: "Básico", price: "RD$2,500", priceNum: 2500, desc: "5-7 días · Precio mayorista", retail: "RD$3,500" },
  { value: "express" as const, label: "Express", price: "RD$3,500", priceNum: 3500, desc: "2-3 días · Precio mayorista", retail: "RD$5,000" },
];

type FormData = {
  vehiculo_marca: string;
  vehiculo_modelo: string;
  vehiculo_ano: string;
  vehiculo_placa: string;
  vehiculo_color: string;
  vendedor_nombre: string;
  vendedor_cedula: string;
  vendedor_telefono: string;
  comprador_nombre: string;
  comprador_cedula: string;
  comprador_telefono: string;
  plan: "basico" | "express";
  pago_seguro: boolean;
  precio_vehiculo: string;
  acepta_terminos: boolean;
};

export default function GestorNuevoTraspaso() {
  const { user } = useAuth();
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
    vendedor_nombre: "",
    vendedor_cedula: "",
    vendedor_telefono: "",
    comprador_nombre: "",
    comprador_cedula: "",
    comprador_telefono: "",
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

  const selectedPlan = GESTOR_PLANS.find(p => p.value === form.plan)!;

  const handleSubmit = async () => {
    if (!form.acepta_terminos) {
      toast({ title: "Debes aceptar los términos y condiciones", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    const { data, error } = await supabase
      .from("traspasos")
      .insert({
        customer_id: user!.id,
        gestor_id: user!.id,
        vehiculo_marca: form.vehiculo_marca,
        vehiculo_modelo: form.vehiculo_modelo,
        vehiculo_ano: parseInt(form.vehiculo_ano) || null,
        vehiculo_placa: form.vehiculo_placa.toUpperCase(),
        vehiculo_color: form.vehiculo_color,
        vendedor_nombre: form.vendedor_nombre,
        vendedor_cedula: form.vendedor_cedula,
        vendedor_telefono: form.vendedor_telefono,
        comprador_nombre: form.comprador_nombre,
        comprador_cedula: form.comprador_cedula,
        comprador_telefono: form.comprador_telefono,
        plan: form.plan,
        precio_servicio: selectedPlan.priceNum,
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
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id={`file-g-${tipo}`}
          onChange={(e) => handleFile(tipo, e.target.files?.[0] || null)}
        />
        <label htmlFor={`file-g-${tipo}`} className="text-sm text-accent cursor-pointer hover:underline">
          {files[tipo] ? files[tipo]!.name : "Seleccionar archivo"}
        </label>
      </div>
    </div>
  );

  if (step === 5) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 text-center">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-xl font-bold mb-2">¡Traspaso creado! 🎉</h1>
        <p className="text-muted-foreground mb-2">Código de seguimiento:</p>
        <p className="text-2xl font-bold text-accent mb-2">{codigo}</p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
          <BadgePercent className="h-5 w-5 text-green-600 mx-auto mb-1" />
          <p className="text-sm text-green-800 font-medium">Precio mayorista aplicado: RD$ {selectedPlan.priceNum.toLocaleString()}</p>
        </div>
        <Button variant="cta" onClick={() => navigate("/gestor")} className="w-full" size="lg">
          Ir al Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <button onClick={() => step === 0 ? navigate("/gestor") : setStep(step - 1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> {step === 0 ? "Volver" : "Atrás"}
      </button>

      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-xl font-bold">Nuevo Traspaso</h1>
        <Badge className="bg-green-100 text-green-800 text-xs">Mayorista</Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Precio especial para gestores</p>

      <div className="flex gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? "bg-accent" : "bg-muted"}`} />
            <p className={`text-[10px] mt-1 text-center ${i <= step ? "text-accent font-medium" : "text-muted-foreground"}`}>
              {s.title}
            </p>
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
              <div><Label>Nombre del Vendedor</Label><Input value={form.vendedor_nombre} onChange={(e) => update("vendedor_nombre", e.target.value)} /></div>
              <div><Label>Cédula (XXX-XXXXXXX-X)</Label><Input value={form.vendedor_cedula} onChange={(e) => update("vendedor_cedula", e.target.value)} /></div>
              <div><Label>Teléfono</Label><Input value={form.vendedor_telefono} onChange={(e) => update("vendedor_telefono", e.target.value)} /></div>
            </>
          )}

          {step === 2 && (
            <>
              <div><Label>Nombre del Comprador</Label><Input value={form.comprador_nombre} onChange={(e) => update("comprador_nombre", e.target.value)} /></div>
              <div><Label>Cédula (XXX-XXXXXXX-X)</Label><Input value={form.comprador_cedula} onChange={(e) => update("comprador_cedula", e.target.value)} /></div>
              <div><Label>Teléfono</Label><Input value={form.comprador_telefono} onChange={(e) => update("comprador_telefono", e.target.value)} /></div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm text-muted-foreground">
                Sube los documentos de identidad para la verificación antifraude.
              </p>
              <FileInput tipo="cedula_comprador" label="Cédula del Comprador (frente)" />
              <FileInput tipo="selfie_comprador" label="Selfie del Comprador" />
              <FileInput tipo="cedula_vendedor" label="Cédula del Vendedor (frente)" />
              <FileInput tipo="selfie_vendedor" label="Selfie del Vendedor" />
              <FileInput tipo="matricula_foto" label="Foto de la Matrícula" />
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <Label className="mb-2 block">Plan de Servicio (Precio Mayorista)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {GESTOR_PLANS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => update("plan", p.value)}
                      className={`border-2 rounded-xl p-4 text-left transition-all ${
                        form.plan === p.value ? "border-accent bg-accent/5" : "border-border"
                      }`}
                    >
                      <p className="font-semibold text-sm">{p.label}</p>
                      <p className="text-lg font-bold text-accent">{p.price}</p>
                      <p className="text-xs text-muted-foreground line-through">{p.retail}</p>
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
                <div>
                  <Label>Precio del Vehículo (RD$)</Label>
                  <Input type="number" value={form.precio_vehiculo} onChange={(e) => update("precio_vehiculo", e.target.value)} placeholder="500,000" />
                </div>
              )}

              <div className="bg-muted rounded-lg p-4 text-sm space-y-1">
                <p className="font-semibold">Resumen</p>
                <p>Vehículo: {form.vehiculo_marca} {form.vehiculo_modelo} {form.vehiculo_ano}</p>
                <p>Placa: {form.vehiculo_placa}</p>
                <p>Plan: {selectedPlan.label} ({selectedPlan.price})</p>
                <p className="text-green-700 font-medium">Ahorro: RD$ {((form.plan === "express" ? 5000 : 3500) - selectedPlan.priceNum).toLocaleString()}</p>
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

