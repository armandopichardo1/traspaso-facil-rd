import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Norma0325 = () => (
  <>
    <Navbar />
    <main className="py-16">
      <div className="container max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-6">
          Norma General 03-25: Bloqueo de Marbete por Traspaso Pendiente
        </h1>
        <p className="text-muted-foreground mb-8">
          Todo lo que necesitas saber sobre la nueva regulación de la DGII que afecta a miles de vehículos en República Dominicana.
        </p>

        <div className="space-y-6 text-foreground">
          <h2 className="text-xl font-bold">¿Qué es la Norma 03-25?</h2>
          <p className="text-muted-foreground">
            La Norma General 03-25 de la Dirección General de Impuestos Internos (DGII) establece que, a partir de julio 2025, los vehículos que no tengan el traspaso formal completado ante la DGII no podrán renovar su marbete (placa de circulación).
          </p>

          <h2 className="text-xl font-bold">¿A quién afecta?</h2>
          <p className="text-muted-foreground">
            Afecta a todos los propietarios de vehículos que compraron un vehículo mediante un acuerdo privado pero nunca completaron el traspaso formal ante la DGII. Esto incluye vehículos comprados "por poder notarial" sin registrar el cambio de propiedad.
          </p>

          <h2 className="text-xl font-bold">¿Cuáles son las consecuencias?</h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li><strong>Bloqueo de marbete:</strong> No podrás renovar tu marbete, lo que significa que no podrás circular legalmente.</li>
            <li><strong>Multas de tránsito:</strong> Circular sin marbete vigente conlleva multas y posible retención del vehículo.</li>
            <li><strong>Problemas legales:</strong> El vehículo sigue a nombre del vendedor original, generando responsabilidades legales para ambas partes.</li>
            <li><strong>Dificultad para vender:</strong> No podrás vender el vehículo formalmente sin completar el traspaso primero.</li>
          </ul>

          <h2 className="text-xl font-bold">¿Cuándo entra en vigencia?</h2>
          <p className="text-muted-foreground">
            La norma entra en vigencia a partir de julio 2025. Si tu vehículo no tiene el traspaso formalizado para esa fecha, se bloqueará automáticamente la renovación del marbete.
          </p>

          <h2 className="text-xl font-bold">¿Qué debo hacer?</h2>
          <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
            <li>Verifica si tu vehículo tiene el traspaso formal completado.</li>
            <li>Si no lo tiene, inicia el proceso de traspaso lo antes posible.</li>
            <li>Reúne los documentos necesarios: cédulas, matrícula original, contrato de venta.</li>
            <li>Completa el proceso ante la DGII antes de julio 2025.</li>
          </ol>

          <div className="bg-cta/10 border border-cta/30 rounded-xl p-5 flex gap-3 items-start">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-sm">No esperes al último momento</p>
              <p className="text-sm text-muted-foreground">
                Miles de dominicanos dejarán el proceso para el final, saturando las oficinas de la DGII. Actúa ahora para evitar filas y demoras.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-teal/10 border border-teal/30 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">Regulariza tu traspaso ahora con TRASPASA.DO</h3>
          <p className="text-muted-foreground mb-4">Nosotros hacemos todo el proceso por ti en 24 horas.</p>
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

export default Norma0325;
