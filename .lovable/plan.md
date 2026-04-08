

# Plan: Alinear flujos de traspaso con proceso DGII real

## Análisis del proceso DGII real vs lo implementado

El proceso real de traspaso vehicular en República Dominicana sigue este orden:

```text
1. Acuerdo de venta (comprador + vendedor)
2. Acto de venta (contrato notariado)
3. Verificación antifraude / identidad
4. Pago de impuestos (2% del valor + timbres)
5. Entrega de matrícula vieja + documentos a DGII
6. DGII procesa y emite nueva matrícula
7. Entrega de nueva matrícula al comprador
```

## Problemas detectados por rol

### 1. Cliente (customer) — `NuevoTraspaso.tsx` / `TraspasoDetail.tsx`
- **OK**: Selección de rol (vendedor/comprador), captura de cédula con OCR
- **Problema**: El cliente sube marbete desde `TraspasoDetail`, pero el marbete debería capturarse al crear el traspaso (paso de documentos), no después
- **Problema**: El `customer_id` siempre es el usuario logueado, pero si el gestor crea el traspaso, el `customer_id` no debería ser el gestor
- **Problema**: Falta paso de selfie para verificación antifraude (el admin espera `selfie_comprador` y `selfie_vendedor` pero nunca se piden)

### 2. Gestor — `GestorNuevoTraspaso.tsx` / `GestorTraspasoDetail.tsx`
- **Problema crítico**: `customer_id: user!.id` — el gestor se pone a sí mismo como customer. Esto viola las policies RLS y confunde los datos. Debería usar `gestor_id: user!.id` y `customer_id` debería ser null o un UUID del cliente real
- **Problema**: El gestor no puede avanzar el status del traspaso desde su detalle (no tiene botones de acción para mover status)
- **Problema**: El gestor no sube cédulas base64 al storage (la función `uploadFiles` del gestor no maneja `cedulaFiles`)
- **Problema**: No sube selfies ni marbete

### 3. Notario — `NotarioTraspasoDetail.tsx`
- **Problema**: El notario avanza el status a `matricula_recogida` después de firmar. Según DGII, después de la certificación notarial viene la verificación antifraude, NO la recogida de matrícula
- **Problema**: El notario ve TODOS los traspasos (RLS filtra solo por status `contrato_firmado`, `verificacion_antifraude`, `contrato_generado`), pero `contrato_generado` no existe en los STATUS_STEPS
- **Problema**: El flujo del notario debería ser: revisar contrato → firmar → avanzar a `verificacion_antifraude`

### 4. Mensajero — `MensajeroTraspasoDetail.tsx`
- **Problema**: El mensajero avanza a `en_dgii`, pero este status no existe en los STATUS_STEPS definidos. Debería ser `dgii_proceso`
- **Problema menor**: Solo ve traspasos en status `matricula_recogida` y `en_dgii`, pero `en_dgii` no es un status válido

### 5. Admin — `AdminTraspasoDetail.tsx`
- **OK general**: Puede cambiar cualquier status, ver documentos, hacer antifraude
- **Problema**: Los STATUS_STEPS no incluyen `documentos_pendientes` que sí aparece en el gestor

## Flujo correcto propuesto (alineado con DGII)

```text
STATUS PIPELINE:
solicitud_recibida → documentos_completos → contrato_generado → contrato_firmado → verificacion_antifraude → matricula_recogida → dgii_proceso → completado

DUEÑO DE CADA PASO:
1. solicitud_recibida      → CLIENTE o GESTOR crea el traspaso
2. documentos_completos    → GESTOR verifica docs completos, avanza
3. contrato_generado       → GESTOR genera contrato, avanza
4. contrato_firmado        → NOTARIO certifica firma + sello, avanza
5. verificacion_antifraude → ADMIN revisa selfie vs cédula, aprueba/rechaza
6. matricula_recogida      → MENSAJERO recoge matrícula vieja, sube evidencia
7. dgii_proceso            → ADMIN/GESTOR confirma entrada en DGII
8. completado              → ADMIN confirma nueva matrícula lista + entregada
```

## Cambios propuestos

### A. Unificar STATUS_STEPS en un solo archivo compartido
- Crear `src/lib/traspaso-status.ts` con los statuses, labels, y quién es dueño de cada paso
- Reemplazar las definiciones duplicadas en cada página

### B. Corregir GestorNuevoTraspaso — customer_id
- Cambiar `customer_id: user!.id` por un campo opcional o null
- Agregar upload de `cedulaFiles` base64 al storage (como en NuevoTraspaso del cliente)
- Necesita migración: hacer `customer_id` nullable en `traspasos`

### C. Agregar acciones de avance al GestorTraspasoDetail
- Botón "Marcar docs completos" (→ `documentos_completos`)
- Botón "Generar contrato" ya existe, agregar avance a `contrato_generado`
- RLS: gestor ya puede hacer UPDATE en sus traspasos

### D. Corregir flujo del Notario
- Después de firmar, avanzar a `verificacion_antifraude` (no `matricula_recogida`)
- Actualizar RLS del notario para incluir `documentos_completos` y `contrato_generado` en los statuses visibles

### E. Corregir flujo del Mensajero
- Cambiar `en_dgii` por `dgii_proceso` (status que sí existe)
- Actualizar RLS para reflejar los statuses correctos

### F. Agregar captura de selfie en NuevoTraspaso
- Paso de documentos: agregar selfie del comprador y vendedor
- Reutilizar `DocumentCameraGuide` con aspect ratio de retrato

### G. Mover MarbeteUpload al flujo de creación
- Sacar MarbeteUpload de TraspasoDetail y ponerlo en el paso de documentos de NuevoTraspaso

## Detalles técnicos

- 1 archivo nuevo: `src/lib/traspaso-status.ts`
- 1 migración: `customer_id` nullable + actualizar RLS del notario y mensajero
- 6 archivos editados: NuevoTraspaso, GestorNuevoTraspaso, GestorTraspasoDetail, NotarioTraspasoDetail, MensajeroTraspasoDetail, AdminTraspasoDetail
- Todos los STATUS_STEPS unificados desde el archivo compartido

