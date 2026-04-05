

## Plan: Roles de Notario y Mensajero con Gestión desde Admin

### Resumen
Agregar roles `notario` y `mensajero` al sistema. A diferencia del plan anterior, estos roles NO tendrán tabs en el login — se accederán desde el mismo login (tab "Admin" cubre roles administrativos). El admin dashboard tendrá una nueva sección "Equipo" con dropdown para asignar roles. Notario y mensajero tendrán sus propios layouts y dashboards.

### Cambios

**1. Migración de base de datos**
- RLS policies para que `notario` vea traspasos en status `contrato_firmado`/`verificacion_antifraude` y `mensajero` vea traspasos en `matricula_recogida`
- Policies equivalentes en `traspaso_contratos`, `traspaso_firmas`, `traspaso_documentos`, `traspaso_timeline`
- Policies para que notarios/mensajeros puedan hacer UPDATE en traspasos (avanzar status)
- Policy para que admins puedan UPDATE en `profiles` (cambiar roles)

**2. Admin Dashboard — Nueva tab "Equipo"**
- Agregar tab "Equipo" al AdminDashboard con icono Users
- Lista de perfiles con columnas: nombre, email, cédula, rol actual
- Dropdown (Select) por fila para cambiar rol entre: `customer`, `gestor`, `notario`, `mensajero`, `admin`
- Esto reemplaza la necesidad de crear cuentas especiales manualmente en BD

**3. Login — Simplificar**
- Mantener solo 3 tabs: Cliente, Gestor, Admin
- Notarios y mensajeros entran por el tab "Admin" (misma lógica — se redirigen según su rol en `profiles`)
- Renombrar tab "Admin" a "Administrativo" y su descripción a "Notario, Mensajero, Admin"
- Actualizar redirect post-login: notario → `/notario`, mensajero → `/mensajero`

**4. AppLayout — Redirect nuevos roles**
- Agregar redirect: `profile.role === "notario"` → `/notario`
- Agregar redirect: `profile.role === "mensajero"` → `/mensajero`

**5. Notario (4 archivos nuevos)**
- `src/components/notario/NotarioLayout.tsx` — protege role=notario
- `src/components/notario/NotarioBottomNav.tsx` — Queue + Perfil
- `src/pages/notario/NotarioDashboard.tsx` — lista traspasos en status de firma, cards con datos del vehículo y partes
- `src/pages/notario/NotarioTraspasoDetail.tsx` — ver contratos generados, firmas existentes, botón "Certificar y Firmar" con SignaturePad, botón avanzar status

**6. Mensajero (4 archivos nuevos)**
- `src/components/mensajero/MensajeroLayout.tsx` — protege role=mensajero
- `src/components/mensajero/MensajeroBottomNav.tsx` — Entregas + Perfil
- `src/pages/mensajero/MensajeroDashboard.tsx` — lista traspasos en status recogida, muestra placa y dirección
- `src/pages/mensajero/MensajeroTraspasoDetail.tsx` — dirección/contacto vendedor, botón confirmar recogida + upload foto evidencia, botón confirmar entrega y avanzar status

**7. Rutas — App.tsx**
- Agregar `/notario` con NotarioLayout, index=NotarioDashboard, `traspaso/:id`=NotarioTraspasoDetail
- Agregar `/mensajero` con MensajeroLayout, index=MensajeroDashboard, `traspaso/:id`=MensajeroTraspasoDetail

### Archivos a crear
- `src/components/notario/NotarioLayout.tsx`
- `src/components/notario/NotarioBottomNav.tsx`
- `src/pages/notario/NotarioDashboard.tsx`
- `src/pages/notario/NotarioTraspasoDetail.tsx`
- `src/components/mensajero/MensajeroLayout.tsx`
- `src/components/mensajero/MensajeroBottomNav.tsx`
- `src/pages/mensajero/MensajeroDashboard.tsx`
- `src/pages/mensajero/MensajeroTraspasoDetail.tsx`

### Archivos a editar
- `src/App.tsx` — rutas nuevas
- `src/pages/app/Login.tsx` — tab "Administrativo" con redirect por rol
- `src/components/app/AppLayout.tsx` — redirect notario/mensajero
- `src/pages/AdminDashboard.tsx` — tab "Equipo" con dropdown de roles
- Migración SQL — RLS policies

