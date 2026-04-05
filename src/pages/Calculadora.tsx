import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Calculadora = () => {
  const [valor, setValor] = useState("");

  const valorNum = parseFloat(valor.replace(/,/g, "")) || 0;
  const impuesto = valorNum * 0.02;
  const matricula = 100;
  const servicio = 3500;
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
                  <span className="text-sm text-muted-foreground">Servicio TRASPASA.DO (Plan Básico)</span>
                  <span className="font-bold text-foreground">RD${servicio.toLocaleString("es-DO")}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-teal/10 rounded-lg px-4">
                  <span className="font-bold text-foreground">Total estimado</span>
                  <span className="text-xl font-extrabold text-teal">RD${total.toLocaleString("es-DO")}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 text-muted-foreground text-sm mb-10">
            <p>
              <strong className="text-foreground">Nota importante:</strong> El impuesto se calcula sobre el mayor valor entre el precio de venta y la tabla de valores fidedignos de la DGII. Si la DGII determina que el valor fidedigno es mayor al precio de venta declarado, el impuesto se calculará sobre el valor fidedigno.
            </p>
            <p>
              El 2% de impuesto de transferencia se paga directamente a la DGII a través de un banco autorizado. Este monto no está incluido en nuestro servicio.
            </p>
          </div>

          <div className="bg-cta/10 border border-cta/30 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">¿Listo para hacer tu traspaso?</h3>
            <p className="text-muted-foreground mb-4">Nosotros gestionamos todo el proceso.</p>
            <Button variant="cta" size="lg" asChild>
              <Link to="/#solicitud">Iniciar Traspaso →</Link>
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
