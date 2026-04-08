import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const TerminosServicio = () => (
  <div className="min-h-screen bg-background">
    <nav className="bg-primary text-primary-foreground py-4">
      <div className="container max-w-4xl flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold">
          <div className="w-7 h-7 rounded-md bg-primary-foreground/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-accent" />
          </div>
          <span>TRASPASA<span className="text-teal">.DO</span></span>
        </Link>
      </div>
    </nav>

    <main className="container max-w-4xl py-12">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={16} /> Volver al inicio
      </Link>

      <h1 className="text-3xl font-extrabold text-foreground mb-2">Términos de Servicio</h1>
      <p className="text-sm text-muted-foreground mb-8">Última actualización: 8 de abril de 2026</p>

      <div className="prose prose-sm max-w-none text-foreground/80 space-y-6">
        <section>
          <h2 className="text-xl font-bold text-foreground">1. Aceptación de los Términos</h2>
          <p>Al acceder y utilizar la plataforma TRASPASA.DO (en adelante "la Plataforma"), operada por TRASPASA.DO S.R.L., con domicilio en Santo Domingo, República Dominicana, usted acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo con alguno de estos términos, no debe utilizar la Plataforma.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">2. Descripción del Servicio</h2>
          <p>TRASPASA.DO es una plataforma digital que facilita:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Consultas de historial vehicular mediante bases de datos oficiales</li>
            <li>Gestión digital de traspasos vehiculares ante la DGII</li>
            <li>Servicio de mensajería para recogida y entrega de documentos</li>
            <li>Sistema de pago seguro (escrow) para transacciones vehiculares</li>
            <li>Generación y firma digital de contratos de compraventa</li>
          </ul>
          <p>TRASPASA.DO actúa como intermediario facilitador. No somos concesionario, notaría, ni entidad financiera.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">3. Registro y Cuenta</h2>
          <p>Para utilizar ciertos servicios, debe crear una cuenta proporcionando información veraz y completa, incluyendo nombre, cédula de identidad, teléfono y correo electrónico. Usted es responsable de mantener la confidencialidad de sus credenciales de acceso.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">4. Precios y Pagos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Consulta de historial vehicular: RD$350 por consulta</li>
            <li>Plan Básico de traspaso: RD$3,500</li>
            <li>Plan Express de traspaso: RD$5,000</li>
          </ul>
          <p>Los precios incluyen ITBIS. El impuesto de traspaso del 2% ante la DGII es responsabilidad del comprador y se cobra por separado. TRASPASA.DO se reserva el derecho de modificar los precios previo aviso.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">5. Pago Seguro (Escrow)</h2>
          <p>El servicio de Pago Seguro retiene los fondos del comprador hasta que el traspaso sea completado satisfactoriamente. Los fondos se liberan al vendedor una vez el comprador confirme la recepción del vehículo y la nueva matrícula. En caso de disputa, TRASPASA.DO mediará conforme a la legislación dominicana vigente.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">6. Sistema Antifraude</h2>
          <p>TRASPASA.DO implementa verificaciones de identidad y cruces con bases de datos de la DGII para detectar oposiciones, gravámenes o alertas. Sin embargo, no garantizamos la detección de todas las situaciones irregulares. El usuario es responsable de realizar sus propias diligencias.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">7. Responsabilidad del Servicio de Mensajería</h2>
          <p>Nuestro servicio de mensajería incluye seguro de documentos con cobertura de hasta RD$50,000. El servicio cuenta con GPS tracking en tiempo real. TRASPASA.DO no se responsabiliza por daños causados por fuerza mayor o eventos fuera de nuestro control.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">8. Cancelaciones y Reembolsos</h2>
          <p>Las consultas de historial vehicular no son reembolsables una vez generado el informe. Para traspasos, se puede solicitar cancelación antes del inicio de la gestión ante la DGII, con un cargo administrativo del 20% del valor del servicio.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">9. Limitación de Responsabilidad</h2>
          <p>TRASPASA.DO no será responsable por retrasos causados por instituciones gubernamentales (DGII, Plan Piloto, PGR), errores en la información proporcionada por el usuario, ni por el estado mecánico o legal del vehículo más allá de lo reportado en el historial vehicular.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">10. Ley Aplicable y Jurisdicción</h2>
          <p>Estos términos se rigen por las leyes de la República Dominicana. Cualquier controversia será sometida a los tribunales competentes de Santo Domingo, Distrito Nacional, República Dominicana.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">11. Contacto</h2>
          <p>Para consultas sobre estos términos, puede contactarnos a través de:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>WhatsApp: +1 (809) XXX-XXXX</li>
            <li>Email: legal@traspasa.do</li>
          </ul>
        </section>
      </div>
    </main>
  </div>
);

export default TerminosServicio;
