import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Eye, PenTool, CheckCircle } from "lucide-react";
import { generateContract, CONTRACT_LABELS, type ContractType, type ContractData } from "@/lib/contract-templates";
import SignaturePad, { type SignatureData } from "./SignaturePad";

interface ContractGeneratorProps {
  traspasoId: string;
  contractData: ContractData;
  contracts: ContractRecord[];
  signatures: SignatureRecord[];
  onRefresh: () => void;
}

export interface ContractRecord {
  id: string;
  tipo: string;
  status: string;
  contenido_html: string;
  pdf_url: string | null;
  created_at: string;
}

export interface SignatureRecord {
  id: string;
  contrato_id: string | null;
  tipo_firmante: string;
  nombre_firmante: string;
  firma_imagen_url: string;
  created_at: string;
}

// Determine which contracts are available based on traspaso data
function getAvailableContracts(data: ContractData): ContractType[] {
  const contracts: ContractType[] = ["contrato_venta"];
  if (data.tiene_apoderado) contracts.push("poder_notarial");
  if (data.vendedor_tipo_persona === "juridica" || data.comprador_tipo_persona === "juridica") {
    contracts.push("carta_autorizacion");
  }
  if (data.es_traspaso_familiar) contracts.push("declaracion_jurada");
  return contracts;
}

export default function ContractGenerator({ traspasoId, contractData, contracts, signatures, onRefresh }: ContractGeneratorProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [signingContract, setSigningContract] = useState<{ id: string; tipo: string } | null>(null);

  const availableContracts = getAvailableContracts(contractData);

  const handleGenerate = async (tipo: ContractType) => {
    setGenerating(tipo);
    try {
      const html = generateContract(tipo, contractData);
      const { error } = await supabase.from("traspaso_contratos").insert({
        traspaso_id: traspasoId,
        tipo,
        contenido_html: html,
        status: "borrador",
      } as any);
      if (error) throw error;
      toast({ title: `${CONTRACT_LABELS[tipo]} generado` });
      onRefresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setGenerating(null);
  };

  const handleSign = async (contractId: string, signatureData: SignatureData) => {
    try {
      // Upload signature image
      const fileName = `firmas/${traspasoId}/${contractId}_${Date.now()}.png`;
      const base64Data = signatureData.imageDataUrl.split(",")[1];
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(fileName, binaryData, { contentType: "image/png" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(fileName);

      // Compute hash of contract HTML
      const contract = contracts.find(c => c.id === contractId);
      const encoder = new TextEncoder();
      const data = encoder.encode(contract?.contenido_html || "");
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

      // Save signature record
      const { error } = await supabase.from("traspaso_firmas").insert({
        traspaso_id: traspasoId,
        contrato_id: contractId,
        tipo_firmante: signingContract?.tipo === "vendedor" ? "vendedor" : "comprador",
        nombre_firmante: signingContract?.tipo === "vendedor" ? contractData.vendedor_nombre : contractData.comprador_nombre,
        cedula_firmante: signingContract?.tipo === "vendedor"
          ? (contractData.vendedor_tipo_persona === "fisica" ? contractData.vendedor_cedula : contractData.vendedor_rnc)
          : (contractData.comprador_tipo_persona === "fisica" ? contractData.comprador_cedula : contractData.comprador_rnc),
        firma_imagen_url: urlData.publicUrl,
        firma_hash: hash,
        ip_address: signatureData.ipAddress,
        user_agent: signatureData.userAgent,
        geolocation: signatureData.geolocation,
        documento_url: null,
      } as any);

      if (error) throw error;

      toast({ title: "Firma registrada exitosamente" });
      setSigningContract(null);
      onRefresh();
    } catch (e: any) {
      toast({ title: "Error al firmar", description: e.message, variant: "destructive" });
    }
  };

  const getContractSignatures = (contractId: string) =>
    signatures.filter(s => s.contrato_id === contractId);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <FileText className="h-4 w-4" /> Documentos y Contratos
      </h3>

      {/* Available contracts to generate */}
      <div className="grid gap-2">
        {availableContracts.map(tipo => {
          const existing = contracts.find(c => c.tipo === tipo);
          const sigs = existing ? getContractSignatures(existing.id) : [];
          const isSigned = sigs.length >= 2;

          return (
            <Card key={tipo} className="border">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{CONTRACT_LABELS[tipo]}</p>
                    {existing && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Badge variant={isSigned ? "default" : "secondary"} className="text-[10px]">
                          {isSigned ? "Firmado" : sigs.length > 0 ? `${sigs.length} firma(s)` : "Borrador"}
                        </Badge>
                        {sigs.map(s => (
                          <Badge key={s.id} variant="outline" className="text-[10px]">
                            {s.tipo_firmante}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!existing ? (
                    <Button size="sm" variant="outline" onClick={() => handleGenerate(tipo)}
                      disabled={generating === tipo}>
                      {generating === tipo ? "Generando..." : "Generar"}
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setPreviewHtml(existing.contenido_html)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!isSigned && (
                        <>
                          <Button size="sm" variant="outline"
                            onClick={() => setSigningContract({ id: existing.id, tipo: "vendedor" })}>
                            <PenTool className="h-3 w-3 mr-1" /> Vendedor
                          </Button>
                          <Button size="sm" variant="outline"
                            onClick={() => setSigningContract({ id: existing.id, tipo: "comprador" })}>
                            <PenTool className="h-3 w-3 mr-1" /> Comprador
                          </Button>
                        </>
                      )}
                      {isSigned && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Contract preview modal */}
      {previewHtml && (
        <Card className="border-accent">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Vista Previa del Documento</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setPreviewHtml(null)}>✕</Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg bg-white p-4 max-h-96 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </CardContent>
        </Card>
      )}

      {/* Signature pad */}
      {signingContract && (
        <SignaturePad
          title={`Firma del ${signingContract.tipo === "vendedor" ? "Vendedor" : "Comprador"}`}
          onSign={(sig) => handleSign(signingContract.id, sig)}
          onCancel={() => setSigningContract(null)}
        />
      )}
    </div>
  );
}
