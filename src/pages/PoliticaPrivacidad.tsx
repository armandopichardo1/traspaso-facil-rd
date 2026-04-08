import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PoliticaPrivacidad = () => (
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

      <h1 className="text-3xl font-extrabold text-foreground mb-2">Política de Privacidad</h1>
      <p className="text-sm text-muted-foreground mb-8">Última actualización: 8 de abril de 2026</p>

      <div className="prose prose-sm max-w-none text-foreground/80 space-y-6">
        <section>
          <h2 className="text-xl font-bold text-foreground">1. Responsable del Tratamiento</h2>
          <p>TRASPASA.DO S.R.L., con RNC 1-32-XXXXX-X, domiciliada en Santo Domingo, República Dominicana, es responsable del tratamiento de sus datos personales conforme a la Ley 172-13 sobre Protección de Datos Personales.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">2. Datos que Recopilamos</h2>
          <p>Recopilamos los siguientes tipos de datos:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Datos de identidad:</strong> nombre completo, cédula de identidad, RNC (personas jurídicas)</li>
            <li><strong>Datos de contacto:</strong> teléfono, correo electrónico, dirección</li>
            <li><strong>Datos vehiculares:</strong> placa, chasis, marca, modelo, año, color</li>
            <li><strong>Datos de transacción:</strong> precios, métodos de pago, historial de traspasos</li>
            <li><strong>Datos de firma digital:</strong> imagen de firma, geolocalización al firmar, dirección IP, user agent</li>
            <li><strong>Datos de uso:</strong> navegación en la plataforma, dispositivo, ubicación aproximada</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">3. Finalidad del Tratamiento</h2>
          <p>Utilizamos sus datos para:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Gestionar y procesar traspasos vehiculares ante la DGII</li>
            <li>Generar informes de historial vehicular</li>
            <li>Verificar identidades y prevenir fraude</li>
            <li>Generar contratos de compraventa con validez legal (Ley 126-02)</li>
            <li>Coordinar servicios de mensajería y GPS tracking</li>
            <li>Administrar el sistema de Pago Seguro</li>
            <li>Comunicarnos con usted sobre el estado de sus trámites</li>
            <li>Mejorar nuestros servicios y experiencia de usuario</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">4. Base Legal</h2>
          <p>El tratamiento de sus datos se fundamenta en:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Su consentimiento al registrarse y utilizar la plataforma</li>
            <li>La ejecución del contrato de servicios</li>
            <li>Obligaciones legales ante la DGII y otras entidades gubernamentales</li>
            <li>Interés legítimo en la prevención de fraude</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">5. Compartición de Datos</h2>
          <p>Podemos compartir sus datos con:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>DGII:</strong> para el procesamiento oficial del traspaso</li>
            <li><strong>Notarios certificados:</strong> para la legalización de contratos</li>
            <li><strong>Mensajeros autorizados:</strong> datos de contacto para coordinación de recogida/entrega</li>
            <li><strong>La contraparte del traspaso:</strong> comprador o vendedor según corresponda</li>
            <li><strong>Proveedores de servicios:</strong> procesamiento de pagos, almacenamiento en la nube</li>
          </ul>
          <p>No vendemos ni alquilamos sus datos personales a terceros con fines de marketing.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">6. Seguridad de los Datos</h2>
          <p>Implementamos medidas técnicas y organizativas para proteger sus datos, incluyendo:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Encriptación de datos en tránsito y en reposo</li>
            <li>Control de acceso basado en roles</li>
            <li>Auditoría de accesos a información sensible</li>
            <li>Hash criptográfico de firmas digitales</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">7. Retención de Datos</h2>
          <p>Conservamos sus datos personales durante el tiempo necesario para cumplir con las finalidades descritas y conforme a los plazos legales establecidos. Los registros de traspasos se conservan por un mínimo de 10 años conforme a la legislación tributaria dominicana.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">8. Sus Derechos</h2>
          <p>Conforme a la Ley 172-13, usted tiene derecho a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Acceso:</strong> solicitar una copia de sus datos personales</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos</li>
            <li><strong>Supresión:</strong> solicitar la eliminación de sus datos cuando ya no sean necesarios</li>
            <li><strong>Oposición:</strong> oponerse al tratamiento en ciertos casos</li>
          </ul>
          <p>Para ejercer estos derechos, contacte a privacidad@traspasa.do con una copia de su cédula de identidad.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">9. Cookies y Tecnologías Similares</h2>
          <p>Utilizamos cookies esenciales para el funcionamiento de la plataforma y cookies analíticas para mejorar nuestros servicios. Puede configurar su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad de la plataforma.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">10. Cambios a esta Política</h2>
          <p>Nos reservamos el derecho de modificar esta política. Notificaremos cambios significativos por correo electrónico o mediante aviso en la plataforma.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground">11. Contacto</h2>
          <p>Para consultas sobre privacidad:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Email: privacidad@traspasa.do</li>
            <li>WhatsApp: +1 (809) XXX-XXXX</li>
          </ul>
        </section>
      </div>
    </main>
  </div>
);

export default PoliticaPrivacidad;
