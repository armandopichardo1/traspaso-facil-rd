import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface DocumentUploadProps {
  traspasoId: string;
}

const DOC_TYPES = [
  { value: "cedula_vendedor", label: "Cédula Vendedor" },
  { value: "cedula_comprador", label: "Cédula Comprador" },
  { value: "matricula", label: "Matrícula" },
  { value: "contrato", label: "Contrato" },
  { value: "poder_notarial", label: "Poder Notarial" },
  { value: "otro", label: "Otro" },
];

export default function DocumentUpload({ traspasoId }: DocumentUploadProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: docs } = useQuery({
    queryKey: ["traspaso-docs", traspasoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traspaso_documentos")
        .select("*")
        .eq("traspaso_id", traspasoId)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleUpload = async (tipo: string, file: File) => {
    setUploading(tipo);
    try {
      const ext = file.name.split(".").pop();
      const path = `${traspasoId}/${tipo}_${Date.now()}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from("documentos")
        .upload(path, file);

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage
        .from("documentos")
        .getPublicUrl(path);

      const { error: dbError } = await supabase
        .from("traspaso_documentos")
        .insert({
          traspaso_id: traspasoId,
          tipo,
          file_url: urlData.publicUrl,
        });

      if (dbError) throw dbError;

      toast.success("Documento subido exitosamente");
      queryClient.invalidateQueries({ queryKey: ["traspaso-docs", traspasoId] });
    } catch (err: any) {
      toast.error("Error al subir documento: " + err.message);
    } finally {
      setUploading(null);
    }
  };

  const triggerUpload = (tipo: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf,.doc,.docx";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleUpload(tipo, file);
    };
    input.click();
  };

  const getDocsForType = (tipo: string) =>
    docs?.filter((d) => d.tipo === tipo) || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" /> Documentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {DOC_TYPES.map((dt) => {
          const typeDocs = getDocsForType(dt.value);
          const isUploading = uploading === dt.value;

          return (
            <div key={dt.value} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-medium truncate">{dt.label}</span>
                {typeDocs.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {typeDocs.length}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {typeDocs.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </a>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => triggerUpload(dt.value)}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
