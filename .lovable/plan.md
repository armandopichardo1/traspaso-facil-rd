
# Plan: Historial como solicitud + Marbete con guia de camara y OCR

## 1. Historial por placa = solicitud manual (no busqueda instantanea)

El dashboard del cliente actualmente inserta en `historial_consultas` y navega a un detalle. Hay que cambiar el flujo para que sea una **solicitud** que el equipo procesa manualmente.

**Cambios en `src/pages/app/Dashboard.tsx`:**
- Cambiar `handleHistorial` para que al insertar muestre un toast de confirmacion ("Solicitud recibida. Te enviaremos el informe por WhatsApp en menos de 30 minutos") en vez de navegar al detalle
- Cambiar el boton "BUSCAR" por "SOLICITAR INFORME - RD$350"
- Agregar campo de telefono/WhatsApp si el perfil no tiene uno guardado
- Despues del submit, mostrar un estado de confirmacion inline en vez de redirigir

**Cambios en `src/pages/app/Dashboard.tsx` seccion de actividad reciente:**
- Mostrar las consultas pendientes con badge "EN PROCESO" y las completadas con badge "COMPLETADO"

## 2. Marbete: camara con bordes guia + OCR

Ya existe `DocumentCameraGuide` con marco rectangular y crop. Se reutilizara para el marbete con el aspect ratio correcto.

Se creara una nueva edge function `ocr-marbete` similar a `ocr-matricula` pero con prompt para marbete.

### 2a. Crear edge function `supabase/functions/ocr-marbete/index.ts`
- Copia del patron de `ocr-matricula`
- Prompt: "Eres un experto en lectura de marbetes vehiculares de Republica Dominicana. Extrae: numero de placa, fecha de vencimiento, tipo de vehiculo, ano fiscal"
- Tool function `extraer_marbete` con campos: placa, fecha_vencimiento, ano_fiscal, tipo_vehiculo, vigente (boolean)

### 2b. Redisenar `src/components/app/MarbeteUpload.tsx`
- Agregar estado `showCamera` que muestra `DocumentCameraGuide` con aspect ratio ~1.5 (formato tarjeta horizontal del marbete) y label "Coloca el marbete dentro del marco"
- Boton "Tomar Foto" abre la camara con guia de bordes
- Al capturar foto, enviar base64 a la edge function `ocr-marbete`
- Mostrar datos extraidos (placa, vencimiento, vigencia) en una card de resultados debajo de la foto
- Agregar prop `onOcrResult` para pasar los datos al componente padre
- Subir la foto a storage como antes

### 2c. Actualizar `src/pages/app/TraspasoDetail.tsx`
- Pasar callback `onOcrResult` a MarbeteUpload para recibir los datos del OCR
- Mostrar los datos del marbete extraidos en la vista del traspaso

## Detalles tecnicos

- Edge function usa Lovable AI Gateway con `google/gemini-2.5-flash` (mismo patron que ocr-matricula)
- No requiere cambios de base de datos (los datos OCR se muestran en UI, no se guardan en tabla nueva)
- Archivos: 1 nuevo (ocr-marbete), 2 editados (MarbeteUpload, Dashboard), 1 edit menor (TraspasoDetail)
