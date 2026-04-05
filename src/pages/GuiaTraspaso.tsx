import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const GuiaTraspaso = () => (
  <>
    <Navbar />
    <main className="py-16">
      <div className="container max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-6">
          Cómo hacer un traspaso vehicular en República Dominicana — Guía 2026
        </h1>
        <p className="text-muted-foreground mb-8">
          Guía completa paso a paso del proceso actual de traspaso vehicular en RD, incluyendo requisitos, costos y oficinas.
        </p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <h2 className="text-xl font-bold">¿Qué es un traspaso vehicular?</h2>
          <p className="text-muted-foreground">
            Un traspaso vehicular es el proceso legal mediante el cual se transfiere la propiedad de un vehículo de una persona a otra ante la Dirección General de Impuestos Internos (DGII) de República Dominicana.
          </p>

          <h2 className="text-xl font-bold">Requisitos</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Cédula de identidad del comprador y vendedor (originales y copias)</li>
            <li>Matrícula original del vehículo</li>
            <li>Contrato de venta notarizado</li>
            <li>Certificado de no oposición de la Procuraduría General</li>
            <li>Inspección en Plan Piloto</li>
            <li>Pago del impuesto de transferencia del 2%</li>
          </ul>

          <h2 className="text-xl font-bold">Los 6 pasos del proceso actual</h2>

          <h3 className="text-lg font-semibold">Paso 1: Contrato de venta</h3>
          <p className="text-muted-foreground">Redactar y firmar el contrato de compra-venta ante un notario público. Costo: RD$1,500-3,000 dependiendo del notario.</p>

          <h3 className="text-lg font-semibold">Paso 2: Certificado de no oposición</h3>
          <p className="text-muted-foreground">Solicitar en la Procuraduría General de la República que el vehículo no tiene oposiciones, embargos ni reportes de robo. Tiempo: 1-3 días.</p>

          <h3 className="text-lg font-semibold">Paso 3: Inspección en Plan Piloto</h3>
          <p className="text-muted-foreground">Llevar el vehículo a un centro de inspección autorizado (Plan Piloto) para verificación de chasis y motor. Debes llevar el vehículo físicamente.</p>

          <h3 className="text-lg font-semibold">Paso 4: Pago del impuesto 2%</h3>
          <p className="text-muted-foreground">Pagar el 2% del valor del vehículo según la tabla de valores fidedignos de la DGII en un banco autorizado.</p>

          <h3 className="text-lg font-semibold">Paso 5: Entrega de expediente en DGII</h3>
          <p className="text-muted-foreground">Entregar todos los documentos en la administración local de la DGII. Incluye contrato, certificado, recibo de pago y formulario.</p>

          <h3 className="text-lg font-semibold">Paso 6: Recogida de nueva matrícula</h3>
          <p className="text-muted-foreground">Esperar la emisión de la nueva matrícula a nombre del comprador. Tiempo: 5-15 días hábiles.</p>

          <h2 className="text-xl font-bold">Costos aproximados</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>Notaría: RD$1,500-3,000</li>
            <li>Certificado PGR: RD$200-500</li>
            <li>Inspección Plan Piloto: RD$500</li>
            <li>Impuesto 2% DGII: Variable según valor del vehículo</li>
            <li>Matrícula nueva: RD$100</li>
            <li>Gestor (opcional): RD$3,000-8,000</li>
          </ul>

          <h2 className="text-xl font-bold">Oficinas de la DGII</h2>
          <p className="text-muted-foreground">
            La DGII tiene administraciones locales en todo el país. Las principales están en Santo Domingo (sede central en la Av. México), Santiago, La Romana, San Pedro de Macorís y Puerto Plata.
          </p>
        </div>

        <div className="mt-12 bg-teal/10 border border-teal/30 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">¿Quieres evitar todo esto?</h3>
          <p className="text-muted-foreground mb-4">TRASPASA.DO lo hace por ti en 24 horas.</p>
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

export default GuiaTraspaso;
