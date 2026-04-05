import { AnimateOnScroll } from "@/components/AnimateOnScroll";
import { X, Check } from "lucide-react";

const rows = [
  ["1-3 días", "24 horas"],
  ["4+ instituciones", "Todo desde tu celular"],
  ["Sin verificación del vehículo", "Sistema antifraude + historial"],
  ["Matrícula sin seguro", "Seguro + GPS tracking"],
  ["Gestor sin recibo (RD$5,000+)", "Factura fiscal + garantía (RD$3,500)"],
  ["Pago directo sin protección", "Pago Seguro en custodia"],
  ["Cero visibilidad", "Notificaciones en cada paso"],
];

const ComparisonTable = () => (
  <section className="py-16 md:py-24 bg-background">
    <div className="container max-w-3xl">
      <AnimateOnScroll>
        <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-8 text-center">
          TRASPASA.DO vs. El proceso tradicional
        </h2>
      </AnimateOnScroll>

      <AnimateOnScroll delay={100}>
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="grid grid-cols-2 text-sm font-bold bg-muted">
            <div className="p-4 text-muted-foreground">Hoy</div>
            <div className="p-4 text-teal">Con TRASPASA.DO</div>
          </div>
          {rows.map(([old, nuevo], i) => (
            <div key={i} className={`grid grid-cols-2 text-sm ${i % 2 === 0 ? "" : "bg-muted/30"}`}>
              <div className="p-4 flex items-start gap-2 text-muted-foreground">
                <X className="text-destructive shrink-0 mt-0.5" size={14} />
                {old}
              </div>
              <div className="p-4 flex items-start gap-2 text-foreground font-medium">
                <Check className="text-teal shrink-0 mt-0.5" size={14} />
                {nuevo}
              </div>
            </div>
          ))}
        </div>
      </AnimateOnScroll>
    </div>
  </section>
);

export default ComparisonTable;
