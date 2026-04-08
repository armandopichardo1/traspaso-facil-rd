

# Plan: Reemplazar placeholder del hero con imagen generada por AI

## Situacion actual
El lado derecho del hero muestra un placeholder gris con un icono de Search y el texto "TRASPASA.DO". No tiene ninguna imagen real.

## Solucion

### Paso 1 — Generar imagen con AI
Usar el modelo `google/gemini-3-pro-image-preview` (mejor calidad) via Edge Function para generar una ilustracion profesional que represente el concepto de traspaso vehicular digital en Republica Dominicana. Prompt orientado a:
- Persona sonriente con llaves de carro y documentos digitales en un telefono
- Estilo moderno, limpio, colores teal/navy que combinen con la marca
- Fondo abstracto o gradiente suave

### Paso 2 — Guardar imagen en storage
Subir la imagen generada al bucket de storage y obtener URL publica.

### Paso 3 — Actualizar HeroSection.tsx
Reemplazar el bloque placeholder (lineas 60-69) con un `<img>` que apunte a la imagen en storage, manteniendo el `aspect-[4/3]`, `rounded-2xl` y `overflow-hidden`.

## Detalles tecnicos
- 1 Edge Function temporal o script para generar la imagen
- 1 archivo editado: `src/components/HeroSection.tsx`
- La imagen se sirve desde storage con URL publica (no base64 inline)

