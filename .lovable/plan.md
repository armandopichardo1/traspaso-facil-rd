# Pulido: Cliente · Dashboard (`src/pages/app/Dashboard.tsx`)

Pantalla principal tras login. Es la única del cliente con dos fetches paralelos (`traspasos` + `historiales`) y la acción primaria de "Solicitar Historial". Quedan brechas vs. el estándar ya aplicado al resto.

## Brechas detectadas hoy

1. **Loaders**: skeletons sueltos (`h-52`, `h-32`) que no imitan el layout final → "salto" visual al cargar.
2. **Errores**: las queries no exponen `isError`/`refetch` → si falla el fetch, queda pantalla en blanco sin retry.
3. **Vacío**: hay empty para "Actividad Reciente", pero no hay caso compuesto "sin traspaso activo + sin actividad" con CTA claro.
4. **UI optimista**: el botón "Obtener Informe" hace `await mutateAsync` → el usuario espera el round-trip antes de ver éxito.
5. **Animaciones**: hay `motion` en entradas, pero falta la transición significativa form ↔ éxito y un hover sutil en el card de traspaso activo.
6. **Tokens**: usa `bg-green-100`, `text-green-700`, `bg-red-100` directos → debe migrar a `success`/`destructive` semánticos (KNOWLEDGE §2.1).

## Cambios (un solo prompt, un solo archivo)

### A. Estados con `StateView`
- Exponer `isError`, `error`, `refetch` en ambas queries (`useTraspasosForRole`, `useHistorialesForUser`).
- Si **ambas** fallan → render `<ErrorState onRetry={...}>` arriba (sin tapar el hero).
- Si **una** falla → `toast.error` discreto + render parcial.

### B. Skeletons que imitan el layout
- Welcome: skeleton de título (`h-7 w-40`) mientras no hay `profile`.
- Traspaso activo: skeleton compuesto (header + barra segmentada + botón) en lugar de un bloque liso.
- Actividad reciente: grid 2×2 de skeleton-cards.

### C. Empty state compuesto
- Sin traspaso activo + sin actividad + sin historiales → un único card "Aún no tienes traspasos" con CTA "Iniciar mi primer traspaso" (en vez del CTA negro suelto).

### D. UI optimista en "Obtener Informe"
- Migrar a `mutate` con `onMutate`/`onError`:
  - `onMutate`: `setSubmitted(true)` inmediato, limpiar inputs.
  - `onSuccess`: `toast.success` + invalidar `["historiales", userId]` para que aparezca en Actividad sin recargar.
  - `onError`: revertir `setSubmitted(false)`, restaurar placa/teléfono, `toast.error`.
- Validación cliente de placa antes de disparar.

### E. Motion sutil (solo en transiciones significativas)
- `AnimatePresence` envolviendo form ↔ card de éxito (fade + scale 0.98→1).
- Card de traspaso activo: `whileHover={{ y: -2 }}` con spring suave.
- Mantener los `motion.div` actuales de entrada.

### F. Tokens semánticos
- Badge "Verificado" y "COMPLETADO" → `bg-success/10 text-success border-success/20`.
- Badge "CANCELADO" → `bg-destructive/10 text-destructive`.
- Card de éxito del historial → `border-success/30 bg-success/5` con `text-success`.
- Eyebrows ("TRASPASO ACTIVO", "ACTIVIDAD RECIENTE") → `text-gold` (KNOWLEDGE §2.2).

## Cambios que TÚ haces por Visual Edit (ahorra créditos)

Clic en **Edit** (esquina inf. izq.) → selecciona el texto → edita. Cero créditos para:

1. Subtítulo: *"Tu gestión vehicular a máxima velocidad."*
2. Título hero historial: *"Consulta Historial Vehicular"* y subtítulo *"Conoce todo sobre un vehículo antes de comprar — RD$350"*.
3. Chip inferior: *"✅ Propietarios · Oposiciones · Valor DGII · Multas · Marbete"*.
4. Card éxito: *"¡Solicitud Recibida!"* y descripción de los 30 min.
5. CTA negro: *"Iniciar Nuevo Traspaso"* / *"Completa tu trámite en minutos"*.
6. Botón principal: *"CONTINUAR TRASPASO →"*.
7. Eyebrow + subtítulo *"Reportes e Historial"* y link *"Ver todo"*.
8. Placeholder de la placa y del WhatsApp.

## Archivos a tocar

- `src/pages/app/Dashboard.tsx` (único)
- Sin migraciones, sin cambios de servicio.

## Criterios de aceptación

- Cero pantalla blanca: skeletons coherentes con el layout final desde el primer frame.
- Si una query falla, "Reintentar" recupera sin recargar.
- "Obtener Informe": card de éxito aparece <100 ms; si falla, vuelvo al form con los datos intactos y toast de error.
- Card de traspaso activo levanta 2px en hover.
- Cero clases `text-green-*` / `text-red-*` / `bg-blue-*` — solo tokens semánticos.

## Siguiente (cuando apruebes este)

Propongo en este orden, una pantalla por turno:
1. **Cliente · NuevoTraspaso** (wizard, alta de optimismo en submit)
2. **Admin · AdminHistoriales** (cola con dialog de procesamiento — UI optimista en "completar")
3. **Admin · AdminDashboard** (métricas con múltiples queries paralelas)