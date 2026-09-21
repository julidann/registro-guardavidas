# Registro Guardavidas

MVP para registrar intervenciones de guardavidas y facilitar el resumen diario/mensual.

## Funcionalidades actuales

- Registro de fecha, hora, puesto, bandera, tipo de intervención, lugar, motivo y resolución.
- Cantidad de personas involucradas y observaciones.
- Resumen mensual automático.
- Historial con filtros por mes, tipo y puesto.
- Exportación de los registros filtrados a CSV.
- Datos guardados en `localStorage` para esta primera versión.
- Estructura preparada como PWA básica para poder agregarse a la pantalla de inicio del celular.

## Estructura

```
registro-guardavidas/
├── index.html
├── manifest.json
├── service-worker.js
├── css/
│   └── style.css
└── js/
    └── app.js
```

## Importante

Esta primera versión es un prototipo frontend. Los registros se guardan únicamente en el navegador/dispositivo donde se cargan.

La siguiente etapa será conectar una base de datos y usuarios para centralizar la información de todos los puestos.
