

# Auditoría: Flujo Cliente vs Gestor vs Admin — Problemas y Soluciones

## Resumen del flujo actual DGII

```text
solicitud_recibida → documentos_completos → contrato_generado → contrato_firmado
     (1)                   (2)                    (3)                  (4)
  Cliente/Gestor         Gestor                 Gestor               Notario
                                                                        ↓
completado ← dgii_proceso ← matricula_recogida ← verificacion_antifraude
   (8)           (7)              (6)                    (5)
  Admin      Admin/Gestor      Mensajero                Admin
```

## Problemas detectados

### 1. Cliente crea traspaso completo — pero no deberia
**Problema:** El cliente en `NuevoTraspaso.tsx` llena TODOS los datos (vendedor, comprador, vehiculo, contrato, documentos, plan) y crea el traspaso con status `solicitud_recibida`. Pero segun DGII, el **gestor** es quien verifica documentos y genera contratos. El cliente esta haciendo trabajo del gestor.

**En la vida real:** El cliente (vendedor o comprador) contacta al gestor, le entrega los documentos, y el gestor maneja todo. El cliente no llena formularios de 7 pasos.

### 2. Duplicacion total del flujo de creacion
**Problema:** `NuevoTraspaso.tsx` (cliente, 7 pasos) y `GestorNuevoTraspaso.tsx` (gestor, 7 pasos) son casi identicos (~600 lineas cada uno). El gestor tiene un paso extra de matricula scanner y precios mayoristas, pero el resto es copy-paste.

### 3. El cliente no tiene acciones post-creacion
**Problema:** En `TraspasoDetail.tsx`, el cliente solo ve el timeline y documentos — no puede hacer nada. No puede firmar contratos, no puede subir documentos adicionales, no puede comunicarse con el gestor dentro de la app.

### 4. STATUS_STEPS inconsistentes entre vistas
**Problema:** 
- `Dashboard.tsx` del cliente tiene sus propios STATUS_STEPS que NO coinciden con `traspaso-status.ts` (falta `documentos_completos`, `contrato_generado`)
- El cliente ve "REVISIÓN" donde deberia ver "Documentos Completos", etc.

### 5. El admin tiene poder total sin restricciones
**Problema:** El admin puede cambiar status a CUALQUIER valor sin validar el orden del pipeline. Puede saltar de `solicitud_recibida` a `completado`. No hay validacion de orden.

### 6. No hay asignacion gestor-traspaso para traspasos del cliente
**Problema:** Cuando el cliente crea un traspaso, `gestor_id` queda null. No hay mecanismo para que un admin asigne un gestor, ni para que el gestor "tome" el caso.

### 7. Notario ve traspasos sin filtro de asignacion
**Problema:** El notario ve TODOS los traspasos en status `contrato_generado/firmado/verificacion`, no solo los que le corresponden. No hay campo `notario_id` en la tabla.

---

## Soluciones propuestas

### Solucion A: Simplificar flujo del cliente (recomendada)
Reducir el formulario del cliente a lo minimo:
1. **Paso 1:** Seleccionar si es vendedor o comprador
2. **Paso 2:** Datos del vehiculo (placa, marca, modelo) + foto del marbete con OCR
3. **Paso 3:** Datos de la contraparte (nombre, cedula, telefono)
4. **Paso 4:** Subir documentos basicos (cedula frente/reverso + selfie)
5. **Paso 5:** Elegir plan y confirmar

Eliminar del flujo del cliente: contrato (lo genera el gestor), fecha acto venta, medio pago, apoderado, persona juridica. Esos datos los llena el gestor.

### Solucion B: Asignacion de gestor
- Agregar columna `notario_id` y `mensajero_id` a la tabla traspasos
- Admin asigna gestor cuando el cliente crea un traspaso (o auto-asigna al gestor disponible)
- Panel admin muestra traspasos sin gestor como "pendientes de asignacion"

### Solucion C: Unificar STATUS_STEPS
- Eliminar los STATUS_STEPS locales de `Dashboard.tsx`
- Usar siempre los de `traspaso-status.ts`
- El cliente ve un timeline simplificado con nombres amigables

### Solucion D: Validar transiciones de status
- El admin solo puede avanzar al siguiente status valido (no saltar)
- Cada rol solo puede avanzar los status que le corresponden
- Crear funcion `getNextStatus(currentStatus, role)` centralizada

### Solucion E: Acciones del cliente post-creacion
- El cliente puede firmar contratos desde `TraspasoDetail` cuando el status es `contrato_generado`
- El cliente puede subir documentos faltantes
- Chat/notas entre cliente y gestor (tabla `traspaso_mensajes`)

---

## Plan de implementacion

### Paso 1 — Unificar STATUS_STEPS (rapido)
Eliminar STATUS_STEPS duplicados de `Dashboard.tsx`. Importar desde `traspaso-status.ts`. Ajustar el progress bar del cliente para usar las etiquetas correctas.

### Paso 2 — Simplificar NuevoTraspaso del cliente
Reducir de 7 pasos a 5. Mover campos avanzados (contrato, apoderado, persona juridica) al flujo del gestor unicamente.

### Paso 3 — Agregar asignacion de gestor/notario/mensajero
Migracion DB: agregar `notario_id` y `mensajero_id` a traspasos. UI admin para asignar roles. Auto-asignar gestor cuando el admin lo decida.

### Paso 4 — Validar transiciones de status
Crear helper `canAdvanceTo(currentStatus, nextStatus, role)`. Usarlo en GestorTraspasoDetail, NotarioTraspasoDetail, MensajeroTraspasoDetail, y AdminTraspasoDetail.

### Paso 5 — Acciones del cliente en TraspasoDetail
Permitir al cliente firmar contratos y subir documentos adicionales cuando el traspaso esta en los estados correspondientes.

## Detalles tecnicos
- 1 migracion DB (agregar notario_id, mensajero_id)
- 1 nuevo helper en `traspaso-status.ts` (canAdvanceTo, getNextStatus)
- ~5 archivos editados (Dashboard, NuevoTraspaso, TraspasoDetail, AdminTraspasoDetail, GestorTraspasoDetail)
- Sin nuevas Edge Functions

