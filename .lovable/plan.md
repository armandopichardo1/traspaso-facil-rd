# Plan: Spine funcional del traspaso end-to-end (demo) + capa de servicio swap-able

## Objetivo

Que un demo pueda recorrer el flujo completo: **historial → wizard de traspaso → upload de documentos → 10 transiciones de estado con roles → vista de escrow → completado**. Toda la I/O contra Supabase pasa por `src/services/traspasoService.ts` para que cuando el back-end real esté listo solo se cambie la implementación, sin tocar UI.

---

## Estado actual (resultado del scan)

- **30+ archivos** llaman `supabase` directamente (UI hace consultas, mutaciones, storage, etc.). Esto es lo que vamos a centralizar.
- Páginas por rol ya existen: `app/`, `admin/`, `gestor/`, `notario/`, `mensajero/`.
- `traspaso-status.ts` ya tiene la máquina de 10 estados, `canAdvanceTo`, `getNextStatus`, `requiresEscrowRefund`, `cancelTraspaso`.
- Tablas DB: `traspasos`, `traspaso_documentos`, `traspaso_firmas`, `traspaso_contratos`, `traspaso_timeline`, `traspaso_mensajes`, `historial_consultas`, `profiles`.
- Bug detectado en sesión anterior: `NotarioTraspasoDetail.tsx:89` avanza a `verificacion_antifraude` (debería ser `legalizacion_pgr`).
- `MensajeroTraspasoDetail.tsx:80` hardcodea `dgii_proceso` como next (debería usar `getNextStatus`).

---

## Arquitectura del service layer

### Archivo principal: `src/services/traspasoService.ts`

Wrapper delgado, **sin lógica de negocio**, que devuelve tipos limpios y errores `Result`-style. No exporta tipos de Supabase. Cada función lleva un comentario `@backend` con el endpoint REST equivalente que el back-end real deberá exponer.

### Subarchivos para mantenerlo manejable
- `src/services/types.ts` — DTOs front-end (independientes del schema de Supabase): `Traspaso`, `TraspasoDoc`, `TraspasoTimelineEntry`, `Firma`, `HistorialConsulta`, `EscrowSnapshot`, etc.
- `src/services/traspasoService.ts` — operaciones del pipeline de traspaso.
- `src/services/historialService.ts` — intake y consulta de historial.
- `src/services/mockBackend.ts` — funciones simuladas con `TODO_BACKEND` (payments, escrow real, DGII checks, antifraude IA).

### Patrón de retorno
```ts
type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string };
```
UI consume con React Query (`queryFn` retorna `data` si `ok`, sino throw para que React Query maneje el error toast).

### Hook estándar
`src/hooks/useTraspaso.ts`, `useTraspasoList.ts`, `useTraspasoTimeline.ts`, etc. — envuelven los servicios con React Query y exponen `invalidate` keys consistentes (`["traspaso", id]`, `["traspasos", filters]`).

---

## Contrato (firmas públicas) — esto es lo que el back-end real deberá implementar

### Historial (`historialService.ts`)
```ts
createHistorialRequest(input: { placa: string; telefono: string; email?: string }): Promise<ServiceResult<HistorialConsulta>>
listHistorialesForUser(userId: string): Promise<ServiceResult<HistorialConsulta[]>>
listPendingHistoriales(): Promise<ServiceResult<HistorialConsulta[]>>     // admin
getHistorial(id: string): Promise<ServiceResult<HistorialConsulta>>
adminFulfillHistorial(id: string, resultado: HistorialResultado): Promise<ServiceResult<void>>   // admin
```

### Traspaso — lectura
```ts
getTraspaso(id: string): Promise<ServiceResult<Traspaso>>
getTraspasoByCodigo(codigo: string): Promise<ServiceResult<Traspaso>>     // tracking público
listTraspasosForRole(role: UserRole, userId: string, filters?: TraspasoFilters): Promise<ServiceResult<Traspaso[]>>
getTimeline(traspasoId: string): Promise<ServiceResult<TraspasoTimelineEntry[]>>
```

### Traspaso — creación y edición
```ts
createTraspaso(input: NewTraspasoInput): Promise<ServiceResult<Traspaso>>
updateTraspasoFields(id: string, patch: Partial<EditableTraspasoFields>): Promise<ServiceResult<Traspaso>>
assignRole(id: string, role: "gestor" | "notario" | "mensajero", userId: string): Promise<ServiceResult<void>>   // admin
```

### Máquina de estados (la pieza central)
```ts
advanceStatus(
  id: string,
  toStatus: TraspasoStatus,
  actor: { id: string; role: UserRole },
  options?: { nota?: string; evidenceUrl?: string }
): Promise<ServiceResult<Traspaso>>

cancelTraspaso(
  id: string,
  actor: { id: string; role: UserRole },
  reason: string
): Promise<ServiceResult<{ traspaso: Traspaso; refundTriggered: boolean }>>
```
Internamente: valida con `canAdvanceTo`, escribe `traspasos.status`, agrega entrada en `traspaso_timeline`, y si aplica dispara `mockBackend.triggerEscrowRefund` (TODO_BACKEND).

### Documentos
```ts
uploadDocumento(traspasoId: string, tipo: DocTipo, file: File): Promise<ServiceResult<TraspasoDoc>>
listDocumentos(traspasoId: string): Promise<ServiceResult<TraspasoDoc[]>>
getDocumentoSignedUrl(docId: string): Promise<ServiceResult<string>>
```

### Firmas
```ts
saveFirma(input: { traspasoId: string; tipoFirmante: FirmanteTipo; firmaImagenBlob: Blob; nombre: string; cedula?: string; }): Promise<ServiceResult<Firma>>
listFirmas(traspasoId: string): Promise<ServiceResult<Firma[]>>
```

### Contratos
```ts
generateContract(traspasoId: string, tipo: ContractTipo): Promise<ServiceResult<{ id: string; html: string }>>
getContract(contractId: string): Promise<ServiceResult<{ html: string; pdfUrl?: string }>>
```

### Mensajes (chat traspaso)
```ts
listMensajes(traspasoId: string): Promise<ServiceResult<TraspasoMensaje[]>>
sendMensaje(traspasoId: string, text: string): Promise<ServiceResult<TraspasoMensaje>>
markRead(traspasoId: string): Promise<ServiceResult<void>>
```

### Escrow (mockBackend.ts — `TODO_BACKEND`)
```ts
createEscrowDeposit(traspasoId: string, amountRD: number): Promise<ServiceResult<EscrowSnapshot>>   // simula pago
getEscrowSnapshot(traspasoId: string): Promise<ServiceResult<EscrowSnapshot>>                       // lee escrow_status + pago_servicio_status
confirmEscrowReceived(traspasoId: string): Promise<ServiceResult<EscrowSnapshot>>                   // admin
releaseEscrowToVendor(traspasoId: string): Promise<ServiceResult<EscrowSnapshot>>                   // al completar
triggerEscrowRefund(traspasoId: string, reason: string): Promise<ServiceResult<EscrowSnapshot>>     // al cancelar
```

### Otros mocks `TODO_BACKEND`
```ts
runAntifraudeCheck(traspasoId: string): Promise<ServiceResult<{ score: number; passed: boolean }>>   // simula IA
fetchDgiiStatus(traspasoId: string): Promise<ServiceResult<{ stage: string; estimatedDate: string }>>  // simula scraping DGII
sendWhatsAppNotification(to: string, template: string, vars: Record<string,string>): Promise<ServiceResult<void>>
```

---

## Pricing en el spine
- Cualquier monto cobrado se lee de `pricing_config` vía `usePricing` (ya planeado). El service `createTraspaso` recibe `plan: "basico" | "express"` y consulta `pricing_config` para sellar el precio en el registro.

---

## Plan de implementación (etapas, una por aprobación)

### Etapa 1 — Tipos + service skeleton (sesión actual al aprobar)
- Crear `src/services/types.ts`, `src/services/traspasoService.ts`, `src/services/historialService.ts`, `src/services/mockBackend.ts` con **todas las firmas y bodies funcionales**. Sin tocar UI todavía. Cada función con comentario `@backend GET /api/...` y `TODO_BACKEND` donde aplique.
- Crear `src/hooks/useTraspaso*.ts` que envuelven los servicios con React Query.

### Etapa 2 — Refactor de páginas de cliente
- `Dashboard.tsx`, `NuevoTraspaso.tsx`, `TraspasoDetail.tsx`, `EscrowView.tsx`, `HistorialDetail.tsx` → consumir los hooks.

### Etapa 3 — Refactor de panel admin
- `AdminDashboard`, `AdminTraspasoDetail`, `AdminHistoriales` → hooks + acciones `advanceStatus`, `cancelTraspaso`, `adminFulfillHistorial`.

### Etapa 4 — Refactor paneles de roles operativos
- `GestorDashboard`, `GestorTraspasoDetail`, `GestorNuevoTraspaso`, `NotarioTraspasoDetail` (incluye fix del bug de transición), `MensajeroTraspasoDetail` (incluye fix de hardcoded `dgii_proceso`).

### Etapa 5 — Mocks visibles y testing manual
- Botones de admin "Simular pago escrow", "Simular antifraude OK", "Simular respuesta DGII" — claramente marcados como demo.
- Recorrido manual del flujo completo con cuenta admin + cuenta cliente.

### Etapa 6 — Documentación del contrato
- Generar `BACKEND_CONTRACT.md` listando cada función del service con su firma, su tabla/endpoint actual, y el endpoint REST objetivo.

---

## Lo que NO toco

- `traspaso-status.ts` — ya es la fuente de verdad.
- RLS — se respetan tal cual; el service layer asume que Supabase RLS valida.
- Edge functions — no se crean nuevas en esta fase; los mocks viven en `mockBackend.ts` (client-side, simulando latencia con `setTimeout`).
- KNOWLEDGE.md — se actualizará en una sesión posterior con el contenido de `BACKEND_CONTRACT.md`.

---

## Preguntas antes de pasar a build mode

1. **Alcance de la sesión de implementación:** ¿Cubrimos solo **Etapa 1** (skeleton de servicios + hooks, sin refactor de UI) o quieres que en la misma sesión empecemos a migrar **Etapa 2** (páginas de cliente)? Recomiendo Etapa 1 sola — es la base sobre la que todo lo demás se apoya, y deja un commit fácil de revisar.
2. **Estilo de los mocks de escrow/DGII/antifraude:** ¿prefieres mocks **deterministas** (siempre OK, latencia fija) o con un **toggle de admin** para simular fallos (declined, fraude detectado, DGII rechaza)? Para una demo de inversores el determinista basta; el toggle es útil si vas a mostrar el camino de cancelación.
3. **Persistencia de mocks:** los estados de escrow viven en `traspasos.escrow_status` y `pago_servicio_status` (ya existen). ¿OK que `mockBackend` solo escriba ahí, o quieres una tabla `mock_payments` separada para no contaminar la real?

Con tus respuestas (o "default a tus recomendaciones") cambio a build mode y arranco con Etapa 1.
