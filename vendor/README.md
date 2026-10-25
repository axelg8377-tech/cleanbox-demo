# Bibliotecas de descarga

Necesarias para PDF y XLSX reales en la demo vanilla. Archivos fijados, servidos desde la misma carpeta que la app y cargados sólo al descargar. Ningún dato se envía a un generador externo.

| Archivo | Versión / licencia | Fuente |
|---|---|---|
| pdf-lib-1.17.1.min.js | pdf-lib 1.17.1, MIT | https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js |
| pdf-lib-LICENSE.md | Licencia original pdf-lib | https://unpkg.com/pdf-lib@1.17.1/LICENSE.md |
| xlsx-0.20.3.min.js | SheetJS CE 0.20.3, Apache 2.0 | https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js |
| SheetJS-LICENSE.txt | Licencia original SheetJS CE | https://cdn.sheetjs.com/xlsx-0.20.3/package/LICENSE |

Consultadas con Moli el 25/10/2026: [documentación oficial pdf-lib](https://pdf-lib.js.org/), [instalación standalone SheetJS](https://docs.sheetjs.com/docs/getting-started/installation/standalone/) y [exportación SheetJS](https://docs.sheetjs.com/docs/getting-started/examples/export/). Se descargaron los artefactos fijados mediante Invoke-WebRequest. No se incorpora gestor de paquetes ni se cambia el stack.

Estos archivos ajenos no se modifican ni se incluyen en slop_check de código propio.
