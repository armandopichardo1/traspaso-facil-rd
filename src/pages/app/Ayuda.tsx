import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Mail, FileText, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "¿Cuánto tarda un traspaso?",
    a: "Un traspaso básico toma entre 5-10 días hábiles. El plan Express puede completarse en 3-5 días y el Premium en 2-3 días.",
  },
  {
    q: "¿Qué documentos necesito?",
    a: "Necesitas la matrícula del vehículo, cédula del vendedor y comprador, y el acto de venta notarizado.",
  },
  {
    q: "¿Cómo verifico el estado de mi traspaso?",
    a: "Puedes ver el progreso en tiempo real desde la sección 'Inicio' de la app, o usar tu código de seguimiento en nuestra página pública.",
  },
  {
    q: "¿Qué pasa si hay oposiciones en el vehículo?",
    a: "Nuestro equipo te notificará inmediatamente si se detectan oposiciones durante la verificación antifraude. El proceso se pausará hasta resolver la situación.",
  },
  {
    q: "¿Puedo cancelar un traspaso en proceso?",
    a: "Sí, puedes solicitar la cancelación contactando a nuestro equipo de soporte. Aplican condiciones según la etapa del proceso.",
  },
];

export default function Ayuda() {
  const whatsappUrl = "https://wa.me/18097052127?text=Hola%2C%20necesito%20ayuda%20con%20mi%20traspaso";

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-xl font-bold">Centro de Ayuda</h1>

      {/* Contact options */}
      <div className="grid grid-cols-1 gap-3">
        <Card>
          <CardContent className="p-4">
            <Button
              variant="cta"
              className="w-full gap-2"
              onClick={() => window.open(whatsappUrl, "_blank")}
            >
              <MessageCircle className="h-5 w-5" />
              Chatear por WhatsApp
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Respuesta en menos de 30 minutos · Lun-Sáb 8am-6pm
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <a href="tel:+18097052127" className="text-sm font-medium text-primary">
                809-705-2127
              </a>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <a href="mailto:soporte@traspasa.do" className="text-sm font-medium text-primary">
                soporte@traspasa.do
              </a>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Preguntas Frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Guides */}
      <Card>
        <CardContent className="p-4">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => window.open("/guia-traspaso", "_blank")}
          >
            <FileText className="h-4 w-4" />
            Ver Guía Completa de Traspaso
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
