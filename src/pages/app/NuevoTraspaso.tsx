import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Car, User, Shield, CreditCard, CheckCircle, Upload, UserCheck } from "lucide-react";
import CedulaCapture, { type CedulaOcrResult } from "@/components/app/CedulaCapture";
import MarbeteCapture from "@/components/app/MarbeteCapture";

const STEPS = [
  { title: "Tu Rol", icon: UserCheck },
  { title: "Vehículo", icon: Car },
  { title: "Contraparte", icon: User },
  { title: "Documentos", icon: Shield },
  { title: "Plan y Pago", icon: CreditCard },
];

type MiRol = "vendedor" | "comprador";

type FormData = {
  tipo_vehiculo: string;
  vehiculo_marca: string;
  vehiculo_modelo: string;
  vehiculo_ano: string;
  vehiculo_placa: string;
  vehiculo_color: string;
  vehiculo_chasis: string;
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

export default function NuevoTraspaso() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [miRol, setMiRol] = useState<MiRol | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [cedulaFiles, setCedulaFiles] = useState<Record<string, string>>({});
  const [codigo, setCodigo] = useState("");

  const [form, setForm] = useState<FormData>({
    tipo_vehiculo: "vehiculo_motor",
    vehiculo_marca: "",
    vehiculo_modelo: "",
    vehiculo_ano: "",
    vehiculo_placa: "",
    vehiculo_color: "",
    vehiculo_chasis: "",
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

  const handleSelectRol = (rol: MiRol) => {
    setMiRol(rol);
    if (rol === "vendedor") {
      setForm(prev => ({
        ...prev,
        vendedor_nombre: profile?.nombre || "",
        vendedor_cedula: profile?.cedula || "",
        vendedor_telefono: profile?.telefono || "",
        comprador_nombre: "",
        comprador_cedula: "",
        comprador_telefono: "",
      }));
    } else {
      setForm(prev => ({
        ...prev,
        comprador_nombre: profile?.nombre || "",
        comprador_cedula: profile?.cedula || "",
        comprador_telefono: profile?.telefono || "",
        vendedor_nombre: "",
        vendedor_cedula: "",
        vendedor_telefono: "",
      }));
    }
    setStep(1);
  };

  const handleCedulaResult = (side: "vendedor" | "comprador", result: CedulaOcrResult, imageBase64: string) => {
    setForm(prev => ({
      ...prev,
      [`${side}_nombre`]: result.nombre_completo || prev[`${side}_nombre` as keyof FormData],
      [`${side}_cedula`]: result.cedula || prev[`${side}_cedula` as keyof FormData],
    }));
    setCedulaFiles(prev => ({ ...prev, [`cedula_${side}_frente`]: imageBase64 }));
  };

  const handleFile = (tipo: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [tipo]: file }));
  };

  const uploadFiles = async (traspasoId: string) => {
    for (const [tipo, file] of Object.entries(files)) {
      if (!file) continue;
      const path = `${user!.id}/${traspasoId}/${tipo}_${Date.now()}`;
      const { error: uploadError } = await supabase.storage.from("documentos").upload(path, file);
      if (uploadError) continue;
      const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(path);
      await supabase.from("traspaso_documentos").insert({ traspaso_id: traspasoId, tipo, file_url: urlData.publicUrl });
    }
    for (const [tipo, base64] of Object.entries(cedulaFiles)) {
      if (!base64) continue;
      const byteChars = atob(base64);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: "image/jpeg" });
      const path = `${user!.id}/${traspasoId}/${tipo}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from("documentos").upload(path, blob);
      if (uploadError) continue;
      const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(path);
      await supabase.from("traspaso_documentos").insert({ traspaso_id: traspasoId, tipo, file_url: urlData.publicUrl });
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
        tipo_vehiculo: form.tipo_vehiculo,
        vehiculo_marca: form.vehiculo_marca,
        vehiculo_modelo: form.vehiculo_modelo,
        vehiculo_ano: parseInt(form.vehiculo_ano) || null,
        vehiculo_placa: form.vehiculo_placa.toUpperCase(),
        vehiculo_color: form.vehiculo_color,
        vehiculo_chasis: form.vehiculo_chasis || null,
        vendedor_nombre: form.vendedor_nombre,
        vendedor_cedula: form.vendedor_cedula || null,
        vendedor_telefono: form.vendedor_telefono,
        comprador_nombre: form.comprador_nombre,
        comprador_cedula: form.comprador_cedula || null,
        comprador_telefono: form.comprador_telefono,
        plan: form.plan,
        precio_servicio,
        precio_vehiculo: form.pago_seguro ? parseFloat(form.precio_vehiculo) || null : null,
        escrow_status: form.pago_seguro ? "depositado" : "no_aplica",
      } as any)
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    if (data) {
      await uploadFiles((data as any).id);
      setCodigo((data as any).codigo || "");
      setStep(5);
    }
    setSubmitting(false);
  };

  const FileInput = ({ tipo, label }: { tipo: string; label: string }) => (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center">
        <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
        <input type="file" accept="image/*,application/pdf" className="hidden" id={`file-${tipo}`}
          onChange={(e) => handleFile(tipo, e.target.files?.[0] || null)} />
        <label htmlFor={`file-${tipo}`} className="text-sm text-accent cursor-pointer hover:underline">
          {files[tipo] ? files[tipo]!.name : "Seleccionar archivo"}
        </label>
      </div>
    </div>
  );

  // Success screen
  if (step === 5) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 text-center">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-xl font-bold mb-2">¡Solicitud recibida! 🎉</h1>
        <p className="text-muted-foreground mb-2">Tu código de seguimiento:</p>
        <p className="text-2xl font-bold text-accent mb-4">{codigo}</p>
        <p className="text-sm text-muted-foreground mb-6">
          Un gestor revisará tus documentos y generará el contrato. Te notificaremos cuando esté listo para firmar.
        </p>
        <Button variant="cta" onClick={() => navigate("/app")} className="w-full" size="lg">
          Ir al Dashboard
        </Button>
      </div>
    );
  }

  // Determine the "other" party label
  const contraparteLabel = miRol === "vendedor" ? "Comprador" : "Vendedor";
  const contraparteSide = miRol === "vendedor" ? "comprador" : "vendedor";

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

      {/* Step 0: Role selection */}
      {step === 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4" /> ¿Cuál es tu rol en este traspaso?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Selecciona si eres quien vende o quien compra el vehículo. Tus datos se llenarán automáticamente.</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSelectRol("vendedor")}
                className={`border-2 rounded-xl p-5 text-center transition-all hover:border-accent/50 ${
                  miRol === "vendedor" ? "border-accent bg-accent/5" : "border-border"
                }`}
              >
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
                  <User className="h-6 w-6 text-orange-600" />
                </div>
                <p className="font-semibold text-sm">Soy el Vendedor</p>
                <p className="text-xs text-muted-foreground mt-1">Vendo mi vehículo</p>
              </button>
              <button
                onClick={() => handleSelectRol("comprador")}
                className={`border-2 rounded-xl p-5 text-center transition-all hover:border-accent/50 ${
                  miRol === "comprador" ? "border-accent bg-accent/5" : "border-border"
                }`}
              >
                <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-2">
                  <User className="h-6 w-6 text-teal-600" />
                </div>
                <p className="font-semibold text-sm">Soy el Comprador</p>
                <p className="text-xs text-muted-foreground mt-1">Compro un vehículo</p>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {step >= 1 && step <= 4 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {(() => { const Icon = STEPS[step].icon; return <Icon className="h-4 w-4" />; })()}
              {STEPS[step].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Vehicle */}
            {step === 1 && (
              <>
                <div>
                  <Label className="mb-2 block">Tipo de Vehículo</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[["vehiculo_motor", "Vehículo de Motor"], ["motocicleta", "Motocicleta"]].map(([val, label]) => (
                      <button key={val} onClick={() => update("tipo_vehiculo", val)}
                        className={`border-2 rounded-lg py-2 px-3 text-sm font-medium transition-all ${
                          form.tipo_vehiculo === val ? "border-accent bg-accent/5 text-accent" : "border-border text-muted-foreground"
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div><Label>Marca</Label><Input value={form.vehiculo_marca} onChange={(e) => update("vehiculo_marca", e.target.value)} placeholder="Toyota" /></div>
                <div><Label>Modelo</Label><Input value={form.vehiculo_modelo} onChange={(e) => update("vehiculo_modelo", e.target.value)} placeholder="Corolla" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Año</Label><Input type="number" value={form.vehiculo_ano} onChange={(e) => update("vehiculo_ano", e.target.value)} placeholder="2020" /></div>
                  <div><Label>Color</Label><Input value={form.vehiculo_color} onChange={(e) => update("vehiculo_color", e.target.value)} placeholder="Blanco" /></div>
                </div>
                <div><Label>Placa</Label><Input value={form.vehiculo_placa} onChange={(e) => update("vehiculo_placa", e.target.value.toUpperCase())} placeholder="A123456" /></div>
                <div><Label>Chasis / VIN</Label><Input value={form.vehiculo_chasis} onChange={(e) => update("vehiculo_chasis", e.target.value.toUpperCase())} placeholder="1HGBH41JXMN109186" /></div>

                <MarbeteCapture
                  onCapture={(base64) => setCedulaFiles(prev => ({ ...prev, marbete: base64 }))}
                  captured={!!cedulaFiles["marbete"]}
                  onOcrResult={(ocrData) => {
                    if (ocrData.placa && !form.vehiculo_placa) {
                      update("vehiculo_placa", ocrData.placa.toUpperCase());
                    }
                  }}
                />
              </>
            )}

            {/* Step 2: Counterparty */}
            {step === 2 && (
              <>
                <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 text-sm text-accent mb-2">
                  ✅ Tus datos ({miRol === "vendedor" ? "vendedor" : "comprador"}) se pre-llenaron de tu perfil.
                </div>

                <CedulaCapture
                  label={`Cédula del ${contraparteLabel}`}
                  onResult={(result, base64) => handleCedulaResult(contraparteSide as "vendedor" | "comprador", result, base64)}
                />

                <div><Label>Nombre del {contraparteLabel}</Label>
                  <Input value={form[`${contraparteSide}_nombre` as keyof FormData] as string} onChange={(e) => update(`${contraparteSide}_nombre` as keyof FormData, e.target.value)} />
                </div>
                <div><Label>Cédula (XXX-XXXXXXX-X)</Label>
                  <MaskedInput mask="cedula" value={form[`${contraparteSide}_cedula` as keyof FormData] as string} onValueChange={(v) => update(`${contraparteSide}_cedula` as keyof FormData, v)} placeholder="001-0000000-0" />
                </div>
                <div><Label>Teléfono</Label>
                  <Input value={form[`${contraparteSide}_telefono` as keyof FormData] as string} onChange={(e) => update(`${contraparteSide}_telefono` as keyof FormData, e.target.value)} />
                </div>
              </>
            )}

            {/* Step 3: Documents */}
            {step === 3 && (
              <>
                <p className="text-sm text-muted-foreground">Sube los documentos básicos. El gestor solicitará documentos adicionales si son necesarios.</p>
                
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tu cédula ({miRol === "vendedor" ? "Vendedor" : "Comprador"})
                </div>
                {!cedulaFiles[`cedula_${miRol}_frente`] && <FileInput tipo={`cedula_${miRol}_frente`} label="Cédula (Frente)" />}
                {cedulaFiles[`cedula_${miRol}_frente`] && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" /> Cédula capturada por cámara
                  </div>
                )}
                <FileInput tipo={`cedula_${miRol}_reverso`} label="Cédula (Reverso)" />
                <FileInput tipo={`selfie_${miRol}`} label="Selfie de Verificación" />

                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
                  Cédula del {contraparteLabel}
                </div>
                {!cedulaFiles[`cedula_${contraparteSide}_frente`] && <FileInput tipo={`cedula_${contraparteSide}_frente`} label={`Cédula ${contraparteLabel} (Frente)`} />}
                {cedulaFiles[`cedula_${contraparteSide}_frente`] && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" /> Cédula del {contraparteLabel.toLowerCase()} capturada
                  </div>
                )}

                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Vehículo</div>
                <FileInput tipo="matricula_foto" label="Foto de la Matrícula" />

                <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-sm text-accent">
                  📄 El gestor revisará los documentos y solicitará cualquier otro que sea necesario (poder notarial, selfie de contraparte, etc.).
                </div>
              </>
            )}

            {/* Step 4: Plan & Payment */}
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
                  <p>Tu rol: {miRol === "vendedor" ? "Vendedor" : "Comprador"}</p>
                  <p>Vehículo: {form.vehiculo_marca} {form.vehiculo_modelo} {form.vehiculo_ano}</p>
                  <p>Placa: {form.vehiculo_placa} · Chasis: {form.vehiculo_chasis || "—"}</p>
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
      )}
    </div>
  );
}
