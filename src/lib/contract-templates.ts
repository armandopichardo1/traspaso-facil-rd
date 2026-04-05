// Contract HTML templates for Dominican Republic vehicle transfers

export interface ContractData {
  // Vehicle
  vehiculo_marca: string;
  vehiculo_modelo: string;
  vehiculo_ano: string | number;
  vehiculo_placa: string;
  vehiculo_color: string;
  vehiculo_chasis: string;
  tipo_vehiculo: string;
  // Seller
  vendedor_nombre: string;
  vendedor_cedula: string;
  vendedor_rnc: string;
  vendedor_tipo_persona: string;
  vendedor_telefono: string;
  // Buyer
  comprador_nombre: string;
  comprador_cedula: string;
  comprador_rnc: string;
  comprador_tipo_persona: string;
  comprador_telefono: string;
  // Contract details
  precio_vehiculo: number | null;
  medio_pago: string;
  fecha_acto_venta: string;
  es_traspaso_familiar: boolean;
  // Representative
  tiene_apoderado: boolean;
  apoderado_nombre: string;
  apoderado_cedula: string;
  // Meta
  codigo: string;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "_______________";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
};

const formatCurrency = (amount: number | null) => {
  if (!amount) return "_______________";
  return `RD$ ${amount.toLocaleString("es-DO")}`;
};

const getDocId = (data: ContractData, party: "vendedor" | "comprador") => {
  const tipo = data[`${party}_tipo_persona`];
  if (tipo === "juridica") return `RNC: ${data[`${party}_rnc`] || "___________"}`;
  return `Cédula: ${data[`${party}_cedula`] || "___________"}`;
};

const tipoVehiculo = (t: string) => t === "motocicleta" ? "Motocicleta" : "Vehículo de Motor";

const baseStyle = `
  <style>
    body { font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.6; color: #000; max-width: 700px; margin: 0 auto; padding: 40px 30px; }
    h1 { text-align: center; font-size: 18px; text-transform: uppercase; margin-bottom: 30px; }
    h2 { font-size: 15px; margin-top: 20px; border-bottom: 1px solid #000; padding-bottom: 4px; }
    .parties { margin: 20px 0; }
    .field { margin: 4px 0; }
    .field strong { min-width: 150px; display: inline-block; }
    .signature-area { margin-top: 60px; display: flex; justify-content: space-between; }
    .sig-block { text-align: center; width: 45%; }
    .sig-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 5px; }
    .legal-notice { font-size: 11px; color: #555; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; }
    .watermark { text-align: center; color: #999; font-size: 10px; margin-top: 20px; }
  </style>
`;

export function generateContratoVenta(data: ContractData): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${baseStyle}</head><body>
    <h1>Contrato de Compraventa de ${tipoVehiculo(data.tipo_vehiculo)}</h1>
    <p>En la ciudad de Santo Domingo, República Dominicana, a los ${formatDate(data.fecha_acto_venta)}, entre las partes que a continuación se identifican:</p>
    
    <h2>PARTE VENDEDORA</h2>
    <div class="parties">
      <div class="field"><strong>Nombre/Razón Social:</strong> ${data.vendedor_nombre || "_______________"}</div>
      <div class="field"><strong>${getDocId(data, "vendedor")}</strong></div>
      <div class="field"><strong>Teléfono:</strong> ${data.vendedor_telefono || "_______________"}</div>
      ${data.vendedor_tipo_persona === "juridica" ? '<div class="field"><strong>Tipo:</strong> Persona Jurídica</div>' : ""}
    </div>

    <h2>PARTE COMPRADORA</h2>
    <div class="parties">
      <div class="field"><strong>Nombre/Razón Social:</strong> ${data.comprador_nombre || "_______________"}</div>
      <div class="field"><strong>${getDocId(data, "comprador")}</strong></div>
      <div class="field"><strong>Teléfono:</strong> ${data.comprador_telefono || "_______________"}</div>
      ${data.comprador_tipo_persona === "juridica" ? '<div class="field"><strong>Tipo:</strong> Persona Jurídica</div>' : ""}
    </div>

    ${data.tiene_apoderado ? `
    <h2>APODERADO / REPRESENTANTE</h2>
    <div class="parties">
      <div class="field"><strong>Nombre:</strong> ${data.apoderado_nombre || "_______________"}</div>
      <div class="field"><strong>Cédula:</strong> ${data.apoderado_cedula || "_______________"}</div>
    </div>` : ""}

    <h2>DATOS DEL ${tipoVehiculo(data.tipo_vehiculo).toUpperCase()}</h2>
    <div class="parties">
      <div class="field"><strong>Marca:</strong> ${data.vehiculo_marca || "_______________"}</div>
      <div class="field"><strong>Modelo:</strong> ${data.vehiculo_modelo || "_______________"}</div>
      <div class="field"><strong>Año:</strong> ${data.vehiculo_ano || "_______________"}</div>
      <div class="field"><strong>Color:</strong> ${data.vehiculo_color || "_______________"}</div>
      <div class="field"><strong>Placa:</strong> ${data.vehiculo_placa || "_______________"}</div>
      <div class="field"><strong>Chasis/VIN:</strong> ${data.vehiculo_chasis || "_______________"}</div>
    </div>

    <h2>CONDICIONES DE LA VENTA</h2>
    <div class="parties">
      <div class="field"><strong>Precio de Venta:</strong> ${formatCurrency(data.precio_vehiculo)}</div>
      <div class="field"><strong>Medio de Pago:</strong> ${data.medio_pago || "_______________"}</div>
      <div class="field"><strong>Fecha del Acto:</strong> ${formatDate(data.fecha_acto_venta)}</div>
      ${data.es_traspaso_familiar ? '<div class="field"><strong>Tipo:</strong> Traspaso entre familiares directos</div>' : ""}
    </div>

    <h2>CLÁUSULAS</h2>
    <p><strong>PRIMERA:</strong> EL VENDEDOR declara ser propietario del vehículo antes descrito y estar facultado para venderlo, libre de todo gravamen, embargo, oposición o cualquier otra restricción que pueda afectar su transferencia.</p>
    <p><strong>SEGUNDA:</strong> EL VENDEDOR transfiere al COMPRADOR la propiedad plena del vehículo descrito, con todos sus accesorios, en el estado en que se encuentra.</p>
    <p><strong>TERCERA:</strong> EL COMPRADOR se obliga a pagar el precio acordado mediante ${data.medio_pago || "el medio de pago convenido"}.</p>
    <p><strong>CUARTA:</strong> Ambas partes se comprometen a realizar los trámites de traspaso ante la Dirección General de Impuestos Internos (DGII) dentro del plazo establecido por la ley (90 días), asumiendo cada parte las responsabilidades que le correspondan.</p>
    <p><strong>QUINTA:</strong> Los gastos de transferencia, impuestos y derechos que se generen por este traspaso serán asumidos según lo acordado entre las partes.</p>
    <p><strong>SEXTA:</strong> Este contrato se firma en dos (2) originales, uno para cada parte, siendo ambos de igual valor y efecto legal.</p>

    <div class="signature-area">
      <div class="sig-block">
        <div class="sig-line">EL VENDEDOR<br/>${data.vendedor_nombre || "_______________"}<br/>${getDocId(data, "vendedor")}</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">EL COMPRADOR<br/>${data.comprador_nombre || "_______________"}<br/>${getDocId(data, "comprador")}</div>
      </div>
    </div>

    <div class="legal-notice">
      <p>Documento generado electrónicamente por TRASPASA.DO · Ref: ${data.codigo || "—"}</p>
      <p>Firma electrónica válida conforme a la Ley 126-02 sobre Comercio Electrónico, Documentos y Firmas Digitales de la República Dominicana.</p>
    </div>
    <div class="watermark">TRASPASA.DO — Plataforma de Traspasos Vehiculares</div>
  </body></html>`;
}

export function generatePoderNotarial(data: ContractData): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${baseStyle}</head><body>
    <h1>Poder Especial para Traspaso de ${tipoVehiculo(data.tipo_vehiculo)}</h1>
    <p>En la ciudad de Santo Domingo, República Dominicana, a los ${formatDate(data.fecha_acto_venta)},</p>

    <h2>PODERDANTE (Otorgante)</h2>
    <div class="parties">
      <div class="field"><strong>Nombre:</strong> ${data.vendedor_nombre || "_______________"}</div>
      <div class="field"><strong>${getDocId(data, "vendedor")}</strong></div>
    </div>

    <h2>APODERADO (Mandatario)</h2>
    <div class="parties">
      <div class="field"><strong>Nombre:</strong> ${data.apoderado_nombre || "_______________"}</div>
      <div class="field"><strong>Cédula:</strong> ${data.apoderado_cedula || "_______________"}</div>
    </div>

    <p>Por medio del presente documento, el PODERDANTE confiere poder especial, amplio y suficiente al APODERADO para que en su nombre y representación realice todos los trámites necesarios para el traspaso del siguiente vehículo:</p>

    <div class="parties">
      <div class="field"><strong>Vehículo:</strong> ${data.vehiculo_marca} ${data.vehiculo_modelo} ${data.vehiculo_ano}</div>
      <div class="field"><strong>Placa:</strong> ${data.vehiculo_placa}</div>
      <div class="field"><strong>Chasis:</strong> ${data.vehiculo_chasis || "_______________"}</div>
    </div>

    <p>Este poder incluye la facultad de firmar documentos, presentar solicitudes ante la DGII, y realizar cualquier gestión administrativa necesaria para completar el traspaso.</p>

    <div class="signature-area">
      <div class="sig-block">
        <div class="sig-line">EL PODERDANTE<br/>${data.vendedor_nombre || "_______________"}</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">EL APODERADO<br/>${data.apoderado_nombre || "_______________"}</div>
      </div>
    </div>

    <div class="legal-notice">
      <p>Documento generado electrónicamente por TRASPASA.DO · Ref: ${data.codigo || "—"}</p>
      <p>Este poder debe ser legalizado ante notario público para tener validez ante la DGII.</p>
    </div>
  </body></html>`;
}

export function generateCartaAutorizacion(data: ContractData): string {
  const empresa = data.vendedor_tipo_persona === "juridica" ? "vendedor" : "comprador";
  const nombreEmpresa = empresa === "vendedor" ? data.vendedor_nombre : data.comprador_nombre;
  const rncEmpresa = empresa === "vendedor" ? data.vendedor_rnc : data.comprador_rnc;

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${baseStyle}</head><body>
    <h1>Carta de Autorización para Traspaso Vehicular</h1>
    <p>En la ciudad de Santo Domingo, República Dominicana, a los ${formatDate(data.fecha_acto_venta)},</p>

    <p>Por medio de la presente, la empresa <strong>${nombreEmpresa || "_______________"}</strong>, RNC: <strong>${rncEmpresa || "_______________"}</strong>, autoriza a su representante legal debidamente designado para realizar el traspaso del vehículo descrito a continuación ante la Dirección General de Impuestos Internos (DGII):</p>

    <div class="parties">
      <div class="field"><strong>Vehículo:</strong> ${data.vehiculo_marca} ${data.vehiculo_modelo} ${data.vehiculo_ano}</div>
      <div class="field"><strong>Placa:</strong> ${data.vehiculo_placa}</div>
      <div class="field"><strong>Chasis:</strong> ${data.vehiculo_chasis || "_______________"}</div>
    </div>

    <p>El representante autorizado queda facultado para firmar todos los documentos necesarios y cumplir con los requisitos establecidos por la DGII para completar este trámite.</p>

    <div class="signature-area">
      <div class="sig-block">
        <div class="sig-line">REPRESENTANTE LEGAL<br/>${nombreEmpresa || "_______________"}<br/>RNC: ${rncEmpresa || "_______________"}</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">SELLO DE LA EMPRESA</div>
      </div>
    </div>

    <div class="legal-notice">
      <p>Documento generado electrónicamente por TRASPASA.DO · Ref: ${data.codigo || "—"}</p>
    </div>
  </body></html>`;
}

export function generateDeclaracionJurada(data: ContractData): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${baseStyle}</head><body>
    <h1>Declaración Jurada para Traspaso Familiar</h1>
    <p>En la ciudad de Santo Domingo, República Dominicana, a los ${formatDate(data.fecha_acto_venta)},</p>

    <p>Yo, <strong>${data.vendedor_nombre || "_______________"}</strong>, ${getDocId(data, "vendedor")}, en mi calidad de vendedor/cedente, y <strong>${data.comprador_nombre || "_______________"}</strong>, ${getDocId(data, "comprador")}, en calidad de comprador/cesionario,</p>

    <p><strong>DECLARAMOS BAJO JURAMENTO</strong> que:</p>

    <p>1. La transferencia del vehículo descrito a continuación se realiza entre familiares directos (ascendientes, descendientes, cónyuges o hermanos).</p>
    <p>2. El precio de la transacción refleja el valor real de la operación.</p>
    <p>3. No existe simulación ni fraude en esta operación.</p>

    <div class="parties">
      <div class="field"><strong>Vehículo:</strong> ${data.vehiculo_marca} ${data.vehiculo_modelo} ${data.vehiculo_ano}</div>
      <div class="field"><strong>Placa:</strong> ${data.vehiculo_placa}</div>
      <div class="field"><strong>Chasis:</strong> ${data.vehiculo_chasis || "_______________"}</div>
      <div class="field"><strong>Precio:</strong> ${formatCurrency(data.precio_vehiculo)}</div>
    </div>

    <p>Asumimos toda responsabilidad legal por la veracidad de esta declaración, conforme a las leyes de la República Dominicana.</p>

    <div class="signature-area">
      <div class="sig-block">
        <div class="sig-line">DECLARANTE 1 (Vendedor)<br/>${data.vendedor_nombre || "_______________"}</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">DECLARANTE 2 (Comprador)<br/>${data.comprador_nombre || "_______________"}</div>
      </div>
    </div>

    <div class="legal-notice">
      <p>Documento generado electrónicamente por TRASPASA.DO · Ref: ${data.codigo || "—"}</p>
    </div>
  </body></html>`;
}

export type ContractType = "contrato_venta" | "poder_notarial" | "carta_autorizacion" | "declaracion_jurada";

export const CONTRACT_LABELS: Record<ContractType, string> = {
  contrato_venta: "Contrato de Compraventa",
  poder_notarial: "Poder Notarial",
  carta_autorizacion: "Carta de Autorización",
  declaracion_jurada: "Declaración Jurada (Familiar)",
};

export function generateContract(type: ContractType, data: ContractData): string {
  switch (type) {
    case "contrato_venta": return generateContratoVenta(data);
    case "poder_notarial": return generatePoderNotarial(data);
    case "carta_autorizacion": return generateCartaAutorizacion(data);
    case "declaracion_jurada": return generateDeclaracionJurada(data);
  }
}
