

# Plan: Redisenar las pantallas principales basado en los mockups de Stitch

Analice las 10 capturas de pantalla y las compare con las paginas actuales. Aqui esta el plan de mejoras concretas por modulo:

## 1. Dashboard del Cliente (`src/pages/app/Dashboard.tsx`)
**Referencia: screen.png (imagen 1)**

Cambios:
- Agregar saludo con emoji de mano ("Hola, Juan") y subtitulo "Tu gestion vehicular a maxima velocidad"
- Reemplazar las 3 stat cards por una barra de busqueda de historial por placa con boton "BUSCAR" prominente
- Redisenar la card de traspaso activo: mostrar vehiculo grande (marca, modelo, ano), badge de status con emoji check, barra de progreso segmentada con labels (SOLICITUD, REVISION, PAGO, DGII, FINAL) y porcentaje
- Agregar boton CTA grande naranja "CONTINUAR TRASPASO" dentro de la card activa
- Agregar card oscura "Iniciar Nuevo Traspaso" con subtitulo "Completa tu tramite en minutos"
- Seccion "ACTIVIDAD RECIENTE - Reportes e Historial" con link "Ver todo" y cards horizontales por vehiculo con placa y badge de estado (COMPLETADO/CANCELADO)

## 2. Panel Gestor/Dealer (`src/pages/gestor/GestorDashboard.tsx`)
**Referencia: screen-2.png (imagen 2)**

Cambios:
- Redisenar para desktop: header con "Panel de Control" y boton "+ Nuevo Traspaso" a la derecha
- 4 stat cards en fila: Traspasos Activos (con badge % vs mes ant), Completados Mes, Tiempo Promedio, Gastado Mes
- Tabla de traspasos recientes con columnas: Vehiculo (con icono), Placa, Cliente, Estatus (badge color), Accion
- Sidebar derecha con card "Informes de Historial" (verificar estatus legal) con CTA "Solicitar Acceso"
- Badge "Dealer Verificado" con descripcion de acceso prioritario

## 3. Vista de Escrow (`src/pages/app/EscrowView.tsx`)
**Referencia: screen-3.png (imagen 3)**

Cambios:
- Header "Tu dinero esta seguro." con subtitulo sobre custodia
- Anillo de progreso mas grande con icono de candado y animacion
- Badge "EN CUSTODIA - PENDIENTE DE TRASPASO" debajo del anillo
- Monto grande centrado (RD$850,000) con "Pago del vehiculo"
- Badge "VERIFICADO POR TRASPASA.DO"
- Timeline vertical con 4 pasos: Comprador deposito, Fondos verificados, Traspaso en proceso, Liberacion al vendedor
- Info box azul explicando que los fondos se liberan con codigo QR
- Seccion "ESCANEA AL RECIBIR EL VEHICULO" con placeholder de QR code
- Boton rojo "Necesito ayuda con mi pago"

## 4. Firma Digital de Contrato (mejorar `NotarioTraspasoDetail.tsx` y crear nueva vista)
**Referencia: screen-4.png y screen-5.png (imagenes 4-5)**

Cambios:
- Crear vista de firma stepped: Paso 1 "Identidad Verificada" (con badge biometria), Paso 2 "Revision del documento" (preview del contrato con texto real), Paso 3 "Finalizar Firma"
- Boton "Firmar con un toque" naranja grande en lugar del signature pad canvas
- Nota legal "Firma digital legal bajo Ley 126-02"
- Bottom nav con tabs "Revisar" y "Firmar"

## 5. Landing Page (`src/components/HeroSection.tsx`)
**Referencia: screen-6.png (imagen 6)**

Cambios:
- Redisenar hero: titulo "Tu traspaso vehicular en 24 horas. Sin filas. Sin estres." con "en 24 horas" resaltado en naranja
- Agregar imagen de vehiculo a la derecha del hero
- Badge "Proceso Verificado - Avalado por el Colegio de Abogados"
- Trust bar con iconos: Sistema Antifraude, Pago con Escrow, Firma Digital Legal, Soporte 24/7
- Dos cards de producto lado a lado: "Historial Vehicular RD$350" y "Traspaso Completo Desde RD$3,500"

## 6. Historial Vehicular Detalle (`src/pages/app/HistorialDetail.tsx`)
**Referencia: screen-10.png (imagen 10)**

Cambios:
- Agregar header con imagen placeholder del vehiculo con placa superpuesta
- Nombre del vehiculo grande con badge "Verificado por TRASPASA.DO"
- Secciones tipo card expandible: Datos del Vehiculo (grid), Oposiciones y Alertas (card roja si hay alertas), Historial de Propietarios (con avatares), Valor DGII (con valor de mercado e impuesto), Estado del Marbete (badge vigente/vencido), Multas Pendientes
- Boton "Compartir este informe"
- CTA final "Todo bien? Inicia el traspaso ahora" (ya existe, mejorar estilo)

## 7. Tracking/Seguimiento Mejorado (`src/pages/app/TraspasoDetail.tsx`)
**Referencia: screen-9.png (imagen 9)**

Cambios:
- Header card con "Tu proceso esta en marcha" + vehiculo + barra de progreso con porcentaje
- Badge "VERIFICADO POR TRASPASA.DO"
- Timeline vertical mejorada con mas detalle por paso: fecha/hora, nombre del gestor, badges (FIRMA DIGITAL OK, FONDOS EN CUSTODIA)
- En paso de matricula recogida: placeholder de mapa con ubicacion
- Link "Rastrear pago en custodia (Escrow)" en el paso de Plan Piloto
- Card "Necesitas ayuda? Habla con tu asesor por WhatsApp"

## 8. Pagina de Exito Post-Firma (NUEVA: `src/pages/app/TraspasoFirmado.tsx`)
**Referencia: screen-8.png (imagen 8)**

Crear nueva pagina:
- Icono check grande con animacion
- Titulo "Contrato Firmado Exitosamente!"
- Subtitulo sobre Ley 126-02
- Card con detalles: Documento, Vehiculo, Placa, Fecha, ID de Firma
- Badge "VERIFICADO POR TRASPASA.DO"
- Boton "Ver Progreso del Traspaso"
- Link "Ir al Inicio"
- Agregar ruta `/app/traspaso/:id/firmado` en App.tsx

## Detalles tecnicos

- Todos los cambios son en componentes React/TypeScript con Tailwind CSS
- Se usa framer-motion para animaciones (ya instalado)
- No requiere cambios de base de datos ni migraciones
- No requiere nuevas dependencias
- Se mantiene el sistema de colores existente (navy, teal, orange/CTA)
- Estimado: 8 archivos modificados + 1 archivo nuevo

