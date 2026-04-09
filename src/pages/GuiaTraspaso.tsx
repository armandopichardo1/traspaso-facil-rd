import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, AlertTriangle, Calculator, Clock, Shield, HelpCircle, ArrowRight } from "lucide-react";

const FloatingCTA = () => (
  <div className="hidden lg:block sticky top-24">
    <div className="bg-gradient-to-br from-[hsl(var(--navy))] to-[hsl(var(--accent))] rounded-2xl p-6 text-white shadow-lg">
      <Shield className="h-8 w-8 mb-3 text-white/80" />
      <h3 className="font-bold text-lg mb-2">TRASPASA.DO gestiona todo esto por ti</h3>
      <p className="text-sm text-white/80 mb-4">
        Desde RD$3,500. Contrato, notaría, Plan Piloto, DGII y entrega a domicilio.
      </p>
      <Button variant="cta" size="lg" className="w-full" asChild>
        <Link to="/#solicitud">Iniciar Traspaso →</Link>
      </Button>
      <p className="text-xs text-white/60 mt-3 text-center">Sin filas. Sin estrés. 2-3 días.</p>
    </div>
  </div>
);

const GuiaTraspaso = () => (
  <>
    <Navbar />
    <main className="py-12 md:py-16">
      <div className="container max-w-6xl">
        {/* Hero */}
        <div className="max-w-3xl mb-10">
          <p className="text-sm font-bold text-accent uppercase tracking-widest mb-2">Guía Completa 2026</p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4 leading-tight">
            Cómo hacer un traspaso vehicular en República Dominicana
          </h1>
          <p className="text-lg text-muted-foreground">
            Todo lo que necesitas saber sobre el proceso de transferencia de vehículos ante la DGII: requisitos, costos, pasos, plazos, riesgos de no hacerlo y cómo evitar el doble traspaso. Actualizado con la Norma 03-25.
          </p>
        </div>

        {/* Mobile CTA banner */}
        <div className="lg:hidden bg-gradient-to-r from-[hsl(var(--navy))] to-[hsl(var(--accent))] rounded-2xl p-5 mb-10 text-white">
          <p className="font-bold mb-1">¿No quieres hacer todo esto tú mismo?</p>
          <p className="text-sm text-white/80 mb-3">TRASPASA.DO gestiona todo desde RD$3,500.</p>
          <Button variant="cta" size="sm" asChild>
            <Link to="/#solicitud">Iniciar Traspaso →</Link>
          </Button>
        </div>

        <div className="flex gap-10">
          {/* Main content */}
          <article className="flex-1 min-w-0 space-y-10">

            {/* Table of contents */}
            <nav className="bg-muted/50 rounded-2xl p-6 border border-border">
              <p className="font-bold text-foreground mb-3">En esta guía:</p>
              <ol className="space-y-2 text-sm">
                {[
                  { label: "¿Qué es un traspaso vehicular?", id: "que-es" },
                  { label: "Requisitos y documentos necesarios", id: "requisitos" },
                  { label: "Paso a paso del proceso tradicional", id: "pasos" },
                  { label: "¿Cuánto cuesta un traspaso?", id: "costos" },
                  { label: "¿Qué pasa si no hago el traspaso?", id: "riesgos" },
                  { label: "¿Qué es un doble traspaso?", id: "doble-traspaso" },
                  { label: "Preguntas frecuentes", id: "faq" },
                ].map((item, i) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="text-accent hover:underline">
                      {i + 1}. {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {/* Section 1 */}
            <section id="que-es">
              <h2 className="text-2xl font-extrabold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-6 w-6 text-accent shrink-0" />
                ¿Qué es un traspaso vehicular?
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Un <strong className="text-foreground">traspaso vehicular</strong> es el procedimiento legal mediante el cual se transfiere la propiedad de un vehículo de motor de una persona (física o jurídica) a otra ante la <strong className="text-foreground">Dirección General de Impuestos Internos (DGII)</strong> de República Dominicana.
                </p>
                <p>
                  Este proceso es obligatorio cada vez que un vehículo cambia de dueño, ya sea por compraventa, donación, herencia o cualquier otro acto de transferencia. Al completarlo, la DGII emite una nueva <strong className="text-foreground">matrícula (placa)</strong> a nombre del nuevo propietario, lo que constituye la prueba legal de propiedad del vehículo.
                </p>
                <p>
                  Sin el traspaso formal, el vehículo sigue legalmente registrado a nombre del vendedor anterior, lo que genera una serie de problemas legales, fiscales y de seguro que explicaremos más adelante en esta guía.
                </p>
                <p>
                  El traspaso se rige principalmente por la <strong className="text-foreground">Ley 241</strong> sobre Tránsito de Vehículos, la <strong className="text-foreground">Ley 11-92</strong> (Código Tributario) y más recientemente la <strong className="text-foreground">Norma General 03-25</strong> de la DGII, que introdujo cambios significativos al proceso a partir de 2025.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="requisitos">
              <h2 className="text-2xl font-extrabold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6 text-accent shrink-0" />
                Requisitos para hacer un traspaso vehicular
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Los documentos y requisitos necesarios para completar un traspaso vehicular en República Dominicana son los siguientes, actualizados conforme a la <strong className="text-foreground">Norma General 03-25</strong>:
                </p>

                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4">Documentos obligatorios</h3>
                  <ul className="space-y-3">
                    {[
                      { title: "Contrato de compraventa notariado", desc: "Debe ser legalizado por un notario público con jurisdicción en el lugar de la transacción. El contrato debe incluir la descripción completa del vehículo, precio de venta, datos de ambas partes y sus firmas. Costo aproximado: RD$1,500-3,000." },
                      { title: "Matrícula original del vehículo", desc: "El documento físico original emitido por la DGII a nombre del propietario actual (vendedor). No se aceptan copias. Si la matrícula está extraviada, se debe solicitar un duplicado antes de iniciar el traspaso." },
                      { title: "Certificación de Plan Piloto", desc: "Inspección física del vehículo en un centro autorizado de Plan Piloto donde se verifica el número de chasis, motor, color y condiciones generales. Costo: RD$500. El vehículo debe presentarse personalmente." },
                      { title: "Cédulas de identidad y electoral", desc: "Originales y copias de las cédulas del comprador y vendedor. Para personas jurídicas (empresas): RNC, acta de asamblea autorizando la venta, registro mercantil vigente y cédula del representante legal." },
                      { title: "Constancia de pago del impuesto 2%", desc: "Recibo de pago del impuesto de transferencia del 2% sobre el valor del vehículo, pagado en un banco autorizado (Banreservas, BHD, Popular). El monto se calcula sobre el mayor valor entre el precio de venta declarado y la tabla de valores fidedignos de la DGII." },
                      { title: "Certificado de no oposición (PGR)", desc: "Documento emitido por la Procuraduría General de la República confirmando que el vehículo no tiene oposiciones, embargos, ni reportes de robo vigentes. Tiempo de emisión: 1-3 días hábiles." },
                      { title: "Formulario de solicitud DGII", desc: "Formulario oficial de la DGII para solicitud de traspaso, debidamente completado y firmado por ambas partes." },
                    ].map((doc) => (
                      <li key={doc.title} className="flex gap-3">
                        <span className="text-accent mt-1 shrink-0">✓</span>
                        <div>
                          <p className="font-semibold text-foreground">{doc.title}</p>
                          <p className="text-sm">{doc.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-cta/10 border border-cta/20 rounded-xl p-4">
                  <p className="text-sm">
                    <strong className="text-foreground">⚠️ Importante (Norma 03-25):</strong> A partir de 2025, la DGII exige que todos los documentos estén completos al momento de la solicitud. Expedientes incompletos son rechazados sin excepción, lo que significa perder el turno y volver a empezar.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="pasos">
              <h2 className="text-2xl font-extrabold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-6 w-6 text-accent shrink-0" />
                Paso a paso del proceso tradicional
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Si decides hacer el traspaso por tu cuenta (sin un gestor ni TRASPASA.DO), este es el proceso completo que tendrás que seguir. Prepárate para invertir entre <strong className="text-foreground">3-5 días hábiles</strong> mínimo y visitar múltiples instituciones.
                </p>

                {[
                  {
                    step: 1,
                    title: "Redacción y notarización del contrato de venta",
                    time: "½ día",
                    pain: "Encontrar un notario disponible, coordinar horarios de ambas partes",
                    desc: "Ambas partes (comprador y vendedor) deben acudir juntas a una notaría pública. El notario redacta el contrato de compraventa, verifica las identidades y legaliza el documento. El costo varía entre RD$1,500 y RD$3,000 dependiendo del notario y la zona. Algunos notarios cobran un porcentaje del valor del vehículo en lugar de una tarifa fija.",
                  },
                  {
                    step: 2,
                    title: "Solicitud de certificado de no oposición en la PGR",
                    time: "1-3 días",
                    pain: "Filas largas, horario limitado, hay que volver a recogerlo",
                    desc: "Debes ir personalmente a la Procuraduría General de la República (PGR) con la matrícula original y una copia de tu cédula. La PGR verifica que el vehículo no tenga embargos, oposiciones judiciales ni reportes de robo. Este certificado tarda entre 1 y 3 días hábiles. Debes ir nuevamente a recogerlo.",
                  },
                  {
                    step: 3,
                    title: "Inspección en Plan Piloto",
                    time: "½ día",
                    pain: "Hay que llevar el vehículo físicamente, filas de 2-4 horas",
                    desc: "El vehículo debe ser llevado personalmente a un centro de inspección autorizado de Plan Piloto. Allí verifican el número de chasis, número de motor, color y condición general del vehículo. La inspección cuesta alrededor de RD$500. Las filas suelen ser de 2 a 4 horas, especialmente en Santo Domingo. El certificado se emite en el momento.",
                  },
                  {
                    step: 4,
                    title: "Pago del impuesto de transferencia (2%) en banco",
                    time: "1-2 horas",
                    pain: "Cálculo puede ser mayor al precio de venta si la DGII tiene un valor fidedigno más alto",
                    desc: "Debes dirigirte a un banco autorizado (Banreservas, BHD León o Banco Popular) para pagar el 2% del valor del vehículo. Importante: la DGII tiene una tabla de 'valores fidedignos' para cada marca, modelo y año. Si el valor fidedigno es mayor al precio de venta declarado en el contrato, el impuesto se calcula sobre el valor fidedigno. Por ejemplo, si compraste un vehículo en RD$300,000 pero la tabla DGII dice que vale RD$500,000, pagarás 2% de RD$500,000 = RD$10,000.",
                  },
                  {
                    step: 5,
                    title: "Entrega de expediente completo en la DGII",
                    time: "½ día - 1 día",
                    pain: "Fila de 3-6 horas, cualquier documento faltante = rechazado",
                    desc: "Con todos los documentos en mano, debes ir a la administración local de la DGII correspondiente. Entregas el expediente completo: contrato notariado, matrícula original, certificado PGR, certificación Plan Piloto, recibo de pago del 2%, cédulas y formulario. La fila en la DGII es notoriamente larga, con esperas de 3 a 6 horas. Si falta cualquier documento o hay un error, el expediente es rechazado y debes volver otro día.",
                  },
                  {
                    step: 6,
                    title: "Recogida de la nueva matrícula",
                    time: "5-15 días hábiles",
                    pain: "Sin fecha exacta, tienes que llamar o ir a verificar",
                    desc: "Una vez aceptado el expediente, la DGII procesa la transferencia y emite una nueva matrícula a nombre del comprador. Este proceso toma entre 5 y 15 días hábiles, aunque puede tardar más en períodos de alta demanda. No hay un sistema de notificación; debes llamar o ir personalmente a verificar si la matrícula está lista.",
                  },
                ].map((step) => (
                  <div key={step.step} className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex items-center justify-center h-8 w-8 rounded-full bg-accent/10 text-accent font-bold text-sm shrink-0">
                        {step.step}
                      </span>
                      <h3 className="font-bold text-foreground">{step.title}</h3>
                    </div>
                    <p className="mb-3">{step.desc}</p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="bg-muted rounded-full px-3 py-1 text-muted-foreground">⏱ {step.time}</span>
                      <span className="bg-destructive/10 text-destructive rounded-full px-3 py-1">😩 {step.pain}</span>
                    </div>
                  </div>
                ))}

                <div className="bg-accent/10 border border-accent/20 rounded-xl p-5 text-center">
                  <p className="text-foreground font-bold mb-1">¿Tiempo total estimado? 5-20 días hábiles.</p>
                  <p className="text-sm">Y eso si todo sale bien a la primera. Cualquier error en un documento y empiezas de nuevo.</p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="costos">
              <h2 className="text-2xl font-extrabold text-foreground mb-4 flex items-center gap-2">
                <Calculator className="h-6 w-6 text-accent shrink-0" />
                ¿Cuánto cuesta un traspaso vehicular?
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  El costo total de un traspaso vehicular depende del valor del vehículo y de si contratas a un gestor o lo haces tú mismo. Estos son los costos desglosados:
                </p>

                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-4 font-bold text-foreground">Concepto</th>
                        <th className="text-right p-4 font-bold text-foreground">Costo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Impuesto 2% DGII", "2% del valor del vehículo"],
                        ["Matrícula nueva", "RD$100"],
                        ["Notaría (contrato)", "RD$1,500 - 3,000"],
                        ["Certificado PGR", "RD$200 - 500"],
                        ["Inspección Plan Piloto", "RD$500"],
                        ["Gestor tradicional (opcional)", "RD$3,000 - 8,000"],
                        ["Transporte / gasolina / parking", "RD$500 - 2,000"],
                      ].map(([concepto, costo]) => (
                        <tr key={concepto} className="border-t border-border">
                          <td className="p-4 text-muted-foreground">{concepto}</td>
                          <td className="p-4 text-right font-semibold text-foreground">{costo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p>
                  <strong className="text-foreground">Ejemplo concreto:</strong> Para un vehículo valorado en RD$500,000, el impuesto 2% sería RD$10,000. Sumando matrícula, notaría, PGR, Plan Piloto y un gestor promedio, el costo total ronda los <strong className="text-foreground">RD$15,000 - 22,000</strong>.
                </p>

                <div className="bg-accent/10 border border-accent/20 rounded-xl p-5">
                  <p className="text-foreground font-bold mb-1">Con TRASPASA.DO: desde RD$3,500 + impuestos del gobierno</p>
                  <p className="text-sm">Nuestro servicio incluye contrato, notaría, recogida de matrícula, gestión completa en DGII y entrega a domicilio. Solo pagas aparte el impuesto 2% y la matrícula (RD$100), que son pagos directos al gobierno.</p>
                  <Button variant="teal" size="sm" className="mt-3" asChild>
                    <Link to="/calculadora">Calcular mi costo total →</Link>
                  </Button>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="riesgos">
              <h2 className="text-2xl font-extrabold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-cta shrink-0" />
                ¿Qué pasa si no hago el traspaso?
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Muchos compradores en República Dominicana postergan o evitan el traspaso por los costos y la complejidad del proceso. Sin embargo, <strong className="text-foreground">no hacer el traspaso tiene consecuencias graves</strong> que la mayoría desconoce hasta que es demasiado tarde.
                </p>

                <div className="space-y-4">
                  {[
                    {
                      title: "🚫 Bloqueo de marbete (Norma 03-25)",
                      desc: "La Norma General 03-25 de la DGII, vigente desde 2025, establece que los vehículos que no estén registrados a nombre del poseedor actual no podrán renovar su marbete (sticker de circulación). Sin marbete vigente, la DIGESETT puede retener el vehículo en cualquier retén. Esto afecta a miles de vehículos que circulan con 'matrícula ajena'.",
                    },
                    {
                      title: "⚖️ Responsabilidad legal del vendedor",
                      desc: "Si el vehículo sigue a tu nombre (como vendedor) y el comprador comete una infracción, un accidente o el vehículo es usado en un delito, tú serás el primer responsable legalmente. Se han dado casos de vendedores demandados por accidentes de tránsito en vehículos que vendieron hace años pero nunca traspasaron.",
                    },
                    {
                      title: "🏥 Problemas con el seguro",
                      desc: "Las aseguradoras pueden negar reclamaciones si el vehículo no está registrado a nombre de quien tenía la póliza al momento del siniestro. Si compraste un vehículo sin traspasarlo y tienes un accidente, el seguro puede rechazar la cobertura argumentando que no eres el propietario legal.",
                    },
                    {
                      title: "💸 Multas acumuladas a nombre del vendedor",
                      desc: "Las multas de tránsito se emiten a nombre del propietario registrado en la DGII. Si vendiste tu vehículo sin traspasarlo, todas las multas del nuevo poseedor aparecerán en tu nombre y afectarán tu récord fiscal.",
                    },
                    {
                      title: "📉 Pérdida de valor en reventa",
                      desc: "Un vehículo sin traspaso al día pierde valor significativamente en el mercado. Los compradores informados exigen descuento o se niegan a comprar un vehículo con historial de traspasos pendientes, porque implica un 'doble traspaso' con costos adicionales.",
                    },
                  ].map((risk) => (
                    <div key={risk.title} className="bg-card rounded-xl border border-border p-5">
                      <h3 className="font-bold text-foreground mb-2">{risk.title}</h3>
                      <p className="text-sm">{risk.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section id="doble-traspaso">
              <h2 className="text-2xl font-extrabold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-cta shrink-0" />
                ¿Qué es un doble traspaso?
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Un <strong className="text-foreground">doble traspaso</strong> ocurre cuando un vehículo necesita ser transferido a través de dos propietarios intermedios para llegar al comprador final. Esto sucede comúnmente cuando:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Compraste un vehículo hace años y nunca hiciste el traspaso a tu nombre. Ahora quieres venderlo, pero la matrícula sigue a nombre del propietario original.</li>
                  <li>El vehículo ha pasado por 2 o más manos sin traspasos formales (muy común en el mercado de usados en RD).</li>
                  <li>Hay una cadena de "contratos de poder" sin traspaso legal ante la DGII.</li>
                </ul>

                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-5">
                  <h3 className="font-bold text-foreground mb-2">💰 El costo del doble traspaso: 4% en lugar de 2%</h3>
                  <p className="text-sm">
                    Cada transferencia ante la DGII paga el 2% de impuesto. Si necesitas hacer dos transferencias (del propietario original a ti, y luego de ti al comprador final), pagarás <strong className="text-foreground">4% del valor del vehículo</strong> en impuestos. Para un vehículo de RD$500,000, eso significa RD$20,000 en lugar de RD$10,000.
                  </p>
                </div>

                <p>
                  <strong className="text-foreground">¿Cómo evitarlo?</strong> La única forma de evitar un doble traspaso es hacer el traspaso a tu nombre inmediatamente después de comprar el vehículo. Si ya estás en esta situación, lo mejor es resolverlo lo antes posible, ya que cada venta adicional sin traspaso agrega otro 2%.
                </p>

                <p>
                  En TRASPASA.DO manejamos doble traspasos regularmente. Si tu vehículo necesita un doble traspaso, contáctanos y te daremos un precio especial que incluye las dos gestiones.
                </p>
              </div>
            </section>

            {/* Section 7 - FAQ */}
            <section id="faq">
              <h2 className="text-2xl font-extrabold text-foreground mb-4 flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-accent shrink-0" />
                Preguntas frecuentes
              </h2>
              <div className="space-y-4">
                {[
                  {
                    q: "¿Cuánto tiempo tarda un traspaso?",
                    a: "El proceso tradicional toma entre 5 y 20 días hábiles. Con TRASPASA.DO, el Plan Básico se completa en 2-3 días y el Plan Express en 24 horas.",
                  },
                  {
                    q: "¿Necesito estar presente en la DGII?",
                    a: "Si lo haces por tu cuenta, sí. Con un gestor autorizado o con TRASPASA.DO, no necesitas ir personalmente. Nosotros gestionamos todo el proceso por ti.",
                  },
                  {
                    q: "¿Puedo hacer el traspaso si la matrícula está a nombre de un difunto?",
                    a: "Sí, pero requiere documentación adicional: acta de defunción, determinación de herederos y autorización de los herederos legales. Este proceso es más complejo y toma más tiempo.",
                  },
                  {
                    q: "¿Qué pasa si el vehículo tiene oposición?",
                    a: "No se puede hacer el traspaso hasta que la oposición sea levantada. Las oposiciones pueden ser por embargo judicial, reporte de robo o deuda fiscal. Te recomendamos consultar el historial vehicular antes de comprar.",
                  },
                  {
                    q: "¿Puedo hacer el traspaso desde otra provincia?",
                    a: "Sí. La DGII tiene administraciones locales en todo el país. Sin embargo, el expediente puede tardar más si se procesa fuera de Santo Domingo. Con TRASPASA.DO, nosotros gestionamos el proceso independientemente de tu ubicación.",
                  },
                  {
                    q: "¿Qué documentos necesito si soy una empresa (persona jurídica)?",
                    a: "Además de los documentos estándar, necesitas: RNC de la empresa, acta de asamblea autorizando la compraventa, registro mercantil vigente y cédula del representante legal autorizado.",
                  },
                  {
                    q: "¿Puedo verificar un vehículo antes de comprarlo?",
                    a: "Sí. TRASPASA.DO ofrece un servicio de Historial Vehicular por RD$350 que te muestra propietarios anteriores, oposiciones, valor DGII, estado del marbete, multas y traspasos previos.",
                  },
                  {
                    q: "¿Qué es la tabla de valores fidedignos de la DGII?",
                    a: "Es una tabla que la DGII publica con el valor mínimo estimado de cada vehículo según marca, modelo y año. Si vendes un vehículo por debajo de este valor, el impuesto 2% se calcula sobre el valor fidedigno, no sobre el precio de venta declarado.",
                  },
                ].map((faq) => (
                  <div key={faq.q} className="bg-card rounded-xl border border-border p-5">
                    <h3 className="font-bold text-foreground mb-2">{faq.q}</h3>
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Final CTA */}
            <section className="bg-gradient-to-br from-[hsl(var(--navy))] to-[hsl(var(--accent))] rounded-2xl p-8 md:p-10 text-center text-white">
              <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
                Evita todo este dolor de cabeza
              </h2>
              <p className="text-white/80 mb-6 max-w-lg mx-auto">
                TRASPASA.DO gestiona todo por ti: contrato, notaría, Plan Piloto, impuestos, DGII y entrega de la nueva matrícula a domicilio.
              </p>
              <Button variant="cta" size="xl" asChild>
                <Link to="/#solicitud" className="flex items-center gap-2">
                  Iniciar mi traspaso desde RD$3,500 <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <p className="text-xs text-white/50 mt-4">Plan Básico: 2-3 días · Plan Express: 24 horas</p>
            </section>
          </article>

          {/* Floating sidebar CTA */}
          <aside className="hidden lg:block w-72 shrink-0">
            <FloatingCTA />
          </aside>
        </div>
      </div>
    </main>
    <Footer />
    <WhatsAppButton />
  </>
);

export default GuiaTraspaso;
