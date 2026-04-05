
## Plan: Campos DGII + Contratos Auto-generados + Firma Electrónica (Ley 126-02)

### Contexto Legal - Firma Electrónica en RD
La **Ley 126-02** sobre Comercio Electrónico, Documentos y Firmas Digitales establece que:
- La **firma electrónica simple** (consentimiento + datos de identificación + timestamp) tiene validez legal para contratos privados
- La **firma digital certificada** (PKI con certificado de OGTIC) se requiere solo para trámites gubernamentales
- Para contratos de compraventa de vehículos entre privados, la firma electrónica simple con audit trail es suficiente

**Mecanismo a implementar**: Firma electrónica simple con:
- Pad de firma táctil (dibujo del usuario)
- Captura de IP, timestamp, user-agent, geolocalización
- Hash SHA-256 del documento firmado
- Almacenamiento del audit trail completo

---

### Paso 1: Migración de base de datos
Agregar a tabla `traspasos`:
- `tipo_vehiculo` (text, default 'vehiculo_motor') — motor o motocicleta
- `vehiculo_chasis` (text, nullable) — número de chasis/VIN
- `fecha_acto_venta` (date, nullable) — fecha del contrato
- `medio_pago` (text, nullable) — transferencia, cheque, efectivo, financiamiento
- `es_traspaso_familiar` (boolean, default false)
- `tiene_apoderado` (boolean, default false)
- `apoderado_nombre` (text, nullable)
- `apoderado_cedula` (text, nullable)

Crear tabla `traspaso_firmas`:
- `id` (uuid, PK)
- `traspaso_id` (uuid, FK → traspasos)
- `tipo_firmante` (text) — vendedor, comprador, apoderado
- `nombre_firmante` (text)
- `cedula_firmante` (text)
- `firma_imagen_url` (text) — imagen del pad de firma
- `firma_hash` (text) — SHA-256 del documento al momento de firmar
- `ip_address` (text)
- `user_agent` (text)
- `geolocation` (text, nullable)
- `documento_url` (text) — URL del PDF firmado
- `created_at` (timestamptz)

Crear tabla `traspaso_contratos`:
- `id` (uuid, PK)
- `traspaso_id` (uuid, FK → traspasos)
- `tipo` (text) — contrato_venta, poder_notarial, carta_autorizacion, declaracion_jurada
- `contenido_html` (text) — HTML del contrato generado
- `pdf_url` (text, nullable) — URL del PDF generado
- `status` (text) — borrador, firmado
- `created_at` (timestamptz)

### Paso 2: Actualizar formularios — Nuevos campos DGII

**Paso Vehículo** (ambos flujos):
- Selector tipo_vehiculo: "Vehículo de Motor" / "Motocicleta"
- Campo chasis/VIN

**Nuevo paso "Contrato"** (entre Comprador y Documentos):
- Fecha del acto de venta (date picker)
- Selector medio de pago (Transferencia, Cheque, Efectivo, Financiamiento)
- Toggle "¿Traspaso entre familiares directos?"
- Toggle "¿El trámite lo realiza un apoderado?"
- Si apoderado → nombre y cédula del apoderado
- ⚠️ Alerta si fecha > 90 días (recargos DGII)

**Paso Documentos actualizado** — uploads condicionales:
- ✅ Siempre: Cédula vendedor reverso, Cédula comprador reverso, Certificación Plan Piloto
- 🔄 Si empresa: Carta de autorización + Cédula representante legal
- 🔄 Si apoderado: Poder notarizado + Cédula del apoderado
- 🔄 Si familiar: Certificación bancaria + Carta trabajo / Declaración jurada
- 🔄 Si precio > RD$800,000: Comprobante de pago
- 📄 Contrato de venta → **Botón "Generar Contrato"** (auto-populado)

### Paso 3: Generación de contratos (Edge Function)

Edge function `generate-contract` que:
1. Recibe `traspaso_id` y `tipo_contrato`
2. Consulta datos del traspaso de la BD
3. Genera HTML del contrato usando template
4. Convierte a PDF con la data auto-populada
5. Guarda en Storage y registra en `traspaso_contratos`

Templates a generar:
- **Contrato de Compraventa** — template genérico con datos de vendedor, comprador, vehículo, precio, medio de pago
- **Poder Notarial** — cuando hay apoderado
- **Carta de Autorización** — cuando el vendedor/comprador es empresa
- **Declaración Jurada** — para traspasos familiares

Cada template se auto-popula con los datos del formulario. El usuario puede previsualizar antes de firmar.

### Paso 4: Componente SignaturePad

Componente React reutilizable:
- Canvas táctil para dibujar firma
- Botones: Limpiar, Confirmar
- Al confirmar: captura firma como PNG, IP, timestamp, user-agent
- Calcula hash SHA-256 del documento
- Sube firma a Storage
- Registra en `traspaso_firmas`
- Cumple con Ley 126-02: identifica al firmante, vincula firma al documento, registra audit trail

### Paso 5: Flujo de firma en detalle del traspaso

En las vistas de detalle (GestorTraspasoDetail, TraspasoDetail):
- Sección "Documentos y Contratos"
- Botón "Generar Contrato" → llama edge function → muestra preview
- Botón "Firmar Documento" → abre SignaturePad → registra firma
- Estado visual: Sin firmar / Firmado por vendedor / Firmado por ambas partes
- Descarga del PDF firmado con audit trail

### Paso 6: Actualizar OCR para extraer chasis/VIN

Actualizar edge function `ocr-matricula`:
- Agregar `vehiculo_chasis` al schema de extracción
- El chasis aparece en la matrícula dominicana

### Detalles técnicos
- Los contratos se generan como HTML → se almacenan en `traspaso_contratos.contenido_html`
- El PDF se genera via edge function usando HTML-to-PDF
- La firma electrónica cumple Ley 126-02 Art. 6: "firma electrónica" = datos en forma electrónica que identifican al firmante
- El hash SHA-256 vincula la firma al documento exacto (integridad)
- El audit trail (IP, timestamp, user-agent, geolocation) cumple con requisitos de no repudio
- Dependencia nueva: `signature_pad` (npm) para el canvas de firma
