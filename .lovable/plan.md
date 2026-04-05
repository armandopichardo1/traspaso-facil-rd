

## Diagnóstico y Plan

### Pantalla en blanco
No hay errores de build ni de runtime en los logs del servidor. El código de `App.tsx`, `Index.tsx` y todos los componentes se ven correctos. Esto es probablemente un problema transitorio del preview (HMR). El plan incluye un cambio menor en `App.tsx` para forzar un refresh limpio (agregar un key al componente raíz o reorganizar imports).

### Pantalla de login unificada para diferentes usuarios
Actualmente hay dos pantallas de login separadas (`/app/login` para clientes/gestores y `/admin/login` para admins). El plan es crear una sola pantalla de login mejorada que maneje los tres roles.

---

### Cambios a implementar

**1. Unificar login en `/app/login`** (editar `src/pages/app/Login.tsx`)
- Rediseñar con tabs o selector visual para: Cliente, Gestor, Admin
- Mantener el formulario de email/password compartido
- Después del login, la redirección por rol ya funciona correctamente
- Agregar opción de "Crear Cuenta" solo para el tab de Cliente (gestores y admins son creados por admin)

**2. Actualizar `/admin/login`** (editar `src/pages/AdminLogin.tsx`)
- Redirigir a `/app/login` o eliminar esta ruta y hacer que `/admin/login` simplemente use `<Navigate to="/app/login" />`

**3. Arreglar pantalla en blanco** (editar `src/App.tsx`)
- Eliminar el import no usado de `useNavigate` en `AuthContext.tsx`
- Asegurar que el componente raíz renderice correctamente forzando un re-render limpio

**4. Actualizar Navbar** (editar `src/components/Navbar.tsx`)
- Unificar el botón de "Iniciar Sesión" para apuntar a `/app/login`

### Detalles técnicos
- La redirección post-login por rol (`cliente` → `/app`, `gestor` → `/gestor`, `admin` → `/admin`) ya está implementada en `Login.tsx`
- La tabla `profiles` tiene campo `role` con valores: `cliente`, `gestor`, `admin`
- No se necesitan cambios de base de datos

