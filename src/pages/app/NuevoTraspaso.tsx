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
import { ArrowLeft, ArrowRight, Car, User, Shield, CreditCard, CheckCircle, Upload, FileText, AlertTriangle, UserCheck } from "lucide-react";
import CedulaCapture, { type CedulaOcrResult } from "@/components/app/CedulaCapture";
import MarbeteCapture from "@/components/app/MarbeteCapture";

const STEPS = [
  { title: "Tu Rol", icon: UserCheck },
  { title: "Vehículo", icon: Car },
  { title: "Vendedor", icon: User },
  { title: "Comprador", icon: User },
  { title: "Contrato", icon: FileText },
  { title: "Documentos", icon: Shield },
  { title: "Plan y Pago", icon: CreditCard },
];

const MEDIOS_PAGO = ["Transferencia Bancaria", "Cheque", "Efectivo", "Financiamiento"];

type TipoPersona = "fisica" | "juridica";
type MiRol = "vendedor" | "comprador";

type FormData = {
  tipo_vehiculo: string;
  vehiculo_marca: string;
  vehiculo_modelo: string;
  vehiculo_ano: string;
  vehiculo_placa: string;
  vehiculo_color: string;
  vehiculo_chasis: string;
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
  fecha_acto_venta: string;
  medio_pago: string;
  es_traspaso_familiar: boolean;
  tiene_apoderado: boolean;
  apoderado_nombre: string;
  apoderado_cedula: string;
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
    vendedor_tipo_persona: "fisica",
    vendedor_nombre: "",
    vendedor_cedula: "",
    vendedor_rnc: "",
    vendedor_telefono: "",
    comprador_tipo_persona: "fisica",
    comprador_nombre: "",
    comprador_cedula: "",
    comprador_rnc: "",
    comprador_telefono: "",
    fecha_acto_venta: "",
    medio_pago: "",
    es_traspaso_familiar: false,
    tiene_apoderado: false,
    apoderado_nombre: "",
    apoderado_cedula: "",
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
    const prefix = side === "vendedor" ? "vendedor" : "comprador";
    setForm(prev => ({
      ...prev,
      [`${prefix}_nombre`]: result.nombre_completo || prev[`${prefix}_nombre` as keyof FormData],
      [`${prefix}_cedula`]: result.cedula || prev[`${prefix}_cedula` as keyof FormData],
    }));
    setCedulaFiles(prev => ({ ...prev, [`cedula_${side}_frente`]: imageBase64 }));
  };

  const handleFile = (tipo: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [tipo]: file }));
  };

  const uploadFiles = async (traspasoId: string) => {
    // Upload regular files
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
    // Upload cedula captures (base64)
    for (const [tipo, base64] of Object.entries(cedulaFiles)) {
      if (!base64) continue;
      const byteChars = atob(base64);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: "image/jpeg" });
      const path = `${user!.id}/${traspasoId}/${tipo}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(path, blob);
      if (uploadError) continue;
      const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(path);
      await supabase.from("traspaso_documentos").insert({
        traspaso_id: traspasoId,
        tipo,
        file_url: urlData.publicUrl,
      });
    }
  };

  const fechaWarning = (() => {
    if (!form.fecha_acto_venta) return false;
    const diff = (new Date().getTime() - new Date(form.fecha_acto_venta).getTime()) / (1000 * 3600 * 24);
    return diff > 90;
  })();

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
        fecha_acto_venta: form.fecha_acto_venta || null,
        medio_pago: form.medio_pago || null,
        es_traspaso_familiar: form.es_traspaso_familiar,
        tiene_apoderado: form.tiene_apoderado,
        apoderado_nombre: form.tiene_apoderado ? form.apoderado_nombre : null,
        apoderado_cedula: form.tiene_apoderado ? form.apoderado_cedula : null,
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
      setStep(7);
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

  // Success screen
  if (step === 7) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 text-center">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-xl font-bold mb-2">¡Solicitud recibida! 🎉</h1>
        <p className="text-muted-foreground mb-2">Tu código de seguimiento:</p>
        <p className="text-2xl font-bold text-accent mb-4">{codigo}</p>
        <p className="text-sm text-muted-foreground mb-6">Los contratos se pueden generar y firmar desde el detalle del traspaso.</p>
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

      {step >= 1 && step <= 6 && (
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
              </>
            )}

            {/* Step 2: Seller */}
            {step === 2 && (
              <>
                {miRol === "vendedor" ? (
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 text-sm text-accent mb-2">
                    ✅ Tus datos se han pre-llenado como vendedor
                  </div>
                ) : (
                  <CedulaCapture
                    label="Cédula del Vendedor"
                    onResult={(result, base64) => handleCedulaResult("vendedor", result, base64)}
                  />
                )}
                <TipoPersonaToggle value={form.vendedor_tipo_persona} onChange={(v) => update("vendedor_tipo_persona", v)} />
                <div><Label>Nombre del Vendedor</Label><Input value={form.vendedor_nombre} onChange={(e) => update("vendedor_nombre", e.target.value)} /></div>
                {form.vendedor_tipo_persona === "fisica" ? (
                  <div><Label>Cédula (XXX-XXXXXXX-X)</Label><MaskedInput mask="cedula" value={form.vendedor_cedula} onValueChange={(v) => update("vendedor_cedula", v)} placeholder="001-0000000-0" /></div>
                ) : (
                  <div><Label>RNC (X-XX-XXXXX-X)</Label><MaskedInput mask="rnc" value={form.vendedor_rnc} onValueChange={(v) => update("vendedor_rnc", v)} placeholder="1-01-00000-0" /></div>
                )}
                <div><Label>Teléfono</Label><Input value={form.vendedor_telefono} onChange={(e) => update("vendedor_telefono", e.target.value)} /></div>
              </>
            )}

            {/* Step 3: Buyer */}
            {step === 3 && (
              <>
                {miRol === "comprador" ? (
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 text-sm text-accent mb-2">
                    ✅ Tus datos se han pre-llenado como comprador
                  </div>
                ) : (
                  <CedulaCapture
                    label="Cédula del Comprador"
                    onResult={(result, base64) => handleCedulaResult("comprador", result, base64)}
                  />
                )}
                <TipoPersonaToggle value={form.comprador_tipo_persona} onChange={(v) => update("comprador_tipo_persona", v)} />
                <div><Label>Nombre del Comprador</Label><Input value={form.comprador_nombre} onChange={(e) => update("comprador_nombre", e.target.value)} /></div>
                {form.comprador_tipo_persona === "fisica" ? (
                  <div><Label>Cédula (XXX-XXXXXXX-X)</Label><MaskedInput mask="cedula" value={form.comprador_cedula} onValueChange={(v) => update("comprador_cedula", v)} placeholder="001-0000000-0" /></div>
                ) : (
                  <div><Label>RNC (X-XX-XXXXX-X)</Label><MaskedInput mask="rnc" value={form.comprador_rnc} onValueChange={(v) => update("comprador_rnc", v)} placeholder="1-01-00000-0" /></div>
                )}
                <div><Label>Teléfono</Label><Input value={form.comprador_telefono} onChange={(e) => update("comprador_telefono", e.target.value)} /></div>
              </>
            )}

            {/* Step 4: Contract details */}
            {step === 4 && (
              <>
                <div>
                  <Label>Fecha del Acto de Venta</Label>
                  <Input type="date" value={form.fecha_acto_venta} onChange={(e) => update("fecha_acto_venta", e.target.value)} />
                </div>
                {fechaWarning && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800">
                      ⚠️ Han pasado más de 90 días desde el acto de venta. Aplican recargos e intereses según Arts. 26, 27 y 252 del Código Tributario.
                    </p>
                  </div>
                )}
                <div>
                  <Label className="mb-2 block">Medio de Pago</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {MEDIOS_PAGO.map(mp => (
                      <button key={mp} onClick={() => update("medio_pago", mp)}
                        className={`border-2 rounded-lg py-2 px-3 text-sm font-medium transition-all ${
                          form.medio_pago === mp ? "border-accent bg-accent/5 text-accent" : "border-border text-muted-foreground"
                        }`}>
                        {mp}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox checked={form.es_traspaso_familiar} onCheckedChange={(v) => update("es_traspaso_familiar", !!v)} />
                  <Label className="text-sm">¿Traspaso entre familiares directos?</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox checked={form.tiene_apoderado} onCheckedChange={(v) => update("tiene_apoderado", !!v)} />
                  <Label className="text-sm">¿El trámite lo realiza un apoderado?</Label>
                </div>
                {form.tiene_apoderado && (
                  <>
                    <div><Label>Nombre del Apoderado</Label><Input value={form.apoderado_nombre} onChange={(e) => update("apoderado_nombre", e.target.value)} /></div>
                    <div><Label>Cédula del Apoderado</Label><MaskedInput mask="cedula" value={form.apoderado_cedula} onValueChange={(v) => update("apoderado_cedula", v)} placeholder="001-0000000-0" /></div>
                  </>
                )}
              </>
            )}

            {/* Step 5: Documents */}
            {step === 5 && (
              <>
                <p className="text-sm text-muted-foreground">Sube los documentos requeridos para el trámite DGII.</p>
                
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {miRol === "vendedor" ? "Tus documentos (Vendedor)" : "Documentos del Vendedor"}
                </div>
                {!cedulaFiles["cedula_vendedor_frente"] && <FileInput tipo="cedula_vendedor_frente" label="Cédula Vendedor (Frente)" />}
                {cedulaFiles["cedula_vendedor_frente"] && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" /> Cédula del vendedor capturada por cámara
                  </div>
                )}
                <FileInput tipo="cedula_vendedor_reverso" label="Cédula Vendedor (Reverso)" />
                <FileInput tipo="selfie_vendedor" label="Selfie del Vendedor" />

                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">
                  {miRol === "comprador" ? "Tus documentos (Comprador)" : "Documentos del Comprador"}
                </div>
                {!cedulaFiles["cedula_comprador_frente"] && <FileInput tipo="cedula_comprador_frente" label="Cédula Comprador (Frente)" />}
                {cedulaFiles["cedula_comprador_frente"] && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" /> Cédula del comprador capturada por cámara
                  </div>
                )}
                <FileInput tipo="cedula_comprador_reverso" label="Cédula Comprador (Reverso)" />
                <FileInput tipo="selfie_comprador" label="Selfie del Comprador" />

                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Vehículo</div>
                <MarbeteCapture
                  onCapture={(base64) => setCedulaFiles(prev => ({ ...prev, marbete: base64 }))}
                  captured={!!cedulaFiles["marbete"]}
                  onOcrResult={(ocrData) => {
                    if (ocrData.placa && !vehiculo.placa) {
                      setVehiculo(prev => ({ ...prev, placa: ocrData.placa }));
                    }
                  }}
                />
                <FileInput tipo="matricula_foto" label="Foto de la Matrícula" />
                <FileInput tipo="certificacion_plan_piloto" label="Certificación Plan Piloto" />

                {(form.vendedor_tipo_persona === "juridica" || form.comprador_tipo_persona === "juridica") && (
                  <>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Persona Jurídica</div>
                    <FileInput tipo="carta_autorizacion" label="Carta de Autorización de la Empresa" />
                    <FileInput tipo="cedula_representante" label="Cédula del Representante Legal" />
                  </>
                )}

                {form.tiene_apoderado && (
                  <>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Apoderado</div>
                    <FileInput tipo="poder_notarial" label="Poder Notarizado" />
                    <FileInput tipo="cedula_apoderado" label="Cédula del Apoderado" />
                  </>
                )}

                {form.es_traspaso_familiar && (
                  <>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Traspaso Familiar</div>
                    <FileInput tipo="certificacion_bancaria" label="Certificación Bancaria" />
                    <FileInput tipo="carta_trabajo" label="Carta de Trabajo / Declaración Jurada" />
                  </>
                )}

                {parseFloat(form.precio_vehiculo) > 800000 && (
                  <>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Venta &gt; RD$800,000</div>
                    <FileInput tipo="comprobante_pago" label="Comprobante de Pago al Vendedor" />
                  </>
                )}

                <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-sm text-accent">
                  📄 Los contratos se generan automáticamente después de crear el traspaso.
                </div>
              </>
            )}

            {/* Step 6: Plan & Payment */}
            {step === 6 && (
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
                  {form.fecha_acto_venta && <p>Fecha acto: {form.fecha_acto_venta}</p>}
                  {form.medio_pago && <p>Medio de pago: {form.medio_pago}</p>}
                  {form.es_traspaso_familiar && <p>🏠 Traspaso familiar</p>}
                  {form.tiene_apoderado && <p>👤 Apoderado: {form.apoderado_nombre}</p>}
                  {form.pago_seguro && <p>Pago Seguro: RD$ {parseInt(form.precio_vehiculo || "0").toLocaleString()}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox checked={form.acepta_terminos} onCheckedChange={(v) => update("acepta_terminos", !!v)} />
                  <Label className="text-sm">Acepto los términos y condiciones</Label>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              {step < 6 ? (
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
