

# Plan: Flujo por rol (comprador/vendedor) + Cédula con cámara y OCR

## Problema actual
1. En `NuevoTraspaso.tsx` (cliente), se asume que el usuario siempre es el **comprador** (campos pre-llenados con datos del perfil en comprador). Pero el cliente podría ser el vendedor.
2. La cédula se sube como archivo plano sin guía de cámara ni OCR para extraer nombre y número automáticamente.

## 1. Pregunta inicial: "¿Eres comprador o vendedor?"

**Archivo: `src/pages/app/NuevoTraspaso.tsx`**

- Agregar un paso 0 nuevo antes de Vehículo: **"Tu Rol"** con dos botones grandes: "Soy el Vendedor" / "Soy el Comprador"
- Guardar en estado `miRol: "vendedor" | "comprador"`
- Pre-llenar los datos del perfil (`profile.nombre`, `profile.cedula`, `profile.telefono`) en el lado correcto:
  - Si `miRol === "vendedor"` → pre-llenar campos `vendedor_*`
  - Si `miRol === "comprador"` → pre-llenar campos `comprador_*` (comportamiento actual)
- En el paso de documentos, marcar claramente cuáles son "tus" documentos vs los de la contraparte

## 2. Edge function OCR para cédula

**Archivo nuevo: `supabase/functions/ocr-cedula/index.ts`**

- Mismo patrón que `ocr-matricula` y `ocr-marbete`
- Prompt: experto en cédulas dominicanas (frente y reverso)
- Campos a extraer: `nombre_completo`, `cedula` (número), `fecha_nacimiento`, `nacionalidad`, `sexo`, `lado` (frente/reverso)
- Modelo: `google/gemini-2.5-flash`

## 3. Componente de captura de cédula con cámara guiada

**Archivo nuevo: `src/components/app/CedulaCapture.tsx`**

- Reutiliza `DocumentCameraGuide` con aspect ratio de cédula (~1.586, formato ID card)
- Flujo: Botón "Tomar foto de cédula" → cámara con marco → captura → OCR automático → muestra datos extraídos editables
- Props: `onResult({ nombre, cedula, imagen_base64 })`, `label` ("Cédula del Vendedor" / "Cédula del Comprador")
- Los datos extraídos se muestran en una card de confirmación con campos editables (por si el OCR falla parcialmente)
- También guarda la imagen para subirla como documento

## 4. Integrar cédula OCR en los pasos de Vendedor y Comprador

**Archivo: `src/pages/app/NuevoTraspaso.tsx`**

- En Step Vendedor: si NO es mi rol, mostrar `CedulaCapture` con label "Cédula del Vendedor (Frente)" que al capturar auto-llena `vendedor_nombre` y `vendedor_cedula`
- En Step Comprador: igual para el comprador
- Si ES mi rol, los campos ya están pre-llenados desde el perfil
- La foto capturada se agrega automáticamente a `files` para subirla como documento

**Archivo: `src/pages/gestor/GestorNuevoTraspaso.tsx`**

- Aplicar el mismo componente `CedulaCapture` en los pasos de Vendedor y Comprador (el gestor no es ni comprador ni vendedor, así que ambos usan cámara+OCR)

## Detalles técnicos

- 1 edge function nueva (`ocr-cedula`)
- 1 componente nuevo (`CedulaCapture`)
- 2 archivos editados (`NuevoTraspaso.tsx`, `GestorNuevoTraspaso.tsx`)
- No requiere cambios de base de datos
- Usa `DocumentCameraGuide` existente y el mismo patrón de AI Gateway

