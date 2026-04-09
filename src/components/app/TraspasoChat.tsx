import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TraspasoChatProps {
  traspasoId: string;
}

export default function TraspasoChat({ traspasoId }: TraspasoChatProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["traspaso-mensajes", traspasoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("traspaso_mensajes")
        .select("*")
        .eq("traspaso_id", traspasoId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: open && !!traspasoId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!open) return;
    const channel = supabase
      .channel(`chat-${traspasoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "traspaso_mensajes", filter: `traspaso_id=eq.${traspasoId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["traspaso-mensajes", traspasoId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, traspasoId, queryClient]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!mensaje.trim() || !user) return;
    setSending(true);
    try {
      const { error } = await supabase.from("traspaso_mensajes").insert({
        traspaso_id: traspasoId,
        sender_id: user.id,
        mensaje: mensaje.trim(),
      });
      if (error) throw error;
      setMensaje("");
      queryClient.invalidateQueries({ queryKey: ["traspaso-mensajes", traspasoId] });
    } catch {
      toast.error("Error al enviar mensaje");
    } finally {
      setSending(false);
    }
  };

  const unreadCount = messages.filter(
    (m: any) => !m.leido && m.sender_id !== user?.id
  ).length;

  return (
    <div className="relative">
      {/* Toggle button */}
      <Card
        className="rounded-xl cursor-pointer hover:shadow-md transition-shadow border-accent/20"
        onClick={() => setOpen(!open)}
      >
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center relative">
            <MessageCircle className="h-5 w-5 text-accent" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Chat con tu gestor</p>
            <p className="text-xs text-muted-foreground">
              {messages.length > 0
                ? `${messages.length} mensaje${messages.length !== 1 ? "s" : ""}`
                : "Envía un mensaje directo"}
            </p>
          </div>
          <span className="text-xs text-accent font-semibold">{open ? "Cerrar" : "Abrir"}</span>
        </CardContent>
      </Card>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="mt-2 rounded-xl border-accent/20">
              <CardContent className="p-0">
                {/* Messages area */}
                <div
                  ref={scrollRef}
                  className="h-64 overflow-y-auto p-3 space-y-2"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      No hay mensajes aún. ¡Envía el primero!
                    </div>
                  ) : (
                    messages.map((m: any) => {
                      const isOwn = m.sender_id === user?.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                              isOwn
                                ? "bg-accent text-accent-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            }`}
                          >
                            <p>{m.mensaje}</p>
                            <p className={`text-[10px] mt-0.5 ${isOwn ? "text-accent-foreground/60" : "text-muted-foreground"}`}>
                              {format(new Date(m.created_at), "HH:mm", { locale: es })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <div className="border-t p-2 flex gap-2">
                  <Input
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="rounded-xl text-sm"
                    maxLength={500}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="teal"
                    className="rounded-xl shrink-0"
                    onClick={handleSend}
                    disabled={sending || !mensaje.trim()}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
