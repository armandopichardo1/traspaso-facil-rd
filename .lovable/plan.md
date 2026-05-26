# Plan: Auditoría e implementación de RLS

## Resumen ejecutivo

Después de revisar todas las políticas en el schema dump más las políticas de `storage.objects`, encontré **8 huecos reales de seguridad** que violan el modelo de KNOWLEDGE.md §8. Tres son críticos (PII expuesta), cinco son menores (sobre-acceso). También faltan políticas explícitas para casos válidos (notario debe ver documentos asignados).

No hago cambios en esta fase — solo expongo los hallazgos, la matriz de pruebas que correré después y la migración propuesta para tu aprobación.

---

## Matriz objetivo (lo que KNOWLEDGE.md §8 exige)

| Rol | traspasos | documentos | firmas | contratos | timeline | mensajes | profiles | historial | leads |
|---|---|---|---|---|---|---|---|---|---|
| customer | SELECT+UPDATE own | R/W own | R own | R own | R own | R/W own | R/W own | R own | — |
| gestor | R/W asignados | R/W asignados | R asignados | R/W asignados | R asignados | R/W asignados | R sólo de partes de sus traspasos | — | — |
| notario | R asignados (estados firma) | **R sólo contrato/firmas** | R/W asignados | R asignados | R asignados | — | — | — | — |
| mensajero | R asignados (estados recogida/entrega) | R/W (matrícula/comprobantes) | — | — | R asignados | — | — | — | — |
| admin | full | full | full | full | full | full | full | full | full |
| anon | R por código (limitado) | — | — | — | R por código (limitado) | — | — | INSERT only | INSERT only |

---

## Huecos encontrados

### 🔴 Críticos (filtran PII o permiten escritura indebida)

1. **`historial_consultas` — "Authenticated users can read consultas" USING (true)**
   Cualquier usuario logueado lee TODOS los historiales (placas + teléfonos + emails de otros). Debe ser `auth.uid() = user_id OR is_admin`.

2. **`leads` — "Authenticated users can read/update leads" USING (true)**
   Igual: cualquier usuario logueado ve y modifica todos los leads (nombres, teléfonos, comentarios). Debe restringirse a admin.

3. **`traspaso_timeline` — "Public can read timeline for tracking" USING (true) + "System can add timeline entries" auth.uid() IS NOT NULL**
   - Lectura: cualquiera (incluido anon) lista TODO el timeline de todos los traspasos. El tracking público debe ir por `codigo` del traspaso (igual que la política anon de `traspasos`).
   - Inserción: cualquier usuario autenticado puede meter entradas en cualquier traspaso. Debe escoparse al rol que tiene permiso para el status que está escribiendo, o eliminarse y dejar solo las políticas por rol que ya existen.

### 🟠 Sobre-acceso (no PII grave pero rompe el modelo)

4. **`profiles` — "Gestores can view profiles" USING (role='gestor')**
   Un gestor ve TODOS los perfiles del sistema (cédulas, teléfonos, emails de todos los usuarios). Debe escoparse a perfiles de customers que son parte de uno de SUS traspasos.

5. **`traspasos` — "Anon can read traspasos by code" expone todas las columnas**
   La política filtra correctamente por `codigo IS NOT NULL` pero la consulta `SELECT *` devuelve `vendedor_cedula`, `comprador_cedula`, `vendedor_telefono`, `precio_vehiculo`, `antifraude_notas`, `notas_internas`, etc. Para tracking público basta `codigo`, `status`, `created_at`, `updated_at`. → crear vista `public.traspasos_tracking` con security_invoker y forzar el front a leerla.

6. **`traspaso_documentos` — falta política de notario**
   Notario necesita ver `contrato_firmado` y cédulas para certificar, pero hoy no tiene SELECT. Front falla silencioso.

7. **Customer NO puede UPDATE sus propios traspasos**
   La spec de §8 dice que el customer puede editar datos del comprador/vehículo mientras `status = solicitud_recibida`. Hoy no existe política → front se rompe en `NuevoTraspaso` paso 2+.

### 🟡 Storage (`storage.objects` bucket `documentos`)

8. **Políticas actuales son demasiado abiertas:**
   - `Authenticated users can upload docs`: cualquier usuario autenticado sube a CUALQUIER path. Debe restringir el prefijo del path al `traspaso_id` que el usuario posee.
   - `Users can view own docs`: USING (auth.uid() IS NOT NULL) — cualquier autenticado lee CUALQUIER archivo del bucket. Debe verificar que el path empieza por un `traspaso_id` cuyo `customer_id`, `gestor_id`, `notario_id` o `mensajero_id` sea el usuario; o que sea admin.

---

## Migración propuesta (la mostraré en build mode)

```sql
-- 1) historial_consultas: lectura restringida
DROP POLICY "Authenticated users can read consultas" ON historial_consultas;
CREATE POLICY "Customers read own consultas" ON historial_consultas
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read all consultas" ON historial_consultas
  FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

-- 2) leads: solo admin lee/actualiza
DROP POLICY "Authenticated users can read leads" ON leads;
DROP POLICY "Authenticated users can update leads" ON leads;
CREATE POLICY "Admins read leads" ON leads
  FOR SELECT USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins update leads" ON leads
  FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

-- 3) traspaso_timeline: cerrar lectura pública y restringir inserción genérica
DROP POLICY "Public can read timeline for tracking" ON traspaso_timeline;
DROP POLICY "System can add timeline entries" ON traspaso_timeline;
CREATE POLICY "Anon read timeline by codigo" ON traspaso_timeline
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM traspasos t WHERE t.id = traspaso_id AND t.codigo IS NOT NULL));

-- 4) profiles: gestor solo ve perfiles de SUS partes
DROP POLICY "Gestores can view profiles" ON profiles;
CREATE POLICY "Gestores see related customer profiles" ON profiles
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'gestor'
    AND EXISTS (SELECT 1 FROM traspasos t
                WHERE t.gestor_id = auth.uid() AND t.customer_id = profiles.id)
  );

-- 5) traspasos: vista pública de tracking + actualizar el front
CREATE VIEW public.traspasos_tracking WITH (security_invoker=on) AS
  SELECT id, codigo, status, asset_type, vehiculo_marca, vehiculo_modelo,
         vehiculo_placa, created_at, updated_at
  FROM public.traspasos WHERE codigo IS NOT NULL;
-- Nota: la política "Anon can read traspasos by code" se mantiene mientras
-- migramos el front a la vista; luego se elimina.

-- 6) traspaso_documentos: notario lee asignados
CREATE POLICY "Notarios see assigned docs" ON traspaso_documentos
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'notario'
    AND EXISTS (SELECT 1 FROM traspasos t
                WHERE t.id = traspaso_id AND t.notario_id = auth.uid())
  );

-- 7) traspasos: customer puede editar mientras esté en solicitud_recibida
CREATE POLICY "Customers update own draft" ON traspasos
  FOR UPDATE
  USING (auth.uid() = customer_id AND status = 'solicitud_recibida')
  WITH CHECK (auth.uid() = customer_id AND status = 'solicitud_recibida');

-- 8) storage.objects bucket documentos
DROP POLICY "Authenticated users can upload docs" ON storage.objects;
DROP POLICY "Users can view own docs" ON storage.objects;

CREATE POLICY "Doc upload owner or staff" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documentos'
    AND auth.uid() IS NOT NULL
    AND (
      get_user_role(auth.uid()) IN ('admin','gestor','notario','mensajero')
      OR EXISTS (
        SELECT 1 FROM traspasos t
        WHERE t.id::text = (storage.foldername(name))[1]
          AND t.customer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Doc read owner or party" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documentos'
    AND (
      get_user_role(auth.uid()) = 'admin'
      OR EXISTS (
        SELECT 1 FROM traspasos t
        WHERE t.id::text = (storage.foldername(name))[1]
          AND (
            t.customer_id = auth.uid()
            OR t.gestor_id  = auth.uid()
            OR t.notario_id = auth.uid()
            OR t.mensajero_id = auth.uid()
          )
      )
    )
  );
```

**Convención implícita:** los archivos en `documentos` deben subirse bajo el prefijo `{traspaso_id}/...`. Ya lo hacemos en `traspasoService.uploadDocumento` (`${traspasoId}/...`) y en `saveFirma`. Hay que verificar que `MarbeteCapture/Upload` y `CedulaCapture` también respeten esto antes de aplicar la migración (si no, sus uploads dejarán de funcionar).

---

## Plan de pruebas (matriz de simulación)

Una vez aplicada la migración, correré contra la DB (sin tocar UI) un script que:

1. Crea 4 traspasos de prueba con 4 customers distintos, asignando un gestor, notario, mensajero diferentes.
2. Para cada rol (`customer_a`, `customer_b`, `gestor_1`, `notario_1`, `mensajero_1`, `admin`, `anon`), ejecuta vía `set_config('request.jwt.claims', ...)` cada SELECT/UPDATE/INSERT/DELETE relevante sobre cada tabla.
3. Marca PASS/FAIL contra la matriz objetivo de arriba.
4. Te entrego un reporte tabla por tabla.

---

## Banderas para el back-end real

Cuando reemplacen Supabase por la API REST propia, deben replicar:

- **Filtrado por rol en cada endpoint** equivalente a la columna que aquí filtra RLS (`customer_id`, `gestor_id`, `notario_id`, `mensajero_id`).
- **Restricción de status para notario/mensajero** (notario solo entre `contrato_generado` y `contrato_firmado`; mensajero entre `contrato_firmado` y `matricula_recogida`/`matricula_entregada`).
- **Tracking público SOLO por código** sin exponer PII (la vista `traspasos_tracking` es el contrato).
- **Storage de documentos:** path = `{traspaso_id}/...`; lectura limitada a las 4 partes + admin. Subida limitada a customer (su propio traspaso) o staff asignado.
- **Customer puede editar el traspaso solo mientras `status = solicitud_recibida`**.
- **Gestor solo ve perfiles de customers de sus traspasos**, no el directorio completo.
- **`historial_consultas` y `leads`**: solo dueño + admin pueden leer.

---

## Plan de implementación (atómico)

1. **Crear el archivo de migración** con las 8 correcciones de arriba — sola tarea de esta sesión, pido aprobación.
2. Aplicar y correr el linter de Supabase + script de pruebas por rol.
3. Auditar 2 componentes de upload (`MarbeteCapture`, `CedulaCapture`, etc.) para confirmar que respetan el prefijo `{traspaso_id}/`. Fix si no.
4. Refactor del front para que el tracking público lea de `traspasos_tracking` en vez de `traspasos`.

¿Apruebas la migración tal como está, o quieres ajustar alguna política antes de pasarla?
