import { AnimateOnScroll } from "@/components/AnimateOnScroll";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "¿Es legal?", a: "Sí, operamos como gestor privado, completamente legal." },
  { q: "¿Qué pasa si el vehículo tiene problemas?", a: "Nuestro sistema antifraude verifica oposiciones, robos y multas ANTES de iniciar. Si detectamos problemas, te avisamos inmediatamente." },
  { q: "¿Cómo funciona el Pago Seguro?", a: "El dinero del comprador queda en custodia. Solo se libera al vendedor cuando el traspaso está completo y el comprador confirma la entrega del vehículo con un código QR." },
  { q: "¿Necesito ir al Plan Piloto?", a: "El vehículo debe presentarse físicamente. Tú o alguien autorizado lo lleva. Nosotros coordinamos la cita y gestionamos todo lo demás." },
  { q: "¿Qué incluye el precio?", a: "Todo: contrato, notaría, recogida/entrega matrícula con seguro, gestión Plan Piloto y DGII. El impuesto del 2% de DGII se paga aparte." },
  { q: "¿Trabajan con concesionarios?", a: "Sí, planes desde RD$15,000/mes." },
  { q: "¿Qué es el Historial Vehicular?", a: "Un informe completo del vehículo: propietarios anteriores, oposiciones, robos, valor DGII, estado del marbete y multas. Te protege antes de comprar." },
  { q: "¿Puedo unirme como gestor aliado?", a: "Sí, usas nuestra plataforma, pones tu precio al cliente, y nos pagas RD$2,500 por traspaso." },
];

const FAQSection = () => (
  <section id="faq" className="py-16 md:py-24 bg-background">
    <div className="container max-w-3xl">
      <AnimateOnScroll>
        <p className="text-sm font-bold text-teal uppercase tracking-widest mb-2">Preguntas Frecuentes</p>
        <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-8">
          ¿Tienes dudas? Aquí las respondemos
        </h2>
      </AnimateOnScroll>

      <AnimateOnScroll delay={100}>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-xl border border-border px-5">
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </AnimateOnScroll>
    </div>
  </section>
);

export default FAQSection;
