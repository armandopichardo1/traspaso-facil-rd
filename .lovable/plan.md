

## Plan: Selector Persona Física / Empresa + Guía de Tarjeta con Auto-Crop en Cámara

### Qué se va a construir
1. **Selector de tipo de persona** (física o jurídica) para vendedor y comprador en ambos flujos (gestor y usuario), mostrando campo de Cédula o RNC según corresponda
2. **Guía visual de tarjeta** (overlay rectangular) al momento de capturar la foto de la matrícula/cédula, para que el documento quede dentro del rango
3. **Auto-crop** de la imagen capturada al área de la guía antes de enviarla al OCR
4. **OCR actualizado** para también extraer RNC cuando aplique

### Pasos de implementación

**1. Migración de base de datos**
- Agregar columnas `vendedor_tipo_persona` y `comprador_tipo_persona` (enum: `fisica`, `juridica`) con default `fisica` a la tabla `traspasos`
- Agregar columnas `vendedor_rnc` y `comprador_rnc` (text, nullable) a la tabla `traspasos`

**2. Actualizar edge function `ocr-matricula`**
- Agregar campo `propietario_rnc` al schema de tool calling
- Indicar en el prompt que detecte si el propietario es persona física (cédula) o jurídica (RNC)
- Retornar `tipo_persona` en el resultado (`fisica` o `juridica`)

**3. Crear componente `DocumentCameraGuide`** (nuevo componente reutilizable)
- Overlay con guía rectangular semitransparente (aspect ratio de tarjeta ~1.586:1, estándar CR80)
- Usa `<video>` con `getUserMedia` para vista en vivo de la cámara
- Botón de captura que toma snapshot del `<canvas>`
- **Auto-crop**: recorta la imagen al área exacta del rectángulo guía usando canvas
- Fallback: si no hay acceso a cámara, muestra file input normal con la guía superpuesta en la preview
- Props: `onCapture(base64)`, `aspectRatio`, `label`

**4. Integrar `DocumentCameraGuide` en `MatriculaScanner`**
- Reemplazar el file input básico por el nuevo componente con guía de tarjeta
- La imagen resultante ya viene recortada al área del documento
- Mantener opción de subir desde galería como alternativa

**5. Actualizar formularios de vendedor/comprador** (en `GestorNuevoTraspaso.tsx` y `NuevoTraspaso.tsx`)
- Agregar toggle/selector "Persona Física" / "Empresa" en los pasos de vendedor y comprador
- Si es Persona Física: mostrar campo Cédula (formato XXX-XXXXXXX-X)
- Si es Empresa: mostrar campo RNC (formato X-XX-XXXXX-X)
- El OCR auto-puebla el campo correcto según lo detectado
- Guardar `vendedor_tipo_persona`, `vendedor_rnc`, `comprador_tipo_persona`, `comprador_rnc` al crear el traspaso

**6. Actualizar `MatriculaScanner` y `OcrResult`**
- Agregar `propietario_rnc` y `tipo_persona` al type `OcrResult`
- Mostrar RNC o Cédula según tipo detectado en la vista de resultados
- Al aceptar, poblar el campo correcto en el formulario

### Detalles técnicos
- La guía de tarjeta usa un overlay SVG/CSS con esquinas redondeadas y área oscurecida fuera del rectángulo
- El auto-crop se hace con Canvas API: se calcula la posición del rectángulo guía relativa al video/imagen y se dibuja solo esa porción
- Aspect ratio de la guía: ~1.586 (estándar tarjeta de crédito / cédula dominicana)
- `getUserMedia({ video: { facingMode: "environment" } })` para cámara trasera en móvil
- No se necesitan dependencias nuevas

