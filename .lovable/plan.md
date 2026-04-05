

## Plan: Escaneo OCR de Matrícula con Auto-Poblado de Formulario

### Qué se va a construir
Un nuevo paso inicial en el flujo de "Nuevo Traspaso" del gestor donde puede tomar una foto o subir imagen de la matrícula del vehículo. El sistema usa inteligencia artificial para leer el documento y extraer automáticamente: marca, modelo, año, placa, color, y nombre del propietario. Los campos se auto-rellenan en el formulario.

### Pasos de implementación

**1. Crear edge function `ocr-matricula`** (`supabase/functions/ocr-matricula/index.ts`)
- Recibe imagen en base64 desde el frontend
- Usa Lovable AI (modelo `google/gemini-2.5-flash` con capacidad de imagen) para extraer campos estructurados de la matrícula
- Usa tool calling para obtener JSON estructurado con: marca, modelo, año, placa, color, propietario_nombre, propietario_cedula
- Retorna los campos extraídos al frontend

**2. Agregar paso "Escanear Matrícula" al formulario del gestor** (editar `src/pages/gestor/GestorNuevoTraspaso.tsx`)
- Nuevo paso 0: "Matrícula" con icono de cámara/escáner
- UI: zona de captura de foto (cámara o galería) con preview de imagen
- Botón "Escanear con IA" que envía la imagen al edge function
- Muestra los campos detectados con indicador de confianza
- Botón para aceptar y auto-rellenar o editar manualmente
- Los pasos actuales se recorren (Vehículo pasa a ser paso 1, etc.)

**3. Auto-poblado del formulario**
- Al aceptar el escaneo, los campos `vehiculo_marca`, `vehiculo_modelo`, `vehiculo_ano`, `vehiculo_placa`, `vehiculo_color`, `vendedor_nombre`, `vendedor_cedula` se llenan automáticamente
- El gestor puede editar cualquier campo antes de continuar
- Opción de saltar el escaneo e ingresar datos manualmente

### Detalles técnicos
- El edge function usa `google/gemini-2.5-flash` (soporta imágenes) con tool calling para extraer datos estructurados
- La imagen se convierte a base64 en el frontend antes de enviarla
- Se acepta captura desde cámara (`capture="environment"`) para uso móvil
- No se requieren cambios de base de datos

