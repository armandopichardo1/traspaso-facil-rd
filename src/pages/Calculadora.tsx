import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

const Calculadora = () => {
  const [valor, setValor] = useState("");
  const [plan, setPlan] = useState("basico");

  const valorNum = parseFloat(valor.replace(/,/g, "")) || 0;
  const impuesto = valorNum * 0.02;
  const matricula = 100;
  const servicio = plan === "express" ? 5000 : 3500;
  const total = impuesto + matricula + servicio;

  return (
    <>
      <Navbar />
      <main className="py-16">
        <div className="container max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-6">
            Calculadora de Impuesto de Transferencia Vehicular (2%)
          </h1>
          <p className="text-muted-foreground mb-8">
            Calcula cuánto pagarás de impuesto y costos totales en tu traspaso vehicular en República Dominicana.
          </p>

          <div className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-sm mb-8">
            <label className="block text-sm font-medium text-foreground mb-2">
              Valor del vehículo (RD$)
            </label>
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value.replace(/[^0-9,]/g, ""))}
              placeholder="Ej: 500,000"
              className="w-full h-14 px-4 rounded-lg border border-input bg-background text-lg font-bold focus:outline-none focus:ring-2 focus:ring-ring mb-6"
            />

            <div className="mb-6">
              <p className="text-sm font-medium text-foreground mb-3">Selecciona tu plan TRASPASA.DO</p>
              <RadioGroup value={plan} onValueChange={setPlan} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Label
                  htmlFor="plan-basico"
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-colors ${plan === "basico" ? "border-accent bg-accent/10" : "border-border"}`}
                >
                  <RadioGroupItem value="basico" id="plan-basico" />
                  <div>
                    <span className="font-bold text-foreground">Plan Básico</span>
                    <span className="block text-sm text-muted-foreground">RD$3,500 · 2-3 días</span>
                  </div>
                </Label>
                <Label
                  htmlFor="plan-express"
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-colors ${plan === "express" ? "border-cta bg-cta/10" : "border-border"}`}
                >
                  <RadioGroupItem value="express" id="plan-express" />
                  <div>
                    <span className="font-bold text-foreground">Plan Express</span>
                    <span className="block text-sm text-muted-foreground">RD$5,000 · 24 horas</span>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            {valorNum > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Impuesto 2% DGII</span>
                  <span className="font-bold text-foreground">RD${impuesto.toLocaleString("es-DO")}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Matrícula nueva</span>
                  <span className="font-bold text-foreground">RD${matricula.toLocaleString("es-DO")}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">
                    Servicio TRASPASA.DO ({plan === "express" ? "Express" : "Básico"})
                  </span>
                  <span className="font-bold text-foreground">RD${servicio.toLocaleString("es-DO")}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-accent/10 rounded-lg px-4">
                  <span className="font-bold text-foreground">Total estimado</span>
                  <span className="text-xl font-extrabold text-accent">RD${total.toLocaleString("es-DO")}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 text-muted-foreground text-sm mb-10">
            <p>
              <strong className="text-foreground">Nota:</strong> El impuesto 2% y la matrícula (RD$100) son pagos al gobierno. El servicio TRASPASA.DO incluye contrato, notaría, recogida de matrícula, gestión DGII y entrega a domicilio.
            </p>
            <p>
              El impuesto se calcula sobre el mayor valor entre el precio de venta y la tabla de valores fidedignos de la DGII.
            </p>
          </div>

          <div className="bg-cta/10 border border-cta/30 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">¿Listo para hacer tu traspaso?</h3>
            <p className="text-muted-foreground mb-4">Nosotros gestionamos todo el proceso por ti.</p>
            <Button variant="cta" size="lg" asChild>
              <Link to="/#solicitud">Iniciar mi traspaso →</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
};

export default Calculadora;
