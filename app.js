/* CLEANBOX — demo clickeable. Datos ficticios guardados sólo en este navegador.
   Sin servidor, sin ARCA real: las facturas son de muestra.
   Los permisos de esta demo son visuales; en el sistema real los valida el servidor. */
(function () {
  'use strict';

  // ── Estado de la demo ──────────────────────────────────────────────
  var KEY = 'cleanbox-demo-v1';
  var HOY = '2026-10-24'; // fecha de los datos de ejemplo
  var NO_OCULTABLES = ['pedidos', 'venta', 'remitos', 'caja', 'ajustes'];
  var SOLO_DUENO = ['facturar', 'precios', 'ajustes'];

  var SEED = {
    usuario: 'hernan',
    ocultos: [],
    negocio: { nombre: 'CLEANBOX Tintorería', telefono: '+54 9 261 555-0199', direccion: 'Av. San Martín 1234, Mendoza',
      pie: 'Por favor retire sus prendas dentro de los 30 días con este comprobante.', duplicado: true, logo: '' },
    clientes: [
      { id: 'c1', tipo: 'empresa', nombre: 'Bodega Piedra Alta', cuit: '30-71111111-1', ultimo: '24/10', ultimoNro: '#214' },
      { id: 'c2', tipo: 'empresa', nombre: 'Bodega Cerro Negro', cuit: '30-71234567-8', ultimo: '24/10', ultimoNro: '#205' },
      { id: 'c3', tipo: 'empresa', nombre: 'Finca Los Olivos', cuit: '30-70999888-2', ultimo: '23/10', ultimoNro: '#209' },
      { id: 'c4', tipo: 'empresa', nombre: 'Hotel Cordillera', cuit: '30-71555444-0', ultimo: '22/10', ultimoNro: '#212' },
      { id: 'c5', tipo: 'particular', nombre: 'Lucía Ferreyra', tel: '261 555-0142', ultimo: '24/10', ultimoNro: '#213' },
      { id: 'c6', tipo: 'particular', nombre: 'Martín Gómez', tel: '261 555-0177', ultimo: '22/10', ultimoNro: '#208' },
      { id: 'c7', tipo: 'particular', nombre: 'Carla Sosa', tel: '261 555-0193', ultimo: '21/10', ultimoNro: '#204' }
    ],
    pedidos: [
      { n: 214, cliente: 'Bodega Piedra Alta', detalle: '6 bolsas', entrega: '2026-11-07', estado: 'recibido', hora: '09:15' },
      { n: 213, cliente: 'Lucía Ferreyra', detalle: '3 prendas', entrega: '2026-11-08', estado: 'recibido', hora: '10:30' },
      { n: 212, cliente: 'Hotel Cordillera', detalle: '4 bolsas', entrega: '2026-10-25', estado: 'recibido', hora: '11:00' },
      { n: 209, cliente: 'Finca Los Olivos', detalle: '8 bolsas', entrega: '2026-10-25', estado: 'preparacion', hora: '08:40' },
      { n: 208, cliente: 'Martín Gómez', detalle: '1 traje', entrega: '2026-10-25', estado: 'preparacion', hora: '09:05' },
      { n: 205, cliente: 'Bodega Cerro Negro', detalle: '5 bolsas', nota: 'Planchado institucional', entrega: '2026-10-24', estado: 'listo', hora: '08:10' },
      { n: 204, cliente: 'Carla Sosa', detalle: '2 acolchados', nota: 'Lavado delicado pluma', entrega: '2026-10-24', estado: 'listo', hora: '08:30' }
    ],
    ventas: [],      // ventas nuevas hechas en la demo
    facturas: {},    // remito -> número de factura
    sigTicket: 418, sigRemito: 232, sigPedido: 215, sigFactura: 413
  };

  SEED.pedidos.forEach(function (p, i) { p.iso = i < 3 ? HOY : '2026-10-23'; });
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.clientes) return s; } catch (e) {}
    return JSON.parse(JSON.stringify(SEED));
  }
  var S = load();
  // Lista de precios compartida por Precios, Nueva venta y Presupuestos
  if (!S.precios) S.precios = [
    ['Camisa', 2500, true, 'checkroom'], ['Pantalón', 3000, true, 'straighten'], ['Traje', 9500, true, 'dry_cleaning'],
    ['Saco', 5000, true, 'checkroom'], ['Ambo', 5500, true, 'dry_cleaning'], ['Acolchado 2 plazas', 12000, true, 'bed'],
    ['Mantel', 4000, true, 'table_restaurant'], ['Bolsa de lavado institucional', 6500, true, 'shopping_bag'],
    ['Sábana 2 plazas', 3000, false, 'layers'], ['Toalla', 1200, false, 'texture'], ['Vestido de fiesta', 8500, false, 'apparel']
  ].map(function (p) { return { nombre: p[0], precio: p[1], rapida: p[2], icono: p[3] }; });
  function precioDe(nombre) { var p = S.precios.filter(function (x) { return x.nombre === nombre; })[0]; return p ? p.precio : 0; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); return true; } catch (e) { return false; } }

  // ── Utilidades ─────────────────────────────────────────────────────
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plata(n) { return '$' + Math.round(n).toLocaleString('es-AR'); }
  function aNum(t) { return Number(String(t).replace(/[^\d-]/g, '')) || 0; }
  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, ''); }
  function soloDig(t) { return String(t || '').replace(/\D/g, ''); }
  function importeValido(n) { return Number.isSafeInteger(n) && n >= 0; }
  function clienteUnico(nombre) { var lista = S.clientes.filter(function (c) { return c.nombre === nombre; }); return lista.length === 1 ? lista[0] : null; }
  function clienteRegistro(r) { return r.clienteId ? S.clientes.filter(function (c) { return c.id === r.clienteId; })[0] : clienteUnico(r.cliente); }
  function byText(sel, txt, root) { return $$(sel, root).filter(function (el) { return el.textContent.trim().indexOf(txt) === 0; }); }
  function d(iso) { var p = iso.split('-'); return new Date(+p[0], p[1] - 1, +p[2]); }
  function addDias(iso, n) { var x = d(iso); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); }
  var DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  function entregaTxt(iso) {
    if (iso === HOY) return 'Entrega hoy';
    if (iso === addDias(HOY, 1)) return 'Entrega mañana';
    var x = d(iso); return 'Entrega ' + DIAS[x.getDay()] + ' ' + x.getDate() + '/' + (x.getMonth() + 1);
  }
  function fechaCorta(iso) { var x = d(iso); return ('0' + x.getDate()).slice(-2) + '/' + ('0' + (x.getMonth() + 1)).slice(-2); }
  function ahora() { var x = new Date(); return ('0' + x.getHours()).slice(-2) + ':' + ('0' + x.getMinutes()).slice(-2); }
  function clientePorNombre(n) { return S.clientes.filter(function (c) { return c.nombre === n; })[0]; }

  function toast(msg, tipo) {
    $$('[data-toast]').forEach(function (x) { x.remove(); });
    var t = document.createElement('div');
    t.setAttribute('data-toast', '');
    t.setAttribute('role', 'status');
    t.className = 'fixed bottom-6 right-6 z-[60] pointer-events-none px-space-md py-space-sm rounded-lg border font-label-md text-label-md flex items-center gap-2 ' +
      (tipo === 'error' ? 'bg-error-container text-on-error-container border-error' : 'bg-surface text-on-surface border-primary');
    t.innerHTML = '<span class="material-symbols-outlined text-[18px] ' + (tipo === 'error' ? 'text-error' : 'text-primary') + '">' +
      (tipo === 'error' ? 'error' : 'check_circle') + '</span><span>' + esc(msg) + '</span>';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  // Ventana modal con clases del sistema de Stitch
  function modal(titulo, cuerpo, botones) {
    var fondo = document.createElement('div'), focoAnterior = document.activeElement;
    fondo.setAttribute('data-modal', ''); fondo.setAttribute('role', 'dialog'); fondo.setAttribute('aria-modal', 'true'); fondo.setAttribute('aria-label', titulo);
    fondo.className = 'fixed inset-0 z-50 bg-inverse-surface/40 flex items-center justify-center p-space-md';
    fondo.innerHTML = '<div class="w-full max-w-[480px] bg-surface-container-lowest border border-outline rounded-lg flex flex-col max-h-[90vh]">' +
      '<div class="p-space-md border-b border-outline flex items-center justify-between"><h2 class="font-headline-md text-headline-md font-bold text-on-surface">' + esc(titulo) + '</h2>' +
      '<button type="button" data-cerrar class="w-8 h-8 rounded hover:bg-surface-container flex items-center justify-center text-on-surface-variant" title="Cerrar"><span class="material-symbols-outlined text-[20px]">close</span></button></div>' +
      '<div class="p-space-md overflow-y-auto flex flex-col gap-4" data-cuerpo></div>' +
      '<div class="p-space-md border-t border-outline bg-surface flex items-center gap-space-sm" data-pie></div></div>';
    $('[data-cuerpo]', fondo).appendChild(cuerpo);
    $$('table', cuerpo).forEach(function (t) { t.setAttribute('data-cb-tabla', ''); });
    (botones || []).forEach(function (b) {
      var el = document.createElement('button');
      el.type = 'button';
      el.dataset.cbAccion = b.primario ? 'principal' : /^(Cerrar|Cancelar)$/.test(b.texto) ? 'terciaria' : 'secundaria';
      el.className = b.primario
        ? 'flex-1 bg-primary text-on-primary rounded py-2 px-space-md font-label-md text-label-md flex items-center justify-center gap-1.5 hover:bg-primary-container active:scale-[0.98] transition-colors'
        : 'px-space-md py-2 text-on-surface-variant hover:text-on-surface border border-outline rounded font-label-md text-label-md hover:bg-surface-container transition-colors';
      el.textContent = b.texto;
      el.addEventListener('click', function () { if (b.accion() !== false) cerrar(); });
      $('[data-pie]', fondo).appendChild(el);
    });
    function cerrar() { fondo.remove(); document.removeEventListener('keydown', onKey); if (focoAnterior && focoAnterior.isConnected) focoAnterior.focus(); }
    fondo.cerrar = cerrar;
    function onKey(e) {
      if ($$('[data-modal]').pop() !== fondo) return;
      if (e.key === 'Escape') { e.stopImmediatePropagation(); cerrar(); }
      if (e.key === 'Tab') {
        var focos = $$('input,select,textarea,button,a[href]', fondo).filter(function (el) { return !el.disabled && el.getClientRects().length; });
        var primero = focos[0], ultimo = focos[focos.length - 1];
        if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
      }
    }
    $('[data-cerrar]', fondo).addEventListener('click', cerrar);
    fondo.addEventListener('click', function (e) { if (e.target === fondo) cerrar(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(fondo);
    var f = $('input', fondo); if (f) f.focus();
    return fondo;
  }

  var INPUT = 'w-full px-3 py-2 bg-background border border-outline rounded text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary';
  var LABEL = 'block text-xs font-label-md text-on-surface mb-1';
  function campo(label, html) { return '<div><label class="' + LABEL + '">' + label + '</label>' + html + '</div>'; }

  // Remitos ficticios compartidos por Caja, Remitos y Empresas. No se agregan al guardar ni al recargar.
  // "Cuenta empresa" (pedido del cliente, 25/10): el remito se emite e imprime, pero no entra en caja,
  // no genera deuda ni pagos. El dueño junta las cantidades del mes y factura desde Empresas.
  function remitoEmpresa(remito, iso, hora, clienteId, cliente, items, extra) {
    var r = { remito: remito, ticket: 'T-' + remito.slice(2), iso: iso, hora: hora, clienteId: clienteId, cliente: cliente, tipo: 'empresa',
      items: items.map(function (it) { return { nombre: it[0], cant: it[1], precio: it[2] }; }), pagos: [], medio: 'Empresa', cuentaEmpresa: true };
    r.total = r.items.reduce(function (n, it) { return n + it.cant * it.precio; }, 0);
    Object.keys(extra || {}).forEach(function (k) { r[k] = extra[k]; });
    return r;
  }
  var EJEMPLOS = [
    remitoEmpresa('R-0198', '2026-09-26', '09:10', 'c1', 'Bodega Piedra Alta', [['Mantel', 11, 4000], ['Servilleta', 70, 600]]),
    remitoEmpresa('R-0201', '2026-10-02', '09:30', 'c1', 'Bodega Piedra Alta', [['Mantel', 12, 4000], ['Servilleta', 80, 600]]),
    remitoEmpresa('R-0204', '2026-10-06', '10:15', 'c2', 'Bodega Cerro Negro', [['Mantel', 8, 4000], ['Servilleta', 50, 600], ['Trapo de cocina', 20, 500]]),
    remitoEmpresa('R-0207', '2026-10-09', '08:50', 'c1', 'Bodega Piedra Alta', [['Mantel', 10, 4000], ['Servilleta', 60, 600], ['Trapo de cocina', 15, 500]]),
    remitoEmpresa('R-0212', '2026-10-14', '11:20', 'c3', 'Finca Los Olivos', [['Bolsa de lavado institucional', 4, 6500], ['Mantel', 6, 4000]]),
    remitoEmpresa('R-0215', '2026-10-16', '09:05', 'c1', 'Bodega Piedra Alta', [['Mantel', 14, 4000], ['Servilleta', 90, 600], ['Trapo de cocina', 25, 500]], { observaciones: 'Dos manteles con manchas de vino.' }),
    remitoEmpresa('R-0219', '2026-10-21', '10:40', 'c2', 'Bodega Cerro Negro', [['Mantel', 9, 0], ['Servilleta', 40, 0]], { sinPrecios: true }),
    remitoEmpresa('R-0228', '2026-10-23', '10:05', 'c2', 'Bodega Cerro Negro', [['Camisa', 6, 2500], ['Pantalón', 2, 3000]], { observaciones: 'Una camisa con mancha en el cuello.' }),
    remitoEmpresa('R-0229', HOY, '09:20', 'c1', 'Bodega Piedra Alta', [['Bolsa de lavado institucional', 6, 6500]]),
    { remito: 'R-0230', ticket: 'T-0416', iso: HOY, hora: '09:45', cliente: 'Lucía Ferreyra', tipo: 'particular',
      items: [{ nombre: 'Camisa', cant: 2, precio: 2500 }], total: 5000, pagos: [{ iso: HOY, hora: '09:45', medio: 'Efectivo', importe: 2000 }] },
    // Empresa que pagó en el mostrador: venta normal, entra en caja.
    { remito: 'R-0231', ticket: 'T-0417', iso: HOY, hora: '10:00', cliente: 'Hotel Cordillera', tipo: 'empresa',
      items: [{ nombre: 'Mantel', cant: 10, precio: 4000 }], total: 40000, pagos: [{ iso: HOY, hora: '10:00', medio: 'Transferencia', importe: 40000 }] }
  ];
  var FACTURAS_EJEMPLO = [{ numero: 'A 0003-00000412', tipo: 'A', clienteId: 'c4', cliente: 'Hotel Cordillera', cuit: '30-71555444-0', iso: HOY, hora: '10:20',
    renglones: [{ nombre: 'Mantel', cant: 10, precio: 4000 }], observaciones: 'Corresponde a remito R-0231.', oc: '', periodo: '', remitos: ['R-0231'], total: 40000 }];
  var DATOS = 2; // versión de los datos de ejemplo
  if (!S.remitosEjemplo) S.remitosEjemplo = JSON.parse(JSON.stringify(EJEMPLOS));
  if (S.datos !== DATOS) {
    // Quien ya abrió la demo conserva lo que cargó; se suman los ejemplos nuevos y se pasan a
    // cuenta empresa los remitos de empresa que quedaron "Debe" sin ningún pago.
    EJEMPLOS.forEach(function (e) {
      var x = S.remitosEjemplo.filter(function (r) { return r.remito === e.remito; })[0];
      if (!x) S.remitosEjemplo.push(JSON.parse(JSON.stringify(e)));
      else if (e.cuentaEmpresa && !pagos(x).length) { x.cuentaEmpresa = true; x.medio = 'Empresa'; x.clienteId = x.clienteId || e.clienteId; }
    });
    S.remitosEjemplo.sort(function (a, b) { return a.remito < b.remito ? -1 : 1; });
    S.ventas.forEach(function (v) { if (v.tipo === 'empresa' && Array.isArray(v.pagos) && !v.pagos.length) { v.cuentaEmpresa = true; v.medio = 'Empresa'; } });
    [['Servilleta', 600, true, 'dinner_dining'], ['Trapo de cocina', 500, false, 'texture']].forEach(function (p) {
      if (!S.precios.some(function (x) { return norm(x.nombre) === norm(p[0]); })) S.precios.push({ nombre: p[0], precio: p[1], rapida: p[2], icono: p[3] });
    });
    if (!S.facturasEmitidas) S.facturasEmitidas = JSON.parse(JSON.stringify(FACTURAS_EJEMPLO));
    if (!S.sigFacturaB) S.sigFacturaB = 128;
    S.datos = DATOS; save();
  }
  function ventas() { return S.remitosEjemplo.concat(S.ventas); }
  function pagos(v) {
    // Compatibilidad: un arreglo vacío es deuda; sólo ventas antiguas sin campo eran cobros completos.
    return Array.isArray(v.pagos) ? v.pagos : (['Efectivo', 'Transferencia', 'Mercado Pago'].indexOf(v.medio) >= 0
      ? [{ iso: v.iso, hora: v.hora, medio: v.medio, importe: v.total }] : []);
  }
  function cobrado(v) { return pagos(v).reduce(function (n, p) { return n + p.importe; }, 0); }
  function saldo(v) { return v.cuentaEmpresa ? 0 : Math.max(0, v.total - cobrado(v)); }
  function estadoCobro(v) { return v.cuentaEmpresa ? 'Cuenta empresa' : saldo(v) === 0 ? 'Pagado' : cobrado(v) ? 'Pago parcial' : 'Debe / cuenta corriente'; }
  function esDueno() { return S.usuario === 'hernan'; }
  function detalleVenta(v) { return v.items ? v.items.map(function (it) { return it.cant + ' ' + it.nombre; }).join(' + ') : v.detalle || ''; }
  function ventaPedido(p) { return p && ventas().filter(function (v) { return v.pedido === '#' + p.n; })[0]; }
  function fechaValida(iso) { return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !isNaN(d(iso).getTime()) && fechaCorta(iso) === iso.slice(8, 10) + '/' + iso.slice(5, 7); }
  var BTN = 'px-3 py-2 border border-outline rounded text-primary font-label-md text-[13px] hover:bg-surface-container focus:outline-primary';
  var MEDIOS = ['Efectivo', 'Transferencia', 'Mercado Pago'];

  function marcarImporte(el, tipo) { if (el) el.dataset.cbImporte = tipo || 'total'; }
  function resumenImportes(total, pagado, pendiente) {
    return '<div data-cb-resumen><div><span>Total</span><strong data-cb-importe="total">' + plata(total) + '</strong></div>' +
      '<div><span>Pagado</span><strong data-cb-importe="pagado">' + plata(pagado) + '</strong></div>' +
      '<div data-cb-estado="' + (pendiente ? 'pendiente' : 'pagado') + '"><span>Saldo pendiente</span><strong data-cb-importe="saldo">' + plata(pendiente) + '</strong></div></div>';
  }

  // Filtros acumulables. El importe siempre corresponde al remito completo.
  function filtrosRemitos(contenedor, desde, hasta, cambiar) {
    var box = document.createElement('div'); box.className = 'flex flex-col gap-2';
    box.innerHTML = '<div class="flex flex-wrap items-end gap-2">' +
      campo('Período', '<select data-periodo aria-label="Período" class="' + INPUT + '"><option value="manual">Elegir fechas</option><option value="dia">Hoy</option><option value="semana">Esta semana</option><option value="mes">Este mes</option><option value="todas">Todas las fechas</option></select>') +
      campo('Artículo', '<input data-articulo aria-label="Filtrar artículo" placeholder="Todos los artículos" class="' + INPUT + '">') +
      campo('Total del remito desde ($)', '<input data-minimo aria-label="Importe mínimo" type="number" min="0" step="1" placeholder="Sin mínimo" class="' + INPUT + '">') +
      campo('Hasta ($)', '<input data-maximo aria-label="Importe máximo" type="number" min="0" step="1" placeholder="Sin máximo" class="' + INPUT + '">') + '</div>' +
      '<p class="text-xs text-on-surface-variant">Fecha del remito. Importes desde y hasta inclusive.</p><div data-filtros-activos class="flex flex-wrap gap-2"></div><p data-unidades role="status" class="text-sm text-on-surface"></p>';
    contenedor.appendChild(box);
    var articulo = $('[data-articulo]', box), min = $('[data-minimo]', box), max = $('[data-maximo]', box), periodo = $('[data-periodo]', box);
    function invalido() {
      if ((desde.value && !fechaValida(desde.value)) || (hasta.value && !fechaValida(hasta.value)) || (desde.value && hasta.value && desde.value > hasta.value)) return 'Revisá el rango de fechas';
      if ([min, max].some(function (i) { return i.value !== '' && (!i.checkValidity() || !importeValido(Number(i.value))); })) return 'Los importes deben ser pesos enteros, desde cero';
      return min.value !== '' && max.value !== '' && Number(min.value) > Number(max.value) ? 'El importe mínimo no puede superar el máximo' : '';
    }
    function coincide(v) {
      return (!articulo.value.trim() || (v.items || []).some(function (it) { return norm(it.nombre).indexOf(norm(articulo.value)) >= 0; })) &&
        (min.value === '' || v.total >= Number(min.value)) && (max.value === '' || v.total <= Number(max.value));
    }
    function resumen(lista) {
      var error = invalido(), grupos = {}, vistos = {}, sinDetalle = 0;
      lista.forEach(function (v) {
        if (vistos[v.remito]) return; vistos[v.remito] = true;
        if (!v.items) sinDetalle++;
        (v.items || []).forEach(function (it) {
          if (articulo.value.trim() && norm(it.nombre).indexOf(norm(articulo.value)) < 0) return;
          var k = norm(it.nombre); if (!grupos[k]) grupos[k] = { nombre: it.nombre, cantidad: 0 };
          grupos[k].cantidad += it.cant;
        });
      });
      $('[data-unidades]', box).textContent = error || (Object.keys(grupos).length ? 'Cantidades: ' + Object.keys(grupos).map(function (k) { return grupos[k].nombre + ': ' + grupos[k].cantidad; }).join(' · ') : 'Sin artículos con estos filtros.') + (sinDetalle ? ' · ' + sinDetalle + ' remitos sin detalle de artículos' : '');
      var activos = $('[data-filtros-activos]', box); activos.innerHTML = '';
      [[articulo, 'Artículo: '], [min, 'Desde $'], [max, 'Hasta $']].forEach(function (par) {
        if (!par[0].value) return;
        var b = document.createElement('button'); b.type = 'button'; b.className = BTN; b.textContent = par[1] + par[0].value + ' ×'; b.setAttribute('aria-label', 'Quitar ' + par[1].replace(/[:$]/g, '').trim());
        b.addEventListener('click', function () { par[0].value = ''; cambiar(); par[0].focus(); }); activos.appendChild(b);
      });
    }
    [articulo, min, max].forEach(function (i) { i.addEventListener('input', cambiar); });
    [desde, hasta].forEach(function (i) { i.setAttribute('aria-label', i === desde ? 'Desde fecha' : 'Hasta fecha'); i.addEventListener('input', function () { periodo.value = 'manual'; }); });
    periodo.addEventListener('change', function () {
      var inicio = HOY, fin = HOY;
      if (periodo.value === 'semana') { inicio = addDias(HOY, -((d(HOY).getDay() + 6) % 7)); fin = addDias(inicio, 6); }
      if (periodo.value === 'mes') { inicio = HOY.slice(0, 7) + '-01'; var siguiente = d(inicio); siguiente.setMonth(siguiente.getMonth() + 1); fin = addDias(siguiente.getFullYear() + '-' + ('0' + (siguiente.getMonth() + 1)).slice(-2) + '-01', -1); }
      if (periodo.value === 'todas') inicio = fin = '';
      if (periodo.value !== 'manual') { desde.value = inicio; hasta.value = fin; cambiar(); }
    });
    return { coincide: coincide, error: invalido, resumen: resumen, activo: function () { return !!(articulo.value.trim() || min.value !== '' || max.value !== ''); } };
  }

  // permiteEmpresa: función que dice si el cliente actual es empresa (sólo ahí aparece "Empresa").
  function formularioPago(obtenerTotal, inicial, permiteEmpresa, alCambiarModo) {
    var box = document.createElement('div'), modo = inicial || 'Debe', valores = {};
    box.className = 'flex flex-col gap-2';
    box.innerHTML = '<span class="text-xs font-bold text-on-surface-variant">Forma de pago</span><div data-modos class="flex flex-wrap gap-1"></div>' +
      '<div data-importes class="flex flex-col gap-2"></div><p data-saldo role="status" class="text-[13px] font-label-md text-on-surface"></p>';
    MEDIOS.forEach(function (m) {
      var label = document.createElement('label'); label.className = 'flex items-center justify-between gap-2 text-[13px] text-on-surface';
      label.innerHTML = esc(m) + '<input aria-label="Importe en ' + esc(m) + '" type="number" min="0" step="1" value="0" class="w-28 px-2 py-1.5 bg-background border border-outline rounded focus:border-primary">';
      valores[m] = $('input', label); valores[m].addEventListener('input', actualizar); $('[data-importes]', box).appendChild(label);
    });
    (permiteEmpresa ? ['Empresa'] : []).concat(['Debe'], MEDIOS, ['Parcial / combinado']).forEach(function (m) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = m; b.className = BTN;
      if (m === 'Empresa') b.dataset.modoEmpresa = '';
      b.addEventListener('click', function () { modo = m; actualizar(); }); $('[data-modos]', box).appendChild(b);
    });
    function leer() {
      var total = obtenerTotal(), lista = [];
      if (!importeValido(total)) return null;
      if (modo === 'Debe' || modo === 'Empresa') return [];
      if (modo !== 'Parcial / combinado') return total > 0 ? [{ medio: modo, importe: total }] : [];
      var invalido = MEDIOS.some(function (m) { var el = valores[m]; return el.value === '' || !el.checkValidity() || !importeValido(Number(el.value)); });
      if (invalido) return null;
      MEDIOS.forEach(function (m) { var n = Number(valores[m].value); if (n > 0) lista.push({ medio: m, importe: n }); });
      var suma = lista.reduce(function (n, p) { return n + p.importe; }, 0);
      return importeValido(suma) && suma > 0 && suma <= total ? lista : null;
    }
    function actualizar() {
      var empresa = !!(permiteEmpresa && permiteEmpresa()), anterior = modo;
      if (modo === 'Empresa' && !empresa) modo = 'Efectivo';
      $$('button', $('[data-modos]', box)).forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.textContent === modo)); b.classList.toggle('bg-primary-container', b.textContent === modo);
        if (b.hasAttribute('data-modo-empresa')) b.classList.toggle('hidden', !empresa);
      });
      $('[data-importes]', box).classList.toggle('hidden', modo !== 'Parcial / combinado');
      var lista = leer(), suma = lista ? lista.reduce(function (n, p) { return n + p.importe; }, 0) : 0;
      $('[data-saldo]', box).textContent = modo === 'Empresa' ? 'Remito de empresa: no entra en la caja ni queda como deuda. Se factura desde Empresas.'
        : lista ? 'Paga ahora: ' + plata(suma) + ' · Queda debiendo: ' + plata(obtenerTotal() - suma) : 'Revisá los importes: deben ser positivos y no superar el saldo.';
      box.dataset.modo = modo;
      if (alCambiarModo && anterior !== undefined) alCambiarModo(modo);
    }
    actualizar();
    return { elemento: box, leer: leer, actualizar: actualizar, modo: function () { return modo; },
      poner: function (m) { modo = m; actualizar(); },
      reiniciar: function (m) { modo = m || 'Debe'; MEDIOS.forEach(function (x) { valores[x].value = 0; }); actualizar(); } };
  }

  function registrarPago(v, alGuardar) {
    var cuerpo = document.createElement('div'); cuerpo.className = 'flex flex-col gap-3';
    cuerpo.innerHTML = '<p class="text-on-surface">' + esc(v.cliente) + ' · ' + esc(v.remito) + '<br>Saldo pendiente: <b>' + plata(saldo(v)) + '</b></p>' +
      campo('Fecha del cobro', '<input aria-label="Fecha del cobro" data-fecha-cobro type="date" value="' + HOY + '" class="' + INPUT + '">');
    var form = formularioPago(function () { return saldo(v); }, 'Parcial / combinado'), confirmado = false;
    cuerpo.appendChild(form.elemento);
    modal('Registrar pago', cuerpo, [{ texto: 'Confirmar pago', primario: true, accion: function () {
      if (confirmado) return false;
      var lista = form.leer(), iso = $('[data-fecha-cobro]', cuerpo).value;
      if (!lista || !lista.length || !fechaValida(iso) || iso < v.iso) { toast('Revisá importes y fecha del cobro', 'error'); return false; }
      var anteriores = v.pagos;
      v.pagos = pagos(v).concat(lista.map(function (p) { return { medio: p.medio, importe: p.importe, iso: iso, hora: ahora() }; }));
      if (!save()) { if (anteriores === undefined) delete v.pagos; else v.pagos = anteriores; toast('No se pudo guardar el pago. Revisá el almacenamiento del navegador.', 'error'); return false; }
      confirmado = true; toast('Pago registrado · saldo ' + plata(saldo(v))); if (alGuardar) alGuardar();
    } }, { texto: 'Cancelar', accion: function () {} }]);
  }

  function verRemito(v, alCambiar) {
    var cuerpo = document.createElement('div'); cuerpo.className = 'flex flex-col gap-3';
    cuerpo.innerHTML = '<p class="text-on-surface"><b>' + esc(v.cliente) + '</b><br>' + esc(v.remito) + ' · ' + esc(v.iso) + '</p>' +
      '<div class="overflow-x-auto"><table class="w-full text-sm text-on-surface"><thead><tr><th class="text-left">Prenda / servicio</th><th>Cant.</th><th>Unitario</th><th>Importe</th></tr></thead><tbody>' +
      (v.items || []).map(function (it) { return '<tr class="border-b border-outline"><td class="py-2">' + esc(it.nombre) + '</td><td class="text-center">' + it.cant + '</td><td class="text-right">' + plata(it.precio) + '</td><td class="text-right">' + plata(it.cant * it.precio) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      (!v.items ? '<p>' + esc(v.detalle) + '</p>' : '') +
      (v.observaciones ? '<p class="text-sm text-on-surface whitespace-pre-wrap break-words"><b>Observaciones:</b> ' + esc(v.observaciones) + '</p>' : '') +
      (v.cuentaEmpresa
        ? '<div data-cb-cuenta-empresa class="p-3 rounded border border-outline flex flex-col gap-1"><b class="text-on-surface">Remito de empresa</b>' +
          '<span class="text-sm text-on-surface-variant">No entra en la caja ni genera deuda. Total informativo del remito: <b data-cb-importe="total">' + plata(v.total) + '</b></span></div>' +
          (v.correcciones && v.correcciones.length ? '<p class="text-xs text-on-surface-variant">' + v.correcciones.map(function (c) { return 'Corregido el ' + esc(fechaCorta(c.iso)) + ' a las ' + esc(c.hora) + ' por ' + esc(c.usuario); }).join(' · ') + '</p>' : '')
        : resumenImportes(v.total, cobrado(v), saldo(v)) + '<p class="text-sm text-on-surface-variant">' + estadoCobro(v) + '</p>' +
          '<div class="text-sm text-on-surface"><b>Historial de pagos</b>' + (pagos(v).length ? pagos(v).map(function (p) { return '<p>' + esc(p.iso) + ' · ' + esc(p.medio) + ' · ' + plata(p.importe) + '</p>'; }).join('') : '<p>Sin pagos registrados.</p>') + '</div>');
    var presentacion = document.createElement('label'); presentacion.className = 'text-sm text-on-surface flex items-center gap-2';
    presentacion.innerHTML = '<input data-sin-precios type="checkbox"> Remito sin precios (impresión y PDF)';
    $('input', presentacion).checked = !!v.sinPrecios;
    $('input', presentacion).addEventListener('change', function () { var antes = v.sinPrecios; v.sinPrecios = this.checked; if (!save()) { v.sinPrecios = antes; this.checked = !!antes; toast('No se pudo guardar la preferencia', 'error'); } });
    cuerpo.appendChild(presentacion);
    var formato = document.createElement('p'); formato.className = 'text-xs text-on-surface-variant';
    formato.textContent = 'PDF en hoja A4, una copia. Abrilo para ver e imprimir, o descargalo para enviar.'; cuerpo.appendChild(formato);
    var acciones = [{ texto: 'Ver e imprimir A4', accion: function () { descargarRemito(v, true); return false; } }, { texto: 'Descargar remito PDF', accion: function () { descargarRemito(v); return false; } }, { texto: 'Imprimir ticket (80 mm)', accion: function () { imprimirTicket(v); } }];
    if (saldo(v) > 0) acciones.unshift({ texto: 'Registrar pago', primario: true, accion: function () { registrarPago(v, function () { ventana.cerrar(); verRemito(v, alCambiar); if (alCambiar) alCambiar(); }); return false; } });
    if (v.cuentaEmpresa) acciones.unshift({ texto: 'Corregir remito', primario: true, accion: function () { corregirRemito(v, function () { ventana.cerrar(); verRemito(v, alCambiar); if (alCambiar) alCambiar(); }); return false; } });
    if (esDueno() && vistaPermitida('facturar') && v.items && v.items.length) acciones.push({ texto: 'Facturar este remito', accion: function () {
      ventana.cerrar(); abrirFactura({ cliente: clienteRegistro(v), renglones: v.items, observaciones: 'Corresponde a remito ' + v.remito + '.', remitos: [v.remito] }); return false; } });
    var p = S.pedidos.filter(function (p0) { return v.pedido === '#' + p0.n; })[0];
    if (p && p.estado === 'listo') acciones.push({ texto: 'Entregar pedido', accion: function () {
      p.estado = 'entregado'; p.entregadoIso = HOY;
      if (!save()) { p.estado = 'listo'; delete p.entregadoIso; toast('No se pudo guardar la entrega', 'error'); return false; }
      toast('Pedido entregado · saldo ' + plata(saldo(v))); if (alCambiar) alCambiar();
    } });
    acciones.push({ texto: 'Cerrar', accion: function () {} });
    var ventana = modal('Detalle del remito', cuerpo, acciones);
    $('div.w-full', ventana).classList.replace('max-w-[480px]', 'max-w-[680px]');
    $('[data-pie]', ventana).classList.add('flex-wrap');
  }

  // ── Corregir un remito de empresa (empleadas y dueño) ─────────────
  // Sólo cuenta empresa: no tiene pagos ni toca la caja, así que corregirlo no altera dinero.
  function corregirRemito(v, alGuardar) {
    var renglones = JSON.parse(JSON.stringify(v.items || []));
    var pct = v.descuentoPct != null ? v.descuentoPct : (v.descuento && v.total + v.descuento > 0 ? v.descuento * 100 / (v.total + v.descuento) : 0);
    var cuerpo = document.createElement('div'); cuerpo.className = 'flex flex-col gap-3'; cuerpo.setAttribute('data-corregir', '');
    cuerpo.innerHTML = '<p class="text-on-surface"><b>' + esc(v.cliente) + '</b> · ' + esc(v.remito) + ' · ' + esc(fechaCorta(v.iso)) + '</p>' +
      '<p class="text-xs text-on-surface-variant">Corregí prendas, cantidades o precios. El remito sigue fuera de la caja; al guardar, volvé a imprimirlo.</p>' +
      '<div class="grid gap-2 text-xs font-bold text-on-surface-variant" style="grid-template-columns:minmax(0,1fr) 76px 96px 32px"><span>Prenda o servicio</span><span>Cant.</span><span>Unit. $</span><span></span></div>' +
      '<div data-corr-items class="flex flex-col gap-2"></div>' +
      '<div class="flex flex-wrap gap-2"><select data-corr-lista aria-label="Prenda de la lista para agregar" class="' + INPUT + '" style="flex:1 1 200px;width:auto">' +
      S.precios.map(function (p) { return '<option>' + esc(p.nombre) + '</option>'; }).join('') + '</select>' +
      '<button type="button" data-corr-agregar class="' + BTN + '">Agregar de la lista</button><button type="button" data-corr-libre class="' + BTN + '">Renglón libre</button></div>' +
      campo('Observaciones', '<textarea data-corr-obs rows="2" class="' + INPUT + '"></textarea>') +
      '<p data-corr-total role="status" class="font-label-md text-sm text-on-surface"></p>';
    var lista = $('[data-corr-items]', cuerpo), obs = $('[data-corr-obs]', cuerpo);
    obs.value = v.observaciones || '';
    function valido(r) { return !!String(r.nombre).trim() && Number.isSafeInteger(r.cant) && r.cant > 0 && importeValido(r.precio) && importeValido(r.cant * r.precio); }
    function total() {
      var sub = renglones.reduce(function (n, r) { return n + (valido(r) ? r.cant * r.precio : 0); }, 0), desc = Math.round(sub * pct / 100);
      $('[data-corr-total]', cuerpo).textContent = !renglones.length ? 'Agregá al menos una prenda.' : renglones.every(valido)
        ? 'Unidades: ' + renglones.reduce(function (n, r) { return n + r.cant; }, 0) + ' · Total informativo: ' + plata(sub - desc) + (desc ? ' (descuento ' + Math.round(pct) + '%)' : '')
        : 'Revisá los renglones: descripción, cantidad entera mayor a cero y precio desde $0.';
      return { sub: sub, desc: desc };
    }
    function pintar() {
      lista.innerHTML = renglones.map(function (r, i) {
        return '<div data-corr-renglon class="grid gap-2 items-center" style="grid-template-columns:minmax(0,1fr) 76px 96px 32px">' +
          '<input data-corr-nombre="' + i + '" aria-label="Prenda del renglón ' + (i + 1) + '" value="' + esc(r.nombre) + '" class="' + INPUT + ' font-bold">' +
          '<input data-corr-cant="' + i + '" aria-label="Cantidad del renglón ' + (i + 1) + '" type="number" min="1" step="1" inputmode="numeric" value="' + (r.cant > 0 ? r.cant : '') + '" class="' + INPUT + ' text-center font-bold" style="padding-inline:4px">' +
          '<input data-corr-precio="' + i + '" aria-label="Precio unitario del renglón ' + (i + 1) + '" type="number" min="0" step="1" value="' + r.precio + '" class="' + INPUT + '" style="padding-inline:6px">' +
          '<button type="button" data-corr-quitar="' + i + '" aria-label="Quitar renglón ' + (i + 1) + '" class="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container"><span class="material-symbols-outlined text-[18px]">close</span></button></div>';
      }).join(''); total();
    }
    lista.addEventListener('input', function (e) {
      var t = e.target, i;
      if (t.hasAttribute('data-corr-nombre')) renglones[+t.dataset.corrNombre].nombre = t.value;
      if (t.hasAttribute('data-corr-cant')) { i = +t.dataset.corrCant; renglones[i].cant = t.value === '' ? NaN : Number(t.value); }
      if (t.hasAttribute('data-corr-precio')) { i = +t.dataset.corrPrecio; renglones[i].precio = t.value === '' ? NaN : Number(t.value); }
      t.setAttribute('aria-invalid', String(t.value === '' || !t.checkValidity())); total();
    });
    lista.addEventListener('click', function (e) { var b = e.target.closest('[data-corr-quitar]'); if (b) { renglones.splice(+b.dataset.corrQuitar, 1); pintar(); } });
    $('[data-corr-agregar]', cuerpo).addEventListener('click', function () {
      var n = $('[data-corr-lista]', cuerpo).value, r = renglones.filter(function (x) { return x.nombre === n; })[0];
      if (r) { r.cant = (r.cant > 0 ? r.cant : 0) + 1; pintar(); $('[data-corr-cant="' + renglones.indexOf(r) + '"]', lista).focus(); }
      else { renglones.push({ nombre: n, cant: 1, precio: precioDe(n) }); pintar(); $('[data-corr-cant="' + (renglones.length - 1) + '"]', lista).focus(); }
    });
    $('[data-corr-libre]', cuerpo).addEventListener('click', function () { renglones.push({ nombre: '', cant: 1, precio: 0 }); pintar(); $('[data-corr-nombre="' + (renglones.length - 1) + '"]', lista).focus(); });
    pintar();
    var ventana = modal('Corregir remito ' + v.remito, cuerpo, [{ texto: 'Guardar corrección', primario: true, accion: function () {
      if (!renglones.length || !renglones.every(valido)) { toast('Revisá prendas, cantidades y precios', 'error'); return false; }
      var t = total(), antes = JSON.stringify(v);
      v.items = renglones.map(function (r) { return { nombre: String(r.nombre).trim(), cant: r.cant, precio: r.precio }; });
      v.descuento = t.desc; v.total = t.sub - t.desc; v.descuentoPct = pct; v.observaciones = obs.value.trim();
      v.detalle = v.items.map(function (r) { return r.cant + ' ' + r.nombre.toLowerCase(); }).join(' + ');
      v.correcciones = (v.correcciones || []).concat([{ iso: HOY, hora: ahora(), usuario: USUARIOS[S.usuario][0].split(' · ')[0] }]);
      if (!save()) { var previo = JSON.parse(antes); Object.keys(v).forEach(function (k) { delete v[k]; }); Object.keys(previo).forEach(function (k) { v[k] = previo[k]; }); toast('No se pudo guardar la corrección. Volvé a intentar.', 'error'); return false; }
      toast('Remito ' + v.remito + ' corregido. Volvé a imprimirlo si hace falta.'); if (alGuardar) alGuardar();
    } }, { texto: 'Cancelar', accion: function () {} }]);
    $('div.w-full', ventana).classList.replace('max-w-[480px]', 'max-w-[680px]');
  }

  // ── Facturas (sólo dueño): mensual por cantidades, libre o de un remito ──
  function plata2(n) { return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function centavos(n) { return Math.round(n * 100) / 100; }
  function tipoFactura(c) { return c && c.tipo === 'empresa' ? 'A' : 'B'; }
  function importesFactura(f) {
    var total = f.renglones.reduce(function (n, r) { return n + r.cant * r.precio; }, 0);
    var neto = f.tipo === 'A' ? centavos(total / 1.21) : total;
    return { total: total, neto: neto, iva: f.tipo === 'A' ? centavos(total - neto) : 0 };
  }
  function abrirFactura(datos) {
    datos = datos || {};
    var cliente = datos.cliente || null;
    var renglones = (datos.renglones || []).map(function (r) { return { nombre: r.nombre, cant: r.cant, precio: r.precio }; });
    if (!renglones.length) renglones.push({ nombre: '', cant: 1, precio: 0 });
    var cuerpo = document.createElement('div'); cuerpo.className = 'flex flex-col gap-3 text-[14px]'; cuerpo.setAttribute('data-factura-form', '');
    cuerpo.innerHTML = '<div data-fac-cliente class="p-3 rounded border border-outline flex flex-wrap items-center justify-between gap-2">' +
      '<div class="min-w-0"><span data-fac-tipo class="text-xs font-bold text-primary"></span><div data-fac-nombre class="font-label-md text-on-surface"></div><div data-fac-sub class="text-xs text-on-surface-variant"></div></div>' +
      '<button type="button" data-fac-cambiar class="' + BTN + '">Cambiar cliente</button></div>' +
      '<div class="grid grid-cols-2 gap-2">' + campo('Período facturado (opcional)', '<input data-fac-periodo class="' + INPUT + '" placeholder="Ej. 01/10/2026 al 31/10/2026">') +
      campo('Orden de compra (opcional)', '<input data-fac-oc class="' + INPUT + '" placeholder="Ej. OC 4512">') + '</div>' +
      '<div class="overflow-x-auto"><table class="w-full text-sm text-on-surface" style="table-layout:fixed"><thead><tr>' +
      '<th class="text-left" style="width:44%">Descripción</th><th style="width:13%">Cant.</th><th style="width:20%">Unit. con IVA</th><th class="text-right" style="width:17%">Subtotal</th><th style="width:6%"></th></tr></thead><tbody data-fac-renglones></tbody></table></div>' +
      '<div class="flex flex-wrap gap-2"><select data-fac-lista aria-label="Prenda de la lista para agregar" class="' + INPUT + '" style="flex:1 1 200px;width:auto">' +
      S.precios.map(function (p) { return '<option>' + esc(p.nombre) + '</option>'; }).join('') + '</select>' +
      '<button type="button" data-fac-agregar class="' + BTN + '">Agregar de la lista</button><button type="button" data-fac-libre class="' + BTN + '">Renglón libre</button></div>' +
      campo('Observaciones (salen impresas en la factura)', '<textarea data-fac-obs rows="3" class="' + INPUT + '" placeholder="Ej. Corresponde a remitos R-0201, R-0207…"></textarea>') +
      '<div data-fac-totales class="self-end w-full max-w-[320px] flex flex-col gap-1"></div>' +
      '<p class="text-xs text-on-surface-variant">Precios con IVA incluido. Demo: no se envía a ARCA; en el sistema real se pide el CAE y se guarda el PDF.</p>';
    var tbody = $('[data-fac-renglones]', cuerpo);
    $('[data-fac-periodo]', cuerpo).value = datos.periodo || ''; $('[data-fac-oc]', cuerpo).value = datos.oc || ''; $('[data-fac-obs]', cuerpo).value = datos.observaciones || '';
    function valido(r) { return !!String(r.nombre).trim() && Number.isSafeInteger(r.cant) && r.cant > 0 && importeValido(r.precio) && importeValido(r.cant * r.precio); }
    function pintarCliente() {
      var t = tipoFactura(cliente);
      $('[data-fac-tipo]', cuerpo).textContent = cliente ? (t === 'A' ? 'Factura A · Responsable Inscripto' : 'Factura B · Consumidor final') : 'Falta el cliente';
      $('[data-fac-nombre]', cuerpo).textContent = cliente ? cliente.nombre : 'Elegí a quién se factura';
      $('[data-fac-sub]', cuerpo).textContent = cliente ? (cliente.tipo === 'empresa' ? 'CUIT ' + cliente.cuit : 'Tel ' + (cliente.tel || '—')) : '';
      totales();
    }
    function totales() {
      var f = { tipo: tipoFactura(cliente), renglones: renglones.filter(valido) }, im = importesFactura(f), ok = renglones.length && renglones.every(valido);
      $('[data-fac-totales]', cuerpo).innerHTML = (f.tipo === 'A' ? '<div class="flex justify-between"><span>Neto gravado</span><span>' + plata2(im.neto) + '</span></div><div class="flex justify-between"><span>IVA 21%</span><span>' + plata2(im.iva) + '</span></div>' : '') +
        '<div class="flex justify-between items-baseline border-t border-outline pt-2"><b>Total factura ' + f.tipo + '</b><b data-fac-total data-cb-importe="total" style="font-size:22px">' + (ok ? plata(im.total) : 'Revisá los renglones') + '</b></div>';
    }
    function pintar() {
      tbody.innerHTML = renglones.map(function (r, i) {
        return '<tr class="border-b border-outline"><td class="py-1.5 pr-2"><input data-fac-nombre-r="' + i + '" aria-label="Descripción del renglón ' + (i + 1) + '" value="' + esc(r.nombre) + '" class="' + INPUT + ' font-bold"></td>' +
          '<td class="py-1.5 pr-2"><input data-fac-cant="' + i + '" aria-label="Cantidad del renglón ' + (i + 1) + '" type="number" min="1" step="1" inputmode="numeric" value="' + (r.cant > 0 ? r.cant : '') + '" class="' + INPUT + ' text-center font-bold" style="padding-inline:4px"></td>' +
          '<td class="py-1.5 pr-2"><input data-fac-precio="' + i + '" aria-label="Precio unitario con IVA del renglón ' + (i + 1) + '" type="number" min="0" step="1" value="' + (importeValido(r.precio) ? r.precio : '') + '" class="' + INPUT + '" style="padding-inline:6px"></td>' +
          '<td class="py-1.5 text-right" data-fac-sub-r="' + i + '" data-cb-importe="total">' + (valido(r) ? plata(r.cant * r.precio) : '—') + '</td>' +
          '<td class="py-1.5 text-right"><button type="button" data-fac-quitar="' + i + '" aria-label="Quitar renglón ' + (i + 1) + '" class="w-8 h-8 inline-flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container"><span class="material-symbols-outlined text-[18px]">close</span></button></td></tr>';
      }).join(''); totales();
    }
    tbody.addEventListener('input', function (e) {
      var t = e.target, i = +(t.dataset.facNombreR || t.dataset.facCant || t.dataset.facPrecio), r = renglones[i];
      if (t.hasAttribute('data-fac-nombre-r')) r.nombre = t.value;
      if (t.hasAttribute('data-fac-cant')) r.cant = t.value === '' ? NaN : Number(t.value);
      if (t.hasAttribute('data-fac-precio')) r.precio = t.value === '' ? NaN : Number(t.value);
      t.setAttribute('aria-invalid', String(t.value === '' || !t.checkValidity()));
      $('[data-fac-sub-r="' + i + '"]', tbody).textContent = valido(r) ? plata(r.cant * r.precio) : '—'; totales();
    });
    tbody.addEventListener('click', function (e) { var b = e.target.closest('[data-fac-quitar]'); if (b) { renglones.splice(+b.dataset.facQuitar, 1); pintar(); } });
    $('[data-fac-agregar]', cuerpo).addEventListener('click', function () { var n = $('[data-fac-lista]', cuerpo).value; renglones.push({ nombre: n, cant: 1, precio: precioDe(n) }); pintar(); $('[data-fac-cant="' + (renglones.length - 1) + '"]', tbody).focus(); });
    $('[data-fac-libre]', cuerpo).addEventListener('click', function () { renglones.push({ nombre: '', cant: 1, precio: 0 }); pintar(); $('[data-fac-nombre-r="' + (renglones.length - 1) + '"]', tbody).focus(); });
    $('[data-fac-cambiar]', cuerpo).addEventListener('click', function () {
      var elegido = null;
      modal('Cliente de la factura', selectorCliente(function (c) { elegido = c; }), [
        { texto: 'Usar este cliente', primario: true, accion: function () { if (!elegido) { toast('Elegí o creá el cliente', 'error'); return false; } cliente = elegido; pintarCliente(); } },
        { texto: 'Cancelar', accion: function () {} }]);
    });
    pintar(); pintarCliente();
    var emitida = false;
    var ventana = modal(datos.titulo || 'Armar factura', cuerpo, [{ texto: 'Emitir factura', primario: true, accion: function () {
      if (emitida) return false;
      if (!cliente) { toast('Elegí el cliente de la factura', 'error'); return false; }
      if (!renglones.length || !renglones.every(valido)) { toast('Revisá descripción, cantidad y precio de cada renglón', 'error'); return false; }
      var tipo = tipoFactura(cliente), f = { tipo: tipo, clienteId: cliente.id, cliente: cliente.nombre, cuit: cliente.cuit || '', iso: HOY, hora: ahora(),
        renglones: renglones.map(function (r) { return { nombre: String(r.nombre).trim(), cant: r.cant, precio: r.precio }; }),
        observaciones: $('[data-fac-obs]', cuerpo).value.trim(), oc: $('[data-fac-oc]', cuerpo).value.trim(), periodo: $('[data-fac-periodo]', cuerpo).value.trim(), remitos: datos.remitos || [] };
      f.total = importesFactura(f).total;
      if (!(f.total > 0)) { toast('El total de la factura tiene que ser mayor a cero', 'error'); return false; }
      var antes = { a: S.sigFactura, b: S.sigFacturaB };
      f.numero = tipo + ' 0003-' + ('00000000' + (tipo === 'A' ? S.sigFactura++ : S.sigFacturaB++)).slice(-8);
      S.facturasEmitidas = S.facturasEmitidas || []; S.facturasEmitidas.push(f);
      if (!save()) { S.facturasEmitidas.pop(); S.sigFactura = antes.a; S.sigFacturaB = antes.b; toast('No se pudo guardar la factura. Volvé a intentar.', 'error'); return false; }
      emitida = true; ventana.cerrar(); toast('Factura ' + f.numero + ' emitida (demo)'); mostrarFactura(f); if (datos.alEmitir) datos.alEmitir(f); return false;
    } }, { texto: 'Cancelar', accion: function () {} }]);
    $('div.w-full', ventana).classList.replace('max-w-[480px]', 'max-w-[860px]');
    return ventana;
  }
  function enviarFactura(f) {
    facturaPDF(f).then(function (ok) {
      if (!ok) return;
      location.href = 'mailto:?subject=' + encodeURIComponent('Factura ' + f.numero + ' · CLEANBOX') + '&body=' + encodeURIComponent('Hola, te enviamos la factura ' + f.numero + ' por ' + plata(f.total) + (f.periodo ? ' (período ' + f.periodo + ')' : '') + '. Va adjunta en PDF.\n\nCLEANBOX Tintorería');
      toast('PDF descargado: adjuntalo en el mail');
    });
  }
  function mostrarFactura(f) {
    var cuerpo = document.createElement('div'); cuerpo.className = 'flex flex-col gap-2';
    cuerpo.innerHTML = '<p class="text-on-surface"><b data-cb-numero>' + esc(f.numero) + '</b> · ' + esc(f.cliente) + '</p>' +
      '<p class="text-on-surface">Total: <b data-cb-importe="total">' + plata(f.total) + '</b></p>' +
      '<p class="text-xs text-on-surface-variant">PDF en hoja A4 con el logo. Abrilo para ver e imprimir, descargalo o mandalo por mail.</p>';
    modal('Factura emitida', cuerpo, [{ texto: 'Ver e imprimir A4', primario: true, accion: function () { facturaPDF(f, true); return false; } },
      { texto: 'Descargar PDF', accion: function () { facturaPDF(f); return false; } }, { texto: 'Enviar por mail', accion: function () { enviarFactura(f); return false; } },
      { texto: 'Cerrar', accion: function () {} }]);
    $('[data-pie]', $$('[data-modal]').pop()).classList.add('flex-wrap');
  }
  function verFacturas(clienteId) {
    var cuerpo = document.createElement('div'); cuerpo.className = 'flex flex-col gap-3';
    cuerpo.innerHTML = '<input data-fac-buscar aria-label="Buscar factura" placeholder="Buscar por cliente o número" class="' + INPUT + '">' +
      '<div class="overflow-x-auto"><table class="w-full text-sm text-on-surface"><thead><tr><th class="text-left">Número</th><th class="text-left">Fecha</th><th class="text-left">Cliente</th><th class="text-right">Total</th><th></th></tr></thead><tbody></tbody></table></div>';
    var buscar = $('[data-fac-buscar]', cuerpo);
    if (clienteId) { var c = S.clientes.filter(function (x) { return x.id === clienteId; })[0]; if (c) buscar.value = c.nombre; }
    function pintar() {
      var q = norm(buscar.value), lista = (S.facturasEmitidas || []).filter(function (f) { return !q || norm(f.cliente + f.numero).indexOf(q) >= 0; }).slice().reverse();
      $('tbody', cuerpo).innerHTML = lista.map(function (f, i) {
        return '<tr class="border-b border-outline"><td class="py-2" data-cb-numero>' + esc(f.numero) + '</td><td>' + esc(fechaCorta(f.iso)) + '</td><td>' + esc(f.cliente) + '</td><td data-cb-importe="total">' + plata(f.total) + '</td>' +
          '<td class="text-right whitespace-nowrap"><button type="button" data-f-ver="' + i + '" class="' + BTN + '">Ver A4</button> <button type="button" data-f-pdf="' + i + '" class="' + BTN + '">PDF</button> <button type="button" data-f-mail="' + i + '" class="' + BTN + '">Mail</button></td></tr>';
      }).join('') || '<tr><td colspan="5" class="py-4 text-on-surface-variant">Sin facturas con esa búsqueda.</td></tr>';
      $$('[data-f-ver]', cuerpo).forEach(function (b) { b.addEventListener('click', function () { facturaPDF(lista[+b.dataset.fVer], true); }); });
      $$('[data-f-pdf]', cuerpo).forEach(function (b) { b.addEventListener('click', function () { facturaPDF(lista[+b.dataset.fPdf]); }); });
      $$('[data-f-mail]', cuerpo).forEach(function (b) { b.addEventListener('click', function () { enviarFactura(lista[+b.dataset.fMail]); }); });
    }
    buscar.addEventListener('input', pintar); pintar();
    var ventana = modal('Facturas emitidas', cuerpo, [{ texto: 'Cerrar', accion: function () {} }]);
    $('div.w-full', ventana).classList.replace('max-w-[480px]', 'max-w-[860px]');
  }

  function consultarMovimientos(alCambiar, cliente) {
    var cuerpo = document.createElement('div'); cuerpo.className = 'flex flex-col gap-3';
    cuerpo.innerHTML = '<div class="flex flex-wrap gap-2">' +
      '<label class="text-xs text-on-surface">Desde<input aria-label="Consultar desde" data-desde type="date" value="' + HOY + '" class="' + INPUT + '"></label>' +
      '<label class="text-xs text-on-surface">Hasta<input aria-label="Consultar hasta" data-hasta type="date" value="' + HOY + '" class="' + INPUT + '"></label>' +
      '<button type="button" data-sin-fecha class="' + BTN + '">Todas las fechas</button></div>' +
      '<input aria-label="Buscar cliente o empresa" data-buscar placeholder="Buscar por nombre de persona o empresa" class="' + INPUT + '">' +
      '<label class="text-sm text-on-surface"><input data-pendientes type="checkbox"> Sólo remitos con saldo pendiente</label>' +
      '<p data-resumen role="status" class="font-label-md text-sm text-on-surface"></p>' +
      '<div class="overflow-x-auto"><table class="w-full text-sm text-on-surface"><thead><tr><th class="text-left">Fecha / actividad</th><th class="text-left">Cliente</th><th>Total</th><th>Saldo</th><th></th></tr></thead><tbody></tbody></table></div>';
    var desde = $('[data-desde]', cuerpo), hasta = $('[data-hasta]', cuerpo), buscar = $('[data-buscar]', cuerpo), pendientes = $('[data-pendientes]', cuerpo);
    if (cliente) {
      desde.value = ''; hasta.value = ''; buscar.value = cliente.nombre; buscar.readOnly = true;
      var deuda = ventas().filter(function (v) { var c = clienteRegistro(v); return c && c.id === cliente.id; }).reduce(function (n, v) { return n + saldo(v); }, 0);
      var cab = document.createElement('p'); cab.className = 'font-label-md text-on-surface'; cab.textContent = cliente.nombre + ' · Deuda total actual: ' + plata(deuda); cuerpo.prepend(cab);
    }
    var criterio = document.createElement('label'); criterio.className = LABEL;
    criterio.innerHTML = 'Filtrar fechas por<select data-fecha-base aria-label="Criterio de fechas" class="' + INPUT + '"><option value="remito">Fecha del remito</option><option value="actividad">Actividad (recepción, entrega o cobro)</option></select>';
    $('[data-resumen]', cuerpo).before(criterio);
    var fechaBase = $('select', criterio); fechaBase.value = cliente ? 'remito' : 'actividad'; fechaBase.addEventListener('change', renderConsulta);
    var filtrosBox = document.createElement('div'); $('[data-resumen]', cuerpo).before(filtrosBox);
    var filtros = filtrosRemitos(filtrosBox, desde, hasta, renderConsulta);
    $('p.text-xs', filtrosBox).textContent = 'Fechas según el criterio elegido. Importes del remito desde y hasta inclusive.';
    function enFecha(iso) { return iso ? (!desde.value || iso >= desde.value) && (!hasta.value || iso <= hasta.value) : !desde.value && !hasta.value; }
    function renderConsulta() {
      if (filtros.error()) { filtros.resumen([]); $('[data-resumen]', cuerpo).textContent = filtros.error(); $('tbody', cuerpo).innerHTML = ''; return; }
      var filas = [], q = norm(buscar.value), identidades = {}, sinIdentificar = 0, cantVentas = 0;
      ventas().forEach(function (v) {
        if (v.cuentaEmpresa) return; // los remitos de empresa no son de la caja: están en Remitos y Empresas
        if (cliente) { var c = clienteRegistro(v); if (!c || c.id !== cliente.id) return; }
        var actividad = [], p = S.pedidos.filter(function (p0) { return v.pedido === '#' + p0.n; })[0];
        if (enFecha(v.iso)) actividad.push('Venta / remito');
        if (pagos(v).some(function (pago) { return enFecha(pago.iso); })) actividad.push('Cobro');
        if (p && p.entregadoIso && enFecha(p.entregadoIso)) actividad.push('Entrega');
        if (fechaBase.value === 'remito') actividad = enFecha(v.iso) ? ['Venta / remito'] : [];
        if (actividad.length && filtros.coincide(v) && (!q || norm(v.cliente).indexOf(q) >= 0) && (!pendientes.checked || saldo(v) > 0)) {
          if (enFecha(v.iso)) cantVentas++;
          var fechasActividad = [];
          if (enFecha(v.iso) && v.iso) fechasActividad.push(v.iso);
          pagos(v).forEach(function (pago) { if (enFecha(pago.iso) && fechasActividad.indexOf(pago.iso) < 0) fechasActividad.push(pago.iso); });
          if (p && p.entregadoIso && enFecha(p.entregadoIso) && fechasActividad.indexOf(p.entregadoIso) < 0) fechasActividad.push(p.entregadoIso);
          filas.push({ registro: v, fecha: fechaBase.value === 'remito' ? v.iso || 'Sin fecha' : fechasActividad.join(', ') || 'Sin fecha', actividad: actividad.join(' / '), venta: v });
        }
      });
      if (!pendientes.checked && !filtros.activo() && !cliente && fechaBase.value === 'actividad') S.pedidos.forEach(function (p) {
        if (enFecha(p.iso) && (!q || norm(p.cliente).indexOf(q) >= 0)) filas.push({ registro: p, fecha: p.iso || 'Sin fecha de recepción', actividad: 'Recepción #' + p.n, venta: ventaPedido(p) });
      });
      filas.forEach(function (f) { var c = clienteRegistro(f.registro); if (c) identidades[c.id] = true; else sinIdentificar++; });
      var remitosUnicos = {};
      filas.forEach(function (f) { if (f.venta && !f.venta.cuentaEmpresa) remitosUnicos[f.venta.remito] = f.venta; });
      var saldoFiltrado = Object.keys(remitosUnicos).reduce(function (n, id) { return n + saldo(remitosUnicos[id]); }, 0);
      filtros.resumen(Object.keys(remitosUnicos).map(function (id) { return remitosUnicos[id]; }));
      $('[data-resumen]', cuerpo).textContent = cantVentas + ' ventas · ' + Object.keys(identidades).length + ' clientes identificados · ' + filas.length + ' movimientos · Saldo de remitos: ' + plata(saldoFiltrado) + (sinIdentificar ? ' · ' + sinIdentificar + ' movimientos sin identidad confirmada' : '');
      $('tbody', cuerpo).innerHTML = filas.map(function (f, i) {
        return '<tr class="border-b border-outline"><td class="py-2">' + esc(f.fecha) + '<br><span class="text-xs text-on-surface-variant">' + esc(f.actividad) + '</span></td><td>' + esc(f.registro.cliente) + '</td><td data-cb-importe="total">' + (f.venta ? (f.venta.cuentaEmpresa ? 'Cuenta empresa' : plata(f.venta.total)) : '—') + '</td><td data-cb-importe="' + (f.venta && saldo(f.venta) > 0 ? 'pendiente' : 'pagado') + '">' + (f.venta && !f.venta.cuentaEmpresa ? plata(saldo(f.venta)) : '—') + '</td><td><button type="button" data-mov="' + i + '" class="' + BTN + '">' + (f.venta ? 'Ver remito' : 'Cargar remito') + '</button></td></tr>';
      }).join('') || '<tr><td colspan="5" class="py-4">Sin movimientos con estos filtros.</td></tr>';
      $$('[data-mov]', cuerpo).forEach(function (b) { b.addEventListener('click', function () { var f = filas[+b.dataset.mov]; if (f.venta) verRemito(f.venta, function () { if (cliente) cab.textContent = cliente.nombre + ' · Deuda total actual: ' + plata(ventas().filter(function (v) { var c = clienteRegistro(v); return c && c.id === cliente.id; }).reduce(function (n, v) { return n + saldo(v); }, 0)); renderConsulta(); if (alCambiar) alCambiar(); }); else location.href = 'venta.html?pedido=' + f.registro.n; }); });
    }
    [desde, hasta, buscar, pendientes].forEach(function (el) { el.addEventListener('input', renderConsulta); });
    $('[data-sin-fecha]', cuerpo).addEventListener('click', function () { desde.value = ''; hasta.value = ''; renderConsulta(); });
    renderConsulta();
    var ventana = modal('Ventas, clientes y remitos', cuerpo, [{ texto: 'Cerrar', accion: function () {} }]);
    $('div.w-full', ventana).classList.replace('max-w-[480px]', 'max-w-[860px]');
  }

  // ── Selector de cliente con alta en el mismo paso ─────────────────
  // Escribe nombre, teléfono o CUIT. Si existe lo elige; si no, lo crea ahí mismo.
  function selectorCliente(onElegir, inicial) {
    var box = document.createElement('div');
    box.className = 'flex flex-col gap-2';
    box.innerHTML = campo('Cliente <span class="text-error">*</span>',
      '<input data-q class="' + INPUT + '" placeholder="Nombre, teléfono o CUIT" autocomplete="off">') +
      '<div data-lista class="flex flex-col border border-outline rounded divide-y divide-outline hidden"></div>' +
      '<div data-nuevo class="hidden p-3 rounded bg-surface-container-low border border-outline flex flex-col gap-3"></div>' +
      '<div data-elegido class="hidden"></div>';
    var q = $('[data-q]', box), lista = $('[data-lista]', box), nuevo = $('[data-nuevo]', box), elegido = $('[data-elegido]', box);

    function elegir(c) {
      onElegir(c);
      q.value = c.nombre; lista.classList.add('hidden'); nuevo.classList.add('hidden');
      elegido.classList.remove('hidden');
      elegido.innerHTML = '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-label-md bg-primary-fixed text-on-primary-fixed-variant border border-outline-variant">' +
        '<span class="material-symbols-outlined text-[14px]">check_circle</span>' + esc(c.nombre) + ' · ' + (c.tipo === 'empresa' ? 'CUIT ' + esc(c.cuit) : 'Tel ' + esc(c.tel)) + '</span>';
    }
    function buscar() {
      var t = norm(q.value), dig = soloDig(q.value);
      elegido.classList.add('hidden'); nuevo.classList.add('hidden'); onElegir(null);
      if (!t) { lista.classList.add('hidden'); return; }
      var hits = S.clientes.filter(function (c) {
        return norm(c.nombre).indexOf(t) >= 0 || (dig.length >= 3 && (soloDig(c.tel).indexOf(dig) >= 0 || soloDig(c.cuit).indexOf(dig) >= 0));
      }).slice(0, 5);
      lista.innerHTML = hits.map(function (c, i) {
        return '<button type="button" data-i="' + i + '" class="text-left px-3 py-2 hover:bg-surface-container-low flex items-center justify-between gap-2">' +
          '<span class="font-label-md text-[14px] text-on-surface">' + esc(c.nombre) + '</span>' +
          '<span class="text-xs text-on-surface-variant">' + (c.tipo === 'empresa' ? 'CUIT ' + esc(c.cuit) : 'Tel ' + esc(c.tel)) + '</span></button>';
      }).join('') +
        '<button type="button" data-crear class="text-left px-3 py-2 hover:bg-surface-container-low flex items-center gap-1 font-label-md text-[14px] text-primary">' +
        '<span class="material-symbols-outlined text-[18px]">person_add</span>Crear cliente «' + esc(q.value.trim()) + '»</button>';
      lista.classList.remove('hidden');
      $$('[data-i]', lista).forEach(function (b) { b.addEventListener('click', function () { elegir(hits[+b.dataset.i]); }); });
      $('[data-crear]', lista).addEventListener('click', abrirNuevo);
    }
    function abrirNuevo() {
      lista.classList.add('hidden');
      var esNum = soloDig(q.value).length >= 6 && soloDig(q.value).length === q.value.replace(/[\s-]/g, '').length;
      nuevo.innerHTML =
        '<div class="flex items-center gap-1 bg-surface-container p-1 rounded border border-outline self-start">' +
        '<button type="button" data-tipo="particular" class="px-3 py-1 rounded font-label-md text-[13px]">Particular</button>' +
        '<button type="button" data-tipo="empresa" class="px-3 py-1 rounded font-label-md text-[13px]">Empresa</button></div>' +
        campo('Nombre', '<input data-n class="' + INPUT + '" value="' + (esNum ? '' : esc(q.value.trim())) + '">') +
        '<div data-f-tel>' + campo('Teléfono', '<input data-t type="tel" class="' + INPUT + '" placeholder="261 555-0000" value="' + (esNum ? esc(q.value.trim()) : '') + '">') + '</div>' +
        '<div data-f-cuit class="hidden">' + campo('CUIT', '<input data-c class="' + INPUT + '" placeholder="30-00000000-0">') + '</div>' +
        '<button type="button" data-guardar class="bg-primary text-on-primary rounded py-2 px-space-md font-label-md text-label-md flex items-center justify-center gap-1.5 hover:bg-primary-container active:scale-[0.98] transition-colors">' +
        '<span class="material-symbols-outlined text-[18px]">check</span>Guardar y usar</button>' +
        '<p class="text-[11px] text-on-surface-variant">Queda guardado en Clientes. Si el teléfono o el CUIT ya existen, se usa el cliente que ya está.</p>';
      nuevo.classList.remove('hidden');
      var tipo = 'particular';
      function pintarTipo() {
        $$('[data-tipo]', nuevo).forEach(function (b) {
          var on = b.dataset.tipo === tipo;
          b.className = 'px-3 py-1 rounded font-label-md text-[13px] ' + (on ? 'bg-surface-container-lowest text-primary border border-outline' : 'text-on-surface-variant hover:text-on-surface');
        });
        $('[data-f-tel]', nuevo).classList.toggle('hidden', tipo !== 'particular');
        $('[data-f-cuit]', nuevo).classList.toggle('hidden', tipo !== 'empresa');
      }
      $$('[data-tipo]', nuevo).forEach(function (b) { b.addEventListener('click', function () { tipo = b.dataset.tipo; pintarTipo(); }); });
      pintarTipo();
      $('[data-guardar]', nuevo).addEventListener('click', function () {
        var c = crearCliente(tipo, $('[data-n]', nuevo).value, $('[data-t]', nuevo).value, $('[data-c]', nuevo).value);
        if (c) elegir(c);
      });
      ($('[data-n]', nuevo).value ? $('[data-t]', nuevo) : $('[data-n]', nuevo)).focus();
    }
    q.addEventListener('input', buscar);
    if (inicial) setTimeout(function () { elegir(inicial); }, 0);
    return box;
  }

  function crearCliente(tipo, nombre, tel, cuit) {
    nombre = String(nombre || '').trim();
    if (!nombre) { toast('Falta el nombre', 'error'); return null; }
    if (tipo === 'particular' && soloDig(tel).length < 6) { toast('Falta el teléfono', 'error'); return null; }
    if (tipo === 'empresa' && soloDig(cuit).length !== 11) { toast('El CUIT tiene 11 números', 'error'); return null; }
    var dup = S.clientes.filter(function (c) {
      return (tipo === 'particular' && c.tel && soloDig(c.tel) === soloDig(tel)) ||
        (tipo === 'empresa' && c.cuit && soloDig(c.cuit) === soloDig(cuit));
    })[0];
    if (dup) { toast('Ya existía: ' + dup.nombre + '. Se usa ese.'); return dup; }
    var c = { id: 'c' + Date.now(), tipo: tipo, nombre: nombre };
    if (tipo === 'particular') c.tel = tel.trim(); else c.cuit = cuit.trim();
    S.clientes.push(c); save();
    toast('Cliente guardado: ' + nombre);
    return c;
  }

  // ── Menú: usuario, módulos ocultos, logo ──────────────────────────
  var USUARIOS = { hernan: ['Hernán · Dueño', 'Administración'], marta: ['Marta · Mostrador', 'Turno mañana'] };
  function vistaPermitida(v) {
    if (S.usuario !== 'hernan' && SOLO_DUENO.indexOf(v) >= 0) return false;
    if (NO_OCULTABLES.indexOf(v) < 0 && S.ocultos.indexOf(v) >= 0) return false;
    return true;
  }
  function pintarMenu() {
    $$('[data-nav]').forEach(function (a) { a.style.display = vistaPermitida(a.dataset.nav) ? '' : 'none'; });
    var u = USUARIOS[S.usuario];
    var n = $('[data-user-name]'), r = $('[data-user-role]');
    if (n) n.textContent = u[0]; if (r) r.textContent = u[1];
    $$('[data-logo]').forEach(function (el) {
      if (S.negocio.logo) el.innerHTML = '<img src="' + S.negocio.logo + '" alt="CLEANBOX" class="w-full h-full object-contain bg-surface-container-lowest">';
    });
  }
  var VISTA = document.body.dataset.view;
  if (!vistaPermitida(VISTA)) { location.replace('index.html'); return; }
  pintarMenu();
  var sw = $('[data-switch-user]');
  if (sw) sw.addEventListener('click', function () {
    S.usuario = S.usuario === 'hernan' ? 'marta' : 'hernan'; save();
    toast('Ahora: ' + USUARIOS[S.usuario][0]);
    if (!vistaPermitida(VISTA)) location.replace('index.html'); else pintarMenu();
  });

  // Bibliotecas locales: se cargan únicamente al descargar, sin enviar datos.
  var bibliotecas = {}, generandoPDF = {};
  function biblioteca(nombre, archivo) {
    if (window[nombre]) return Promise.resolve(window[nombre]);
    if (!bibliotecas[nombre]) bibliotecas[nombre] = new Promise(function (resolve, reject) {
      var script = document.createElement('script'); script.src = 'vendor/' + archivo;
      script.onload = function () { if (window[nombre]) resolve(window[nombre]); else fallo(); };
      function fallo() { delete bibliotecas[nombre]; script.remove(); reject(new Error('No se pudo cargar la descarga')); }
      script.onerror = fallo; document.head.appendChild(script);
    });
    return bibliotecas[nombre];
  }
  function descargarArchivo(bytes, tipo, nombre) {
    var url = URL.createObjectURL(new Blob([bytes], { type: tipo })), a = document.createElement('a');
    a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }
  async function descargarRemito(v, ver) {
    if (generandoPDF[v.remito]) return;
    var ventana = ver ? window.open('', '_blank') : null;
    if (ver && !ventana) { toast('El navegador bloqueó la vista A4. Habilitá la ventana y volvé a intentar.', 'error'); return; }
    if (ventana) { ventana.document.title = 'Remito A4'; ventana.document.body.textContent = 'Generando vista A4 del remito…'; }
    generandoPDF[v.remito] = true;
    var conPrecios = !v.sinPrecios;
    toast('Generando PDF del remito…');
    try {
      var lib = await biblioteca('PDFLib', 'pdf-lib-1.17.1.min.js'), pdf = await lib.PDFDocument.create();
      pdf.setTitle('Remito ' + v.remito + ' · CLEANBOX · A4');
      var normal = await pdf.embedFont(lib.StandardFonts.Helvetica), negrita = await pdf.embedFont(lib.StandardFonts.HelveticaBold);
      var page, y, color = lib.rgb(23 / 255, 38 / 255, 47 / 255);
      var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
      function nueva() { page = pdf.addPage([595.28, 841.89]); y = 790; }
      function ancho(s, font, size) { try { return font.widthOfTextAtSize(s, size); } catch (e) { ctx.font = size + 'px Arial'; return ctx.measureText(s).width; } }
      function envolver(s, max, font, size) {
        var lineas = [];
        String(s == null ? '' : s).replace(/\r/g, '').split('\n').forEach(function (parrafo) {
          var linea = '';
          Array.from(parrafo).forEach(function (c) { if (linea && ancho(linea + c, font, size) > max) { lineas.push(linea); linea = ''; } linea += c; });
          lineas.push(linea);
        });
        return lineas;
      }
      async function dibujar(s, x, yy, size, font) {
        try { page.drawText(s, { x: x, y: yy, size: size, font: font, color: color }); }
        catch (e) {
          // Conserva caracteres fuera de WinAnsi (por ejemplo, símbolos en notas).
          canvas.width = Math.ceil(ancho(s, font, size) * 3) + 6; canvas.height = Math.ceil(size * 4.5);
          ctx.font = size * 3 + 'px Arial'; ctx.fillStyle = '#17262f'; ctx.textBaseline = 'top'; ctx.fillText(s, 0, 0);
          var img = await pdf.embedPng(canvas.toDataURL('image/png'));
          page.drawImage(img, { x: x, y: yy - size * 0.3, width: canvas.width / 3, height: canvas.height / 3 });
        }
      }
      async function texto(s, size, bold) {
        size = size || 11; var font = bold ? negrita : normal;
        var lineas = envolver(s, 515, font, size);
        for (var i = 0; i < lineas.length; i++) { if (y < 65) nueva(); await dibujar(lineas[i], 40, y, size, font); y -= size + 5; }
      }
      nueva();
      if (S.negocio.logo && /^data:image\//.test(S.negocio.logo)) {
        var logo = await new Promise(function (resolve, reject) { var img = new Image(); img.onload = function () { resolve(img); }; img.onerror = reject; img.src = S.negocio.logo; });
        var lc = document.createElement('canvas'); lc.width = logo.naturalWidth; lc.height = logo.naturalHeight; lc.getContext('2d').drawImage(logo, 0, 0);
        var lp = await pdf.embedPng(lc.toDataURL('image/png')), escala = Math.min(100 / lp.width, 50 / lp.height);
        page.drawImage(lp, { x: 40, y: y - lp.height * escala, width: lp.width * escala, height: lp.height * escala }); y -= lp.height * escala + 15;
      }
      await texto(S.negocio.nombre || 'CLEANBOX Tintorería', 19, true);
      await texto(S.negocio.direccion + ' · Tel: ' + S.negocio.telefono, 10);
      y -= 12; await texto('REMITO ' + v.remito, 15, true);
      await texto('Fecha: ' + (v.iso || v.fecha || 'Sin fecha') + ' ' + (v.hora || ''));
      await texto('Cliente: ' + v.cliente, 12, true);
      if (v.cuit) await texto('CUIT: ' + v.cuit);
      if (v.pedido) await texto('Pedido: ' + v.pedido);
      if (v.entrega) await texto('Fecha de entrega: ' + v.entrega);
      y -= 12;
      await texto('Prendas y servicios', 11, true);
      for (var it of (v.items || [])) {
        await texto(it.cant + ' × ' + it.nombre);
        if (conPrecios) await texto('Unitario: ' + plata(it.precio) + '     Importe: ' + plata(it.cant * it.precio), 10);
        y -= 4;
      }
      if (!v.items) await texto(v.detalle || 'Sin detalle de artículos');
      if (conPrecios) {
        y -= 8;
        if (v.descuento) await texto('Descuento: ' + plata(v.descuento));
        await texto('TOTAL: ' + plata(v.total), 14, true);
        if (v.cuentaEmpresa) await texto('Remito de empresa: se factura en forma mensual.', 10);
        else {
          await texto('Pagado: ' + plata(cobrado(v)) + '     Saldo pendiente: ' + plata(saldo(v)), 12, true);
          for (var p of pagos(v)) await texto(p.iso + ' · ' + p.medio + ': ' + plata(p.importe), 10);
        }
      }
      if (v.observaciones) { y -= 8; await texto('Observaciones', 11, true); await texto(v.observaciones); }
      y -= 12; await texto(S.negocio.pie || '', 9);
      pdf.getPages().forEach(function (pagina, i) {
        pagina.drawText('DOCUMENTO NO VÁLIDO COMO FACTURA', { x: 40, y: 35, size: 9, font: normal, color: color });
        pagina.drawText((i + 1) + ' / ' + pdf.getPageCount(), { x: 515, y: 35, size: 9, font: normal, color: color });
      });
      var bytes = await pdf.save();
      if (ver) {
        var url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        if (ventana.closed) { URL.revokeObjectURL(url); return; }
        ventana.location.replace(url);
        var limpieza = setInterval(function () { if (ventana.closed) { clearInterval(limpieza); URL.revokeObjectURL(url); } }, 1000);
      } else {
        descargarArchivo(bytes, 'application/pdf', 'CLEANBOX-' + v.remito.replace(/[^a-zA-Z0-9_-]/g, '') + (conPrecios ? '' : '-sin-precios') + '.pdf');
        toast('PDF del remito descargado');
      }
    } catch (e) { if (ventana && !ventana.closed) ventana.close(); toast('No se pudo generar el PDF. Volvé a intentar.', 'error'); }
    finally { delete generandoPDF[v.remito]; }
  }

  // Factura A4: mismo motor local que el remito. Devuelve true si se generó.
  async function facturaPDF(f, ver) {
    var clave = 'factura ' + f.numero;
    if (generandoPDF[clave]) return false;
    var ventana = ver ? window.open('', '_blank') : null;
    if (ver && !ventana) { toast('El navegador bloqueó la vista A4. Habilitá la ventana y volvé a intentar.', 'error'); return false; }
    if (ventana) { ventana.document.title = 'Factura ' + f.numero; ventana.document.body.textContent = 'Generando la factura en A4…'; }
    generandoPDF[clave] = true;
    try {
      var lib = await biblioteca('PDFLib', 'pdf-lib-1.17.1.min.js'), pdf = await lib.PDFDocument.create();
      pdf.setTitle('Factura ' + f.numero + ' · CLEANBOX');
      var fN = await pdf.embedFont(lib.StandardFonts.Helvetica), fB = await pdf.embedFont(lib.StandardFonts.HelveticaBold);
      // Paleta del DESIGN.md: tinta, primary, primary-fixed, outline y surface-container-low.
      var tinta = lib.rgb(23 / 255, 38 / 255, 47 / 255), primario = lib.rgb(0, 93 / 255, 121 / 255), celeste = lib.rgb(191 / 255, 233 / 255, 1),
        borde = lib.rgb(185 / 255, 201 / 255, 210 / 255), banda = lib.rgb(238 / 255, 244 / 255, 247 / 255), gris = lib.rgb(63 / 255, 72 / 255, 77 / 255), blanco = lib.rgb(1, 1, 1);
      var W = 595.28, H = 841.89, M = 40, page, y;
      var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
      var im = importesFactura(f), A = f.tipo === 'A';
      function ancho(s, font, size) { try { return font.widthOfTextAtSize(s, size); } catch (e) { ctx.font = size + 'px Arial'; return ctx.measureText(s).width; } }
      async function txt(s, x, yy, size, font, color, alinear) {
        s = String(s == null ? '' : s); var w = ancho(s, font, size);
        if (alinear === 'der') x -= w; if (alinear === 'centro') x -= w / 2;
        try { page.drawText(s, { x: x, y: yy, size: size, font: font, color: color || tinta }); }
        catch (e) {
          canvas.width = Math.ceil(w * 3) + 6; canvas.height = Math.ceil(size * 4.5);
          ctx.font = (font === fB ? 'bold ' : '') + size * 3 + 'px Arial'; ctx.fillStyle = '#17262f'; ctx.textBaseline = 'top'; ctx.fillText(s, 0, 0);
          var img = await pdf.embedPng(canvas.toDataURL('image/png'));
          page.drawImage(img, { x: x, y: yy - size * 0.3, width: canvas.width / 3, height: canvas.height / 3 });
        }
      }
      function envolver(s, max, font, size) {
        var lineas = [];
        String(s == null ? '' : s).replace(/\r/g, '').split('\n').forEach(function (parrafo) {
          var linea = '';
          parrafo.split(/(\s+)/).forEach(function (pal) {
            if (linea && ancho(linea + pal, font, size) > max) { lineas.push(linea.trim()); linea = ''; }
            while (ancho(pal, font, size) > max) { var corte = pal.length; while (corte > 1 && ancho(pal.slice(0, corte), font, size) > max) corte--; lineas.push(pal.slice(0, corte)); pal = pal.slice(corte); }
            linea += pal;
          });
          lineas.push(linea.trim());
        });
        return lineas;
      }
      function caja(x, yy, w, h, relleno, linea) { var o = { x: x, y: yy, width: w, height: h }; if (relleno) o.color = relleno; if (linea) { o.borderColor = linea; o.borderWidth = 1; } page.drawRectangle(o); }
      var logo = null;
      if (S.negocio.logo && /^data:image\//.test(S.negocio.logo)) {
        var imgLogo = await new Promise(function (resolve, reject) { var img = new Image(); img.onload = function () { resolve(img); }; img.onerror = reject; img.src = S.negocio.logo; });
        var lc = document.createElement('canvas'); lc.width = imgLogo.naturalWidth; lc.height = imgLogo.naturalHeight; lc.getContext('2d').drawImage(imgLogo, 0, 0);
        logo = await pdf.embedPng(lc.toDataURL('image/png'));
      }
      var COL = { cant: 345, unit: 445, sub: W - M - 10 };
      async function cabeceraTabla() {
        caja(M, y - 22, W - 2 * M, 22, celeste);
        await txt('Descripción', M + 10, y - 15, 9, fB, primario); await txt('Cant.', COL.cant, y - 15, 9, fB, primario, 'der');
        await txt(A ? 'P. unit. neto' : 'P. unitario', COL.unit, y - 15, 9, fB, primario, 'der'); await txt(A ? 'Subtotal neto' : 'Subtotal', COL.sub, y - 15, 9, fB, primario, 'der');
        y -= 22;
      }
      // Página 1: encabezado fiscal
      page = pdf.addPage([W, H]); y = H - M;
      caja(M, y - 128, W - 2 * M, 128, null, borde);
      page.drawLine({ start: { x: W / 2, y: y - 54 }, end: { x: W / 2, y: y - 128 }, thickness: 1, color: borde });
      caja(W / 2 - 25, y - 54, 50, 54, blanco, tinta);
      await txt(f.tipo, W / 2, y - 34, 30, fB, tinta, 'centro'); await txt(A ? 'COD. 01' : 'COD. 06', W / 2, y - 48, 7, fN, gris, 'centro');
      var yl = y - 18;
      if (logo) { var esc1 = Math.min(130 / logo.width, 46 / logo.height); page.drawImage(logo, { x: M + 12, y: yl - logo.height * esc1 + 6, width: logo.width * esc1, height: logo.height * esc1 }); yl -= logo.height * esc1 + 6; }
      else { await txt('CLEANBOX', M + 12, yl - 8, 20, fB, primario); yl -= 22; }
      await txt(S.negocio.nombre || 'CLEANBOX Tintorería', M + 12, yl - 8, 11, fB); yl -= 14;
      for (var dl of envolver(S.negocio.direccion || '', 200, fN, 8.5)) { await txt(dl, M + 12, yl - 8, 8.5, fN, gris); yl -= 11; }
      await txt('Tel: ' + (S.negocio.telefono || ''), M + 12, yl - 8, 8.5, fN, gris); yl -= 11;
      await txt('IVA Responsable Inscripto', M + 12, yl - 8, 8.5, fN, gris);
      var xr = W / 2 + 40;
      await txt('FACTURA', xr, y - 28, 20, fB, primario);
      await txt('N° ' + f.numero.replace(/^[AB] /, ''), xr, y - 46, 11, fB);
      await txt('Fecha de emisión: ' + fechaCorta(f.iso) + '/' + f.iso.slice(0, 4), xr, y - 62, 9, fN);
      if (f.periodo) await txt('Período facturado: ' + f.periodo, xr, y - 76, 9, fN);
      var notaFiscal = envolver('CUIT, ingresos brutos e inicio de actividades del emisor: se completan con el alta en ARCA.', W - M - xr - 10, fN, 7);
      for (var ni = 0; ni < notaFiscal.length; ni++) await txt(notaFiscal[ni], xr, y - 98 - ni * 9, 7, fN, gris);
      y -= 140;
      // Receptor
      var alto = f.oc ? 62 : 50;
      caja(M, y - alto, W - 2 * M, alto, banda, borde);
      await txt('Cliente: ' + f.cliente, M + 12, y - 18, 11, fB);
      await txt(A ? 'CUIT: ' + (f.cuit || '—') + '   ·   IVA Responsable Inscripto' : 'Consumidor final', M + 12, y - 33, 9, fN, gris);
      if (f.oc) await txt('Orden de compra: ' + f.oc, M + 12, y - 47, 9, fB);
      y -= alto + 14;
      await cabeceraTabla();
      for (var i = 0; i < f.renglones.length; i++) {
        var r = f.renglones[i], lineas = envolver(r.nombre, 250, fN, 10), h = lineas.length * 13 + 9;
        if (y - h < 175) { page = pdf.addPage([W, H]); y = H - M; await cabeceraTabla(); }
        if (i % 2) caja(M, y - h, W - 2 * M, h, banda);
        for (var li = 0; li < lineas.length; li++) await txt(lineas[li], M + 10, y - 15 - li * 13, 10, fN);
        var unit = A ? r.precio / 1.21 : r.precio;
        await txt(String(r.cant), COL.cant, y - 15, 10, fN, tinta, 'der');
        await txt(A ? plata2(unit) : plata(unit), COL.unit, y - 15, 10, fN, tinta, 'der');
        await txt(A ? plata2(centavos(unit * r.cant)) : plata(unit * r.cant), COL.sub, y - 15, 10, fB, tinta, 'der');
        y -= h;
      }
      page.drawLine({ start: { x: M, y: y }, end: { x: W - M, y: y }, thickness: 1, color: borde });
      y -= 16;
      // Observaciones a la izquierda, totales a la derecha
      var obsLineas = f.observaciones ? envolver(f.observaciones, 270, fN, 9) : [];
      var altoTot = A ? 78 : 40, altoObs = obsLineas.length ? obsLineas.length * 12 + 26 : 0;
      if (y - Math.max(altoTot, altoObs) < 80) { page = pdf.addPage([W, H]); y = H - M; }
      if (obsLineas.length) {
        caja(M, y - altoObs, 290, altoObs, null, borde);
        await txt('Observaciones', M + 10, y - 15, 9, fB, primario);
        for (var oi = 0; oi < obsLineas.length; oi++) await txt(obsLineas[oi], M + 10, y - 29 - oi * 12, 9, fN);
      }
      var xt = W - M - 200, yt = y;
      if (A) {
        await txt('Neto gravado', xt + 10, yt - 14, 10, fN); await txt(plata2(im.neto), W - M - 10, yt - 14, 10, fN, tinta, 'der');
        await txt('IVA 21%', xt + 10, yt - 30, 10, fN); await txt(plata2(im.iva), W - M - 10, yt - 30, 10, fN, tinta, 'der');
        yt -= 40;
      }
      caja(xt, yt - 34, 200, 34, primario);
      await txt('TOTAL', xt + 10, yt - 22, 12, fB, blanco); await txt(plata(im.total), W - M - 10, yt - 23, 15, fB, blanco, 'der');
      if (!A) await txt('IVA incluido', xt + 10, yt - 46, 8, fN, gris);
      pdf.getPages().forEach(function (pagina, n) {
        pagina.drawLine({ start: { x: M, y: 58 }, end: { x: W - M, y: 58 }, thickness: 1, color: borde });
        pagina.drawText('DEMO SIN VALIDEZ FISCAL · Sin CAE ni código QR de ARCA', { x: M, y: 42, size: 8, font: fB, color: gris });
        pagina.drawText((n + 1) + ' / ' + pdf.getPageCount(), { x: W - M - 24, y: 42, size: 8, font: fN, color: gris });
      });
      var bytes = await pdf.save();
      if (ver) {
        var url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        if (ventana.closed) { URL.revokeObjectURL(url); return false; }
        ventana.location.replace(url);
        var limpieza = setInterval(function () { if (ventana.closed) { clearInterval(limpieza); URL.revokeObjectURL(url); } }, 1000);
      } else {
        descargarArchivo(bytes, 'application/pdf', 'CLEANBOX-Factura-' + f.numero.replace(/[^A-Za-z0-9]+/g, '-') + '.pdf');
        toast('PDF de la factura descargado');
      }
      return true;
    } catch (e) { if (ventana && !ventana.closed) ventana.close(); toast('No se pudo generar la factura. Volvé a intentar.', 'error'); return false; }
    finally { delete generandoPDF[clave]; }
  }

  // ── Impresión de ticket/remito 80 mm (por duplicado) ──────────────
  function imprimirTicket(v) {
    var N = S.negocio, conPrecios = !v.sinPrecios;
    var copia = function (leyenda) {
      return '<div class="t">' + (N.logo ? '<img src="' + N.logo + '" class="logo">' : '<div class="marca">CLEANBOX</div>') +
        '<div class="c">TINTORERÍA</div><div class="c s">' + esc(N.direccion) + '<br>Tel: ' + esc(N.telefono) + '</div><hr>' +
        '<div class="f"><b>' + (v.tipo === 'empresa' ? 'REMITO ' + v.remito : 'TICKET ' + v.ticket) + '</b><span>' + esc(v.fecha || v.iso) + ' ' + esc(v.hora) + '</span></div>' +
        '<div>Cliente: ' + esc(v.cliente) + '</div>' + (v.cuit ? '<div class="s">CUIT: ' + esc(v.cuit) + '</div>' : '') +
        (v.pedido ? '<div class="s">Pedido ' + esc(v.pedido) + '</div>' : '') + '<hr>' +
        (v.items || []).map(function (i) { return '<div class="f"><span>' + i.cant + ' ' + esc(i.nombre) + '</span>' + (conPrecios ? '<span>' + plata(i.cant * i.precio) + '</span>' : '') + '</div>'; }).join('') +
        (!v.items ? '<div>' + esc(v.detalle) + '</div>' : '') +
        (conPrecios && v.descuento ? '<div class="f s"><span>Descuento</span><span>-' + plata(v.descuento) + '</span></div>' : '') +
        (conPrecios ? '<hr><div class="f tot"><span>TOTAL</span><span>' + plata(v.total) + '</span></div>' +
        (v.cuentaEmpresa ? '<div class="s">Remito de empresa · se factura en forma mensual</div>' :
        '<div class="f"><span>Pagado</span><span>' + plata(cobrado(v)) + '</span></div><div class="f"><b>Saldo pendiente</b><b>' + plata(saldo(v)) + '</b></div>' +
        '<div class="s">' + estadoCobro(v) + '</div>' + pagos(v).map(function (p) { return '<div class="s">' + esc(p.iso) + ' · ' + esc(p.medio) + ': ' + plata(p.importe) + '</div>'; }).join('')) : '') +
        (v.entrega ? '<div><b>Fecha de entrega: ' + esc(v.entrega) + '</b></div>' : '') +
        (v.observaciones ? '<hr><div class="obs"><b>Observaciones:</b><br>' + esc(v.observaciones) + '</div>' : '') +
        '<hr><div class="c s">' + esc(N.pie) + '</div><div class="ley">' + leyenda + '</div><div class="c s">DOCUMENTO NO VÁLIDO COMO FACTURA</div></div>';
    };
    var html = '<!doctype html><html><head><meta charset="utf-8"><title>Ticket</title><style>' +
      '@page{size:80mm auto;margin:0}body{margin:0;font:12px/1.35 "Courier New",monospace;color:#17262f}' +
      '.t{width:72mm;padding:4mm;page-break-after:always}.c{text-align:center}.s{font-size:10px}.marca{text-align:center;font:700 18px Arial;letter-spacing:1px}' +
      '.logo{display:block;margin:0 auto 2mm;max-width:40mm;max-height:24mm}hr{border:0;border-top:1px dashed #4b5c66;margin:2mm 0}' +
      '.f{display:flex;justify-content:space-between;gap:2mm}.tot{font-size:15px;font-weight:700}.ley{border:1px solid #17262f;text-align:center;font-weight:700;margin:2mm 0;padding:1mm}' +
      '.f>span:first-child{min-width:0;overflow-wrap:anywhere}.f>span:last-child{white-space:nowrap}.obs{white-space:pre-wrap;overflow-wrap:anywhere}' +
      '</style></head><body>' + copia('ORIGINAL CLIENTE') + (N.duplicado ? copia('DUPLICADO LOCAL') : '') +
      '<script>window.onload=function(){window.print()}<\/script></body></html>';
    var w = window.open('', '_blank', 'width=420,height=720');
    if (!w) { toast('El navegador bloqueó la ventana de impresión', 'error'); return; }
    w.document.write(html); w.document.close();
  }

  // ── PEDIDOS ───────────────────────────────────────────────────────
  if (VISTA === 'pedidos') (function () {
    var COLS = { recibido: 'col-recibido', preparacion: 'col-preparacion', listo: 'col-listo' };
    var filtro = 'todos';
    // Plantilla tomada del HTML de Stitch (etiqueta de tintorería)
    function tarjeta(p) {
      var listo = p.estado === 'listo', prep = p.estado === 'preparacion';
      var remito = ventaPedido(p), prendas = remito ? remito.items : p.items;
      var detalle = prendas && prendas.length ? prendas.map(function (it) { return it.cant + ' ' + it.nombre; }).join(' · ') : p.detalle;
      var numCls = prep ? 'text-secondary' : 'text-primary';
      var cab = listo ? '<span class="text-[10px] tracking-widest text-tertiary font-mono font-bold uppercase">LISTO PARA RETIRAR</span>'
        : '<span class="text-[10px] tracking-widest text-on-surface-variant font-mono uppercase">TICKET DE MOSTRADOR</span>';
      var derecha = (listo && p.entrega === HOY)
        ? '<span class="font-label-md text-xs font-bold text-tertiary bg-tertiary-fixed px-2 py-0.5 rounded border border-outline-variant flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">schedule</span>Entrega hoy</span>'
        : '<span class="text-xs text-on-surface-variant font-medium">Recepción ' + esc(p.hora) + '</span>';
      var meta = (detalle ? '<span class="font-medium text-on-surface">' + esc(detalle) + '</span>' : '') +
        (!remito ? '<button type="button" data-acc="prendas" class="px-2 py-1 border border-primary rounded text-primary font-bold hover:bg-primary-fixed">' + (prendas && prendas.length ? 'Editar prendas' : 'Completar prendas') + '</button>' : '') +
        (listo && p.nota ? '<span class="text-on-surface-variant font-medium">' + esc(p.nota) + '</span>'
          : '<span class="flex items-center gap-1 font-medium text-on-surface-variant"><span class="material-symbols-outlined text-[14px]">event</span>' + entregaTxt(p.entrega) + '</span>');
      var accion = listo
        ? '<button data-acc="entregar" class="font-label-md text-xs font-bold text-primary hover:text-on-primary-fixed-variant bg-surface-container hover:bg-surface-container-high px-2.5 py-1 rounded border border-outline flex items-center gap-1 active:scale-[0.98]" type="button"><span>Entregar y cobrar</span><span class="material-symbols-outlined text-[14px]">arrow_forward</span></button>'
        : prep
          ? '<button data-acc="listo" class="font-label-md text-xs font-bold text-secondary hover:text-on-secondary-container flex items-center gap-1 hover:underline active:scale-[0.98]" type="button"><span>Marcar listo</span><span class="material-symbols-outlined text-[14px]">arrow_forward</span></button>'
          : '<button data-acc="preparar" class="font-label-md text-xs font-bold text-primary hover:text-on-primary-fixed-variant flex items-center gap-1 hover:underline active:scale-[0.98]" type="button"><span>Pasar a preparación</span><span class="material-symbols-outlined text-[14px]">arrow_forward</span></button>';
      return '<article data-cb-pedido="' + esc(p.estado) + '" data-n="' + p.n + '" class="relative bg-surface border border-outline rounded-lg flex flex-col overflow-hidden">' +
        '<div class="h-5 bg-surface-container-low border-b border-dashed border-outline px-3 flex items-center justify-between">' +
        '<div class="w-2.5 h-2.5 rounded-full bg-outline-variant -ml-4 border border-outline"></div>' + cab +
        '<div class="w-2.5 h-2.5 rounded-full bg-outline-variant -mr-4 border border-outline"></div></div>' +
        '<div class="p-3 flex flex-col"><div class="flex items-baseline justify-between mb-1"><span class="font-headline-md text-headline-md font-bold ' + numCls + '">#' + p.n + '</span>' + derecha + '</div>' +
        '<div class="font-label-md text-label-md text-on-surface mb-2">' + esc(p.cliente) + '</div>' +
        '<div class="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant mb-3">' + meta + '</div>' +
        '<div class="pt-2 border-t border-outline flex flex-wrap justify-end gap-2"><button type="button" data-acc="remito" class="' + BTN + '">' + (remito ? (remito.cuentaEmpresa ? 'Ver remito' : 'Ver remito / pagos') : 'Remito / anticipo') + '</button>' + accion + '</div></div></article>';
    }
    function pasa(p) {
      if (filtro === 'hoy') return p.entrega === HOY;
      if (filtro === 'manana') return p.entrega === addDias(HOY, 1);
      if (filtro === 'semana') return p.entrega <= addDias(HOY, 7);
      return true;
    }
    function render() {
      Object.keys(COLS).forEach(function (est) {
        var sec = $('section[aria-labelledby="' + COLS[est] + '"]');
        var lista = S.pedidos.filter(function (p) { return p.estado === est && pasa(p); });
        $('div.p-3.flex.flex-col.gap-3', sec).innerHTML = lista.map(tarjeta).join('') ||
          '<p class="text-xs text-on-surface-variant text-center py-space-md">Sin pedidos</p>';
        var cont = $$('span', $('div', sec)).pop(); cont.textContent = lista.length;
      });
      var activos = S.pedidos.filter(function (p) { return p.estado !== 'entregado'; });
      var tabTodos = byText('button', 'Todos')[0]; if (tabTodos) tabTodos.textContent = 'Todos (' + activos.length + ')';
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-acc]'); if (!b) return;
      var p = S.pedidos.filter(function (x) { return x.n === +b.closest('article').dataset.n; })[0];
      var v = ventaPedido(p);
      if (b.dataset.acc === 'prendas') { editarPedido(p); return; }
      if (b.dataset.acc === 'remito' || b.dataset.acc === 'entregar' && v) {
        if (v) verRemito(v, render); else location.href = 'venta.html?pedido=' + p.n;
        return;
      }
      if (b.dataset.acc === 'preparar') p.estado = 'preparacion';
      else if (b.dataset.acc === 'listo') p.estado = 'listo';
      else { location.href = 'venta.html?pedido=' + p.n + '&entregar=1'; return; }
      save(); render();
    });
    // Pestañas (clases exactas de Stitch)
    var TAB_ON = 'border-b-2 border-primary text-primary pb-space-sm font-label-md text-label-md transition-colors';
    var TAB_OFF = 'text-on-surface-variant pb-space-sm font-label-md text-label-md hover:text-on-surface transition-colors';
    var tabs = $$('main > div:nth-of-type(1) > button');
    var claves = ['todos', 'hoy', 'manana', 'semana'];
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () {
        filtro = claves[i];
        tabs.forEach(function (o, j) { o.className = (j === i ? TAB_ON : TAB_OFF) + (j === 1 ? ' flex items-center gap-1.5' : ''); });
        render();
      });
    });
    // Recepción y carga posterior comparten artículos; el cobro sigue en Nueva venta.
    var recibir = byText('header button', 'Recibir pedido')[0] || $$('header button').filter(function (b) { return /Recibir pedido/.test(b.textContent); })[0];
    recibir.addEventListener('click', function () { editarPedido(null); });
    function editarPedido(pedido) {
      var emitido = ventaPedido(pedido); if (emitido) { verRemito(emitido, render); return; }
      var cli = pedido ? clienteRegistro(pedido) : null, entrega = pedido && pedido.entrega || addDias(HOY, 3);
      var prendas = JSON.parse(JSON.stringify(pedido && pedido.items || []));
      var cuerpo = document.createElement('div');
      cuerpo.className = 'flex flex-col gap-4';
      cuerpo.setAttribute('data-pedido-form', '');
      cuerpo.appendChild(selectorCliente(function (c) { cli = c; }, cli));
      var articulos = document.createElement('div'); articulos.className = 'flex flex-col gap-2';
      articulos.innerHTML = '<label class="' + LABEL + '" for="pedido-articulos">Prendas y cantidades <span class="font-normal">(opcional)</span></label>' +
        '<input id="pedido-articulos" data-ped-buscar aria-label="Buscar artículos del pedido" autocomplete="off" placeholder="Buscar artículo y agregar…" class="' + INPUT + '">' +
        '<div data-ped-resultados class="flex flex-col gap-1 max-h-36 overflow-y-auto"></div><div data-ped-items class="flex flex-col gap-2"></div>' +
        '<p data-ped-estimado role="status" class="text-xs text-on-surface-variant"></p>';
      cuerpo.appendChild(articulos);
      var buscar = $('[data-ped-buscar]', articulos), resultados = $('[data-ped-resultados]', articulos), lista = $('[data-ped-items]', articulos);
      function cantidadesValidas() { return prendas.every(function (it) { return Number.isSafeInteger(it.cant) && it.cant > 0 && importeValido(it.precio) && importeValido(it.cant * it.precio); }); }
      function estimado() {
        var texto = !prendas.length ? 'Podés guardar sin prendas y completarlas después desde el pedido.' : !cantidadesValidas() ? 'Revisá las cantidades: usá números enteros mayores a cero.' :
          'Unidades: ' + prendas.reduce(function (n, it) { return n + it.cant; }, 0) + ' · Estimado ' + plata(prendas.reduce(function (n, it) { return n + it.cant * it.precio; }, 0)) + ' · El cobro se confirma en Nueva venta.';
        $('[data-ped-estimado]', articulos).textContent = texto;
      }
      function pintarPrendas() {
        lista.innerHTML = prendas.map(function (it, i) {
          return '<div data-ped-renglon class="flex items-center gap-2 border border-outline rounded p-2">' +
            '<span class="flex-1 min-w-0 text-sm font-bold text-on-surface">' + esc(it.nombre) + '</span>' +
            '<input data-ped-cant="' + i + '" aria-label="Cantidad de ' + esc(it.nombre) + '" type="number" min="1" step="1" value="' + (Number.isFinite(it.cant) ? it.cant : '') + '" class="w-20 min-w-0 px-2 py-1 border border-outline rounded text-right text-on-surface bg-surface">' +
            '<button type="button" data-ped-quitar="' + i + '" aria-label="Quitar ' + esc(it.nombre) + '" class="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container"><span class="material-symbols-outlined text-[18px]">close</span></button></div>';
        }).join(''); estimado();
      }
      function buscarPrendas() {
        var q = norm(buscar.value);
        var encontrados = q ? S.precios.filter(function (it) { return norm(it.nombre).indexOf(q) >= 0; }).slice(0, 6) : [];
        resultados.innerHTML = encontrados.map(function (it) {
          return '<button type="button" data-ped-agregar="' + esc(it.nombre) + '" class="flex items-center justify-between gap-2 p-2 border border-outline rounded text-left text-sm text-on-surface hover:bg-primary-fixed"><span>' + esc(it.nombre) + '</span><span class="text-primary font-bold whitespace-nowrap">' + plata(it.precio) + ' +</span></button>';
        }).join('') || (q ? '<p class="text-xs text-on-surface-variant">Sin artículos con ese nombre.</p>' : '');
      }
      buscar.addEventListener('input', buscarPrendas);
      buscar.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var primero = $('button', resultados); if (primero) { e.preventDefault(); primero.click(); } } });
      resultados.addEventListener('click', function (e) {
        var b = e.target.closest('[data-ped-agregar]'); if (!b) return;
        var nombre = b.dataset.pedAgregar, it = prendas.filter(function (x) { return x.nombre === nombre; })[0];
        if (it) { if (!Number.isSafeInteger(it.cant) || it.cant < 1) it.cant = 0; it.cant++; }
        else prendas.push({ nombre: nombre, cant: 1, precio: precioDe(nombre) });
        buscar.value = ''; buscarPrendas(); pintarPrendas(); buscar.focus();
      });
      lista.addEventListener('input', function (e) { if (!e.target.hasAttribute('data-ped-cant')) return; prendas[+e.target.dataset.pedCant].cant = e.target.value === '' ? NaN : Number(e.target.value); estimado(); });
      lista.addEventListener('click', function (e) { var b = e.target.closest('[data-ped-quitar]'); if (b) { prendas.splice(+b.dataset.pedQuitar, 1); pintarPrendas(); buscar.focus(); } });
      pintarPrendas();
      var extra = document.createElement('div');
      extra.className = 'flex flex-col gap-4';
      extra.innerHTML = campo('Referencia adicional (opcional)', '<input data-det class="' + INPUT + '" placeholder="Ej. 6 bolsas pendientes de contar" value="' + esc(pedido && pedido.detalle || '') + '">') +
        campo('Observaciones para el remito (opcional)', '<textarea data-obs rows="2" class="' + INPUT + '" placeholder="Ej. Camisa con mancha en el cuello; saco con forro roto"></textarea>') +
        '<div><label class="' + LABEL + '">Fecha de entrega</label><div class="flex flex-wrap items-center gap-2">' +
        '<button type="button" data-d="1" class="px-3 py-1.5 rounded border border-outline font-label-md text-[13px] text-on-surface hover:bg-surface-container">Mañana</button>' +
        '<button type="button" data-d="3" class="px-3 py-1.5 rounded border border-primary bg-primary-container text-on-primary-container font-label-md text-[13px]">En 3 días</button>' +
        '<button type="button" data-d="7" class="px-3 py-1.5 rounded border border-outline font-label-md text-[13px] text-on-surface hover:bg-surface-container">En 1 semana</button>' +
        '<input data-fecha type="date" class="px-3 py-1.5 bg-background border border-outline rounded text-[14px] text-on-surface focus:outline-none focus:border-primary" value="' + entrega + '"></div></div>';
      cuerpo.appendChild(extra);
      $('[data-obs]', extra).value = pedido && pedido.observaciones || '';
      var fechaIn = $('[data-fecha]', extra);
      $$('[data-d]', extra).forEach(function (b) {
        b.addEventListener('click', function () {
          fechaIn.value = addDias(HOY, +b.dataset.d);
          $$('[data-d]', extra).forEach(function (o) { o.className = 'px-3 py-1.5 rounded border font-label-md text-[13px] ' + (o === b ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline text-on-surface hover:bg-surface-container'); });
        });
      });
      function guardar(irCobro) {
        if (!cli) { toast('Elegí o creá el cliente', 'error'); return false; }
        if (!cantidadesValidas()) { toast('Revisá las cantidades de las prendas', 'error'); return false; }
        if (!fechaValida(fechaIn.value)) { toast('Revisá la fecha de entrega', 'error'); fechaIn.focus(); return false; }
        var c = S.clientes.filter(function (x) { return x.id === cli.id; })[0];
        if (!c) { toast('Volvé a elegir el cliente', 'error'); return false; }
        var anterior = JSON.stringify(S);
        var p = pedido ? S.pedidos.filter(function (x) { return x.n === pedido.n; })[0] : { n: S.sigPedido, estado: 'recibido', hora: ahora(), iso: HOY };
        if (!p || ventaPedido(p)) { toast('El pedido ya tiene remito. Abrí ese comprobante para ver sus pagos.', 'error'); return false; }
        p.clienteId = c.id; p.cliente = c.nombre; p.detalle = $('[data-det]', extra).value.trim(); p.entrega = fechaIn.value;
        p.observaciones = $('[data-obs]', extra).value.trim(); p.items = JSON.parse(JSON.stringify(prendas));
        if (!pedido) { S.sigPedido++; S.pedidos.unshift(p); c.ultimo = fechaCorta(HOY); c.ultimoNro = '#' + p.n; }
        if (!save()) { S = JSON.parse(anterior); toast('No se pudo guardar el pedido. Volvé a intentar.', 'error'); return false; }
        render();
        if (irCobro) location.href = 'venta.html?pedido=' + p.n;
        else toast('Pedido #' + p.n + (pedido ? ' actualizado' : ' recibido'));
      }
      modal(pedido ? 'Completar pedido #' + pedido.n : 'Recibir pedido', cuerpo, [
        { texto: pedido ? 'Guardar cambios' : 'Guardar pedido', primario: true, accion: function () { return guardar(false); } },
        { texto: 'Guardar e ir a cobro', accion: function () { return guardar(true); } },
        { texto: 'Cancelar', accion: function () {} }
      ]);
    }
    render();
  })();

  // ── NUEVA VENTA ───────────────────────────────────────────────────
  if (VISTA === 'venta') (function () {
    var PRECIOS = {};
    var grilla = $('.grid.grid-cols-2');
    var botones = $$(':scope > button', grilla);
    var molde = botones[0];
    botones.forEach(function (b) { b.dataset.item = $('span.font-headline-md', b).textContent.trim(); });
    // Prendas de la lista marcadas "venta rápida" que Stitch no dibujó: se clonan del primer botón
    S.precios.forEach(function (p) {
      if (!p.rapida || botones.some(function (b) { return b.dataset.item === p.nombre; })) return;
      var nb = molde.cloneNode(true);
      $('span.font-headline-md', nb).textContent = p.nombre;
      var sub = $('div.mt-2 span.block', nb); if (sub) sub.textContent = '';
      nb.dataset.item = p.nombre; grilla.appendChild(nb); botones.push(nb);
    });
    botones.forEach(function (b) {
      var p = S.precios.filter(function (x) { return x.nombre === b.dataset.item; })[0];
      if (p && !p.rapida) { b.style.display = 'none'; b.dataset.oculto = '1'; }
      PRECIOS[b.dataset.item] = p ? p.precio : aNum($('div.mt-2 span.font-headline-md', b).textContent);
      $('div.mt-2 span.font-headline-md', b).textContent = plata(PRECIOS[b.dataset.item]);
    });
    var params = new URLSearchParams(location.search);
    var pedido = params.get('pedido') ? S.pedidos.filter(function (p) { return p.n === +params.get('pedido'); })[0] : null;
    if (ventaPedido(pedido)) { location.replace((ventaPedido(pedido).cuentaEmpresa ? 'remitos.html' : 'caja.html') + '?remito=' + encodeURIComponent(ventaPedido(pedido).remito)); return; }
    var cliente = pedido ? clienteRegistro(pedido) : (params.get('clienteId') ? S.clientes.filter(function (c) { return c.id === params.get('clienteId'); })[0] : params.get('cliente') ? clienteUnico(params.get('cliente')) : null);
    // Si no viene de un pedido ni de Clientes, arranca con el ejemplo de Stitch
    var items = pedido && Array.isArray(pedido.items) ? JSON.parse(JSON.stringify(pedido.items)) : [];
    if (!pedido && !cliente && !params.has('clienteId') && !params.has('cliente') && !params.has('pedido')) {
      cliente = clientePorNombre('Bodega Cerro Negro');
      items = [{ nombre: 'Bolsa de lavado institucional', cant: 5 }, { nombre: 'Mantel', cant: 2 }];
    }
    var descPct = !pedido && cliente && cliente.tipo === 'empresa' && items.length ? 10 : 0;
    var totalManual = null, formPago;

    // Tarjeta de cliente: se reemplaza por el selector con alta en el mismo paso
    var tarjetaCli = $('section .bg-surface-container-lowest.p-space-md');
    var fichaCli = $('div.flex.flex-wrap.items-center.justify-between', tarjetaCli);
    function pintarCliente() {
      var nom = $('span.font-headline-md', fichaCli), tipo = $('span.font-headline-md + span', fichaCli),
        sub = $('div.flex.flex-col > span.text-\\[13px\\]', fichaCli), pill = $('a', fichaCli);
      if (!cliente) {
        nom.textContent = 'Sin cliente'; tipo.textContent = '—'; sub.textContent = 'Tocá «Cambiar cliente» para elegir o crear uno';
      } else {
        nom.textContent = cliente.nombre;
        tipo.textContent = cliente.tipo === 'empresa' ? 'Empresa' : 'Particular';
        sub.textContent = cliente.tipo === 'empresa' ? 'CUIT ' + cliente.cuit + ' · Resp. Inscripto' : 'Tel ' + cliente.tel;
      }
      var cont = pill.parentElement;
      if (pedido) { $('span:last-child', pill).textContent = '#' + pedido.n + (pedido.detalle ? ' · ' + pedido.detalle : ''); cont.style.display = ''; }
      else if (!params.get('pedido') && items.length && cliente && cliente.nombre === 'Bodega Cerro Negro') cont.style.display = '';
      else cont.style.display = 'none';
    }
    byText('button', 'Cambiar cliente', tarjetaCli).concat($$('button', tarjetaCli).filter(function (b) { return /Cambiar cliente/.test(b.textContent); })).slice(0, 1).forEach(function (b) {
      b.addEventListener('click', function () {
        var elegido = null;
        var cuerpo = selectorCliente(function (c) { elegido = c; });
        modal('Cliente de la venta', cuerpo, [
          { texto: 'Usar este cliente', primario: true, accion: function () {
            if (!elegido) { toast('Elegí o creá el cliente', 'error'); return false; }
            if (pedido && (pedido.clienteId ? elegido.id !== pedido.clienteId : elegido.nombre !== pedido.cliente)) { toast('Este remito debe conservar el cliente del pedido', 'error'); return false; }
            cliente = elegido; if (cliente.tipo !== 'empresa') descPct = 0; pintarCliente(); render(); formPago.poner(modoInicial());
          } },
          { texto: 'Cancelar', accion: function () {} }
        ]);
      });
    });

    var colTicket = $('section.w-\\[380px\\]');
    var renglones = $$('div.flex.flex-col.gap-space-sm', colTicket)[0];
    var tituloRenglones = $('span', renglones).outerHTML;
    var bloqueTot = $('div.border-t.border-outline.pt-space-sm', colTicket);
    function descripcion(it) { return it.descripcion != null ? it.descripcion : it.nombre; }
    function unitario(it) { return it.precio != null ? it.precio : PRECIOS[it.nombre]; }
    function render() {
      // Renglones: plantilla de Stitch
      renglones.innerHTML = tituloRenglones + (items.length ? items.map(function (it, i) {
        return '<div data-renglon="' + i + '" class="p-space-sm rounded bg-surface-container-low border border-outline flex flex-col gap-2">' +
          '<label class="flex flex-col text-xs text-on-surface-variant">' +
          '<input data-descripcion="' + i + '" aria-label="Descripción del renglón ' + (i + 1) + '" placeholder="Descripción de la prenda" value="' + esc(descripcion(it)) + '" class="' + INPUT + ' font-bold"></label>' +
          '<div data-renglon-valores><label class="flex items-center gap-1 text-on-surface-variant">Unit. $' +
          '<input data-precio="' + i + '" aria-label="Precio unitario del renglón ' + (i + 1) + '" type="number" min="0" step="1" value="' + esc(it.precioEntrada != null ? it.precioEntrada : unitario(it)) + '" class="w-24 min-w-0 px-2 py-1.5 bg-surface-container-lowest border border-outline rounded text-on-surface focus:outline-none focus:border-primary"></label>' +
          // Cantidad escrita: pedido del cliente, 25/10 (más rápido que − y +)
          '<label data-cb-cantidad class="flex items-center gap-1 text-on-surface-variant">Cant.' +
          '<input data-cant="' + i + '" aria-label="Cantidad del renglón ' + (i + 1) + '" type="number" min="1" step="1" inputmode="numeric" value="' + (it.cant > 0 ? it.cant : '') + '" style="width:60px;text-align:center" class="px-2 py-1.5 bg-surface-container-lowest border border-outline rounded text-on-surface font-bold focus:outline-none focus:border-primary"></label>' +
          '<div class="text-right font-headline-md text-[16px] font-bold text-on-surface" data-importe>' + plata(it.cant * unitario(it)) + '</div>' +
          '<button type="button" data-quitar="' + i + '" aria-label="Quitar renglón ' + (i + 1) + '" title="Quitar" class="w-7 h-7 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container"><span class="material-symbols-outlined text-[18px]">close</span></button></div></div>';
      }).join('') : '<p class="text-[13px] text-on-surface-variant py-space-sm">Tocá una prenda de la izquierda para sumarla.</p>');
      pintarBotones();
      if (lista) pintarLista();
      return totales();
    }
    // Botones de la grilla: "N en ticket"
    function pintarBotones() {
      botones.forEach(function (b) {
        var it = items.filter(function (x) { return x.nombre === b.dataset.item; })[0];
        var badge = $('span.absolute', b);
        if (it) {
          b.className = b.className.replace('border-outline', 'border-primary').replace(' hover:border-primary', '');
          if (!badge) { badge = document.createElement('span'); badge.className = 'absolute top-2 right-2 px-1.5 py-0.5 bg-primary text-on-primary rounded text-[11px] font-bold'; b.classList.add('relative'); b.appendChild(badge); }
          badge.textContent = it.cant + ' en ticket';
          var ico = $('span.material-symbols-outlined', b); if (ico) ico.style.display = 'none';
          $('div', b).classList.add('pr-[76px]'); // deja lugar a la etiqueta "N en ticket"
        } else {
          b.className = b.className.replace('border-primary', 'border-outline');
          if (badge) badge.remove();
          var ico2 = $('span.material-symbols-outlined', b); if (ico2) ico2.style.display = '';
          $('div', b).classList.remove('pr-[76px]', 'pr-14');
        }
      });
    }
    // Al escribir se actualizan los importes sin reconstruir el campo ni perder el foco.
    function totales() {
      var sub = items.reduce(function (a, it) { return a + it.cant * unitario(it); }, 0);
      var desc = Math.round(sub * descPct / 100);
      var tot = totalManual != null ? totalManual : sub - desc;
      var filas = $$(':scope > div', bloqueTot);
      $(':scope > span:last-child', filas[0]).textContent = plata(sub);
      $('span.font-label-md', filas[1]).textContent = 'Descuento (' + descPct + '%)';
      $(':scope > span:last-child', filas[1]).textContent = desc ? '−' + plata(desc) : '$0';
      $(':scope > span', filas[2]).textContent = plata(tot);
      if (formPago) formPago.actualizar();
      return { sub: sub, desc: desc + (totalManual != null ? sub - desc - totalManual : 0), tot: tot };
    }
    renglones.addEventListener('input', function (e) {
      var inp = e.target;
      if (inp.hasAttribute('data-descripcion')) items[+inp.dataset.descripcion].descripcion = inp.value;
      if (inp.hasAttribute('data-precio')) {
        var it = items[+inp.dataset.precio];
        var valido = inp.value !== '' && inp.checkValidity() && Number.isFinite(Number(inp.value));
        inp.setAttribute('aria-invalid', String(!valido));
        it.precioEntrada = inp.value;
        it.precio = valido ? Number(inp.value) : 0;
        $('[data-importe]', inp.closest('[data-renglon]')).textContent = plata(it.cant * it.precio);
        totalManual = null; totales();
      }
      if (inp.hasAttribute('data-cant')) {
        var ic = items[+inp.dataset.cant], n = Number(inp.value);
        var ok = inp.value !== '' && Number.isSafeInteger(n) && n > 0;
        inp.setAttribute('aria-invalid', String(!ok));
        ic.cant = ok ? n : 0; // 0 no se guarda: cobrar() exige cantidad mayor a cero
        $('[data-importe]', inp.closest('[data-renglon]')).textContent = plata(ic.cant * unitario(ic));
        totalManual = null; totales(); pintarBotones();
        if (lista) pintarLista();
      }
    });
    var agregarRenglon = document.createElement('button');
    agregarRenglon.type = 'button';
    agregarRenglon.className = 'px-3 py-2 border border-outline rounded text-primary font-label-md text-[13px] hover:bg-surface-container focus:outline-primary';
    agregarRenglon.textContent = 'Agregar renglón libre';
    renglones.after(agregarRenglon);
    agregarRenglon.addEventListener('click', function () {
      items.push({ nombre: '', descripcion: '', cant: 1, precio: 0 });
      totalManual = null; render(); $('[data-descripcion="' + (items.length - 1) + '"]', renglones).focus();
    });
    botones.forEach(function (b) {
      b.addEventListener('click', function () {
        var it = items.filter(function (x) { return x.nombre === b.dataset.item; })[0];
        if (it) it.cant++; else items.push({ nombre: b.dataset.item, cant: 1 });
        totalManual = null; render();
      });
    });
    renglones.addEventListener('click', function (e) {
      var m = e.target.closest('[data-quitar]'); if (!m) return;
      items.splice(+m.dataset.quitar, 1);
      totalManual = null; render();
    });
    // Editar descuento y total en el lugar
    var lapices = $$('button[title]', bloqueTot);
    function editar(btn, valorActual, aplicar) {
      var fila = btn.closest('div.flex.justify-between');
      var dest = $(':scope > span:last-child', fila);
      var inp = document.createElement('input');
      inp.type = 'number'; inp.value = valorActual;
      inp.className = 'w-28 text-right px-2 py-0.5 bg-surface-container-lowest border border-primary rounded font-headline-md text-[16px] text-on-surface focus:outline-none';
      dest.replaceWith(inp); inp.focus(); inp.select();
      function fin() { aplicar(Number(inp.value) || 0); inp.replaceWith(dest); render(); }
      inp.addEventListener('blur', fin);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') inp.blur(); });
    }
    lapices[0].addEventListener('click', function () { editar(lapices[0], descPct, function (v) { descPct = Math.max(0, Math.min(100, v)); totalManual = null; }); });
    lapices[1].addEventListener('click', function () { editar(lapices[1], render().tot, function (v) { totalManual = v; }); });
    // Medio de pago (clases exactas de Stitch)
    var MP_ON = 'py-2 px-1 text-center font-label-md text-[13px] rounded bg-primary text-on-primary font-bold shadow-none';
    var MP_OFF = 'py-2 px-1 text-center font-label-md text-[13px] rounded text-on-surface-variant hover:bg-surface-container-low transition-colors';
    var mps = $$('.grid.grid-cols-3 > button', colTicket);
    var contMedios = mps[0].parentElement.parentElement;
    var tituloTicket = $('span.uppercase', colTicket), subTicket = tituloTicket && tituloTicket.nextElementSibling;
    function modoInicial() { return cliente && cliente.tipo === 'empresa' ? 'Empresa' : 'Efectivo'; }
    formPago = formularioPago(function () { return totalesSinActualizar(); }, modoInicial(), function () { return !!(cliente && cliente.tipo === 'empresa'); }, function (modo) {
      if (!tituloTicket) return;
      tituloTicket.textContent = modo === 'Empresa' ? 'Remito de empresa' : 'Ticket mostrador';
      subTicket.textContent = modo === 'Empresa' ? 'No entra en la caja · se factura desde Empresas' : 'Comprobante de cobro x servicios';
      colTicket.dataset.cbRemitoEmpresa = String(modo === 'Empresa');
      if (avisoRemito) avisoRemito.textContent = modo === 'Empresa' ? 'Confirmá prendas y cantidades antes de guardar. Si hay un error, se corrige y se reimprime desde Remitos.'
        : 'Confirmá prendas y total antes de guardar el remito o un anticipo. Después podés registrar pagos sobre este mismo comprobante.';
    });
    // Se evita llamar render/totales desde el formulario para conservar el foco al escribir.
    function totalesSinActualizar() {
      var sub = items.reduce(function (n, it) { return n + it.cant * unitario(it); }, 0);
      return totalManual != null ? totalManual : sub - Math.round(sub * descPct / 100);
    }
    contMedios.replaceChildren(formPago.elemento);
    var nroTicket = $('span.font-mono', colTicket);
    function nro() { nroTicket.textContent = '#T-' + ('0000' + S.sigTicket).slice(-4); }
    function cobrar(imprimir) {
      if (!cliente) { toast('Falta el cliente', 'error'); return; }
      if (!items.length) { toast('No hay prendas en el ticket', 'error'); return; }
      var invalido = $$('input', renglones).filter(function (inp) {
        return inp.hasAttribute('data-descripcion') ? !inp.value.trim() : inp.value === '' || !inp.checkValidity();
      })[0];
      if (invalido) { toast('Completá descripción, precio y cantidad válidos en cada renglón', 'error'); invalido.focus(); return; }
      if (ventaPedido(pedido)) { toast('Este pedido ya tiene remito. Abrilo desde Caja para registrar el pago.', 'error'); return; }
      var r = render();
      var nuevosPagos = formPago.leer(), cuenta = formPago.modo() === 'Empresa' && cliente.tipo === 'empresa';
      // En remitos de empresa el importe es informativo: puede quedar en $0 y lo valoriza el dueño al facturar.
      if (!nuevosPagos || !importeValido(r.tot) || (r.tot <= 0 && !cuenta) || items.some(function (it) { return !importeValido(unitario(it)) || !Number.isSafeInteger(it.cant) || it.cant <= 0 || !importeValido(unitario(it) * it.cant); })) { toast('Revisá total e importes del pago: usá pesos enteros válidos', 'error'); return; }
      var v = {
        ticket: 'T-' + ('0000' + S.sigTicket++).slice(-4), remito: 'R-' + ('0000' + S.sigRemito++).slice(-4),
        fecha: fechaCorta(HOY) + '/2026', iso: HOY, hora: ahora(), clienteId: cliente.id, cliente: cliente.nombre, tipo: cliente.tipo, cuit: cliente.cuit || '',
        items: items.map(function (it) { return { nombre: descripcion(it).trim(), cant: it.cant, precio: unitario(it) }; }),
        detalle: items.map(function (it) { return it.cant + ' ' + descripcion(it).trim().toLowerCase(); }).join(' + '),
        observaciones: observaciones.value.trim(),
        pagos: nuevosPagos.map(function (p) { return { medio: p.medio, importe: p.importe, iso: HOY, hora: ahora() }; }),
        descuento: r.desc, total: r.tot, medio: cuenta ? 'Empresa' : nuevosPagos.length > 1 ? 'Combinado' : nuevosPagos.length ? nuevosPagos[0].medio : 'Debe', pedido: pedido ? '#' + pedido.n : '', sinPrecios: sinPrecios.checked,
        descuentoPct: totalManual == null ? descPct : null,
        entrega: entregaIso ? (function (x) { return DIAS[x.getDay()] + ' ' + ('0' + x.getDate()).slice(-2) + '/' + ('0' + (x.getMonth() + 1)).slice(-2) + '/' + x.getFullYear(); })(d(entregaIso)) : ''
      };
      if (cuenta) v.cuentaEmpresa = true;
      S.ventas.push(v);
      var estadoAnterior = pedido && pedido.estado;
      if (pedido && params.get('entregar') === '1') { pedido.estado = 'entregado'; pedido.entregadoIso = HOY; }
      cliente.ultimo = fechaCorta(HOY); if (pedido) cliente.ultimoNro = '#' + pedido.n;
      if (!save()) { S.ventas.pop(); if (pedido) { pedido.estado = estadoAnterior; delete pedido.entregadoIso; } toast('No se pudo guardar el remito. Revisá el almacenamiento del navegador.', 'error'); return; }
      if (imprimir) imprimirTicket(v);
      toast(cuenta ? 'Remito de empresa ' + v.remito + ' guardado · no entra en la caja' : 'Remito ' + v.remito + ' guardado · pagado ' + plata(cobrado(v)) + ' · debe ' + plata(saldo(v)));
      items = []; pedido = null; totalManual = null; descPct = 0; observaciones.value = ''; formPago.reiniciar(modoInicial()); ponerEntrega(addDias(HOY, 3)); pintarCliente(); render(); nro();
    }
    var cobrarBtn = $$('button', colTicket).filter(function (b) { return /Cobrar e imprimir/.test(b.textContent); })[0];
    var guardarBtn = $$('button', colTicket).filter(function (b) { return /Guardar sin imprimir/.test(b.textContent); })[0];
    var avisoRemito = document.createElement('p'); avisoRemito.className = 'text-xs text-on-surface-variant';
    agregarRenglon.after(avisoRemito); formPago.actualizar();
    $('span:last-child', cobrarBtn).textContent = 'Guardar e imprimir ticket';
    if (pedido && params.get('entregar') === '1') $('span:last-child', cobrarBtn).textContent = 'Entregar e imprimir ticket';
    cobrarBtn.addEventListener('click', function () { cobrar(true); });
    guardarBtn.addEventListener('click', function () { cobrar(false); });
    // Filtro de la grilla
    var filtroGrilla = $('input[placeholder^="Filtrar"]');
    if (filtroGrilla) filtroGrilla.addEventListener('input', function () {
      var t = norm(filtroGrilla.value);
      botones.forEach(function (b) { b.style.display = !b.dataset.oculto && norm(b.dataset.item).indexOf(t) >= 0 ? '' : 'none'; });
      pintarLista();
    });

    // Segunda vista: lista de precios (mismas clases que la tabla de Precios de Stitch)
    var lista = document.createElement('div');
    lista.className = 'bg-surface rounded-xl border border-outline overflow-hidden hidden';
    lista.innerHTML = '<table class="w-full text-left border-collapse"><thead><tr class="bg-surface-container-low border-b border-outline text-on-surface-variant text-xs uppercase font-label-md tracking-wider">' +
      '<th class="py-3 px-space-md font-semibold">Prenda o servicio</th><th class="py-3 px-space-md font-semibold w-36">Precio</th><th class="py-3 px-space-md font-semibold text-right w-48">En el ticket</th></tr></thead>' +
      '<tbody class="divide-y divide-outline"></tbody></table>';
    grilla.after(lista);
    lista.addEventListener('click', function (e) {
      var b = e.target.closest('[data-l-mas],[data-l-quitar]'); if (!b) return;
      var nombre = b.dataset.lMas || b.dataset.lQuitar;
      var it = items.filter(function (x) { return x.nombre === nombre; })[0];
      if (b.dataset.lMas) { if (it) it.cant = (it.cant > 0 ? it.cant : 0) + 1; else items.push({ nombre: nombre, cant: 1 }); }
      else if (it) items.splice(items.indexOf(it), 1);
      totalManual = null; render();
      if (b.dataset.lMas) { var campoCant = $('[data-l-cant="' + CSS.escape(nombre) + '"]', lista); if (campoCant) { campoCant.focus(); campoCant.select(); } }
    });
    // Cantidad escrita también en la lista: se aplica al salir del campo o con Enter.
    lista.addEventListener('change', function (e) {
      var inp = e.target; if (!inp.hasAttribute('data-l-cant')) return;
      var it = items.filter(function (x) { return x.nombre === inp.dataset.lCant; })[0], n = Number(inp.value);
      if (!it) return;
      if (inp.value === '' || !Number.isSafeInteger(n) || n < 1) { toast('Escribí una cantidad entera mayor a cero', 'error'); inp.value = it.cant > 0 ? it.cant : ''; return; }
      it.cant = n; totalManual = null; render();
    });
    lista.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.hasAttribute('data-l-cant')) e.target.blur(); });
    function pintarLista() {
      var t = filtroGrilla ? norm(filtroGrilla.value) : '';
      S.precios.forEach(function (p) { if (PRECIOS[p.nombre] == null) PRECIOS[p.nombre] = p.precio; });
      $('tbody', lista).innerHTML = S.precios.filter(function (p) { return !t || norm(p.nombre).indexOf(t) >= 0; }).map(function (p) {
        var it = items.filter(function (x) { return x.nombre === p.nombre; })[0];
        var n = esc(p.nombre);
        return '<tr class="hover:bg-surface-container-low/50 transition-colors' + (it ? ' bg-primary-fixed/40' : '') + '">' +
          '<td class="py-3.5 px-space-md font-label-md text-on-surface"><div class="flex items-center gap-2"><span class="material-symbols-outlined text-on-surface-variant text-[20px]">' + esc(p.icono || 'checkroom') + '</span><span>' + n + '</span></div></td>' +
          '<td class="py-3.5 px-space-md font-headline-md font-semibold text-on-surface">' + plata(PRECIOS[p.nombre]) + '</td>' +
          '<td class="py-3.5 px-space-md text-right">' + (it
            ? '<div class="inline-flex items-center gap-1">' +
              '<input data-l-cant="' + n + '" aria-label="Cantidad de ' + n + ' en el ticket" type="number" min="1" step="1" inputmode="numeric" value="' + (it.cant > 0 ? it.cant : '') + '" style="width:72px;text-align:center" class="px-2 py-1.5 bg-surface-container-lowest border border-outline rounded font-headline-md text-[15px] font-bold text-on-surface focus:outline-none focus:border-primary">' +
              '<button type="button" data-l-quitar="' + n + '" aria-label="Quitar ' + n + ' del ticket" title="Quitar" class="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container"><span class="material-symbols-outlined text-[18px]">close</span></button></div>'
            : '<button type="button" data-l-mas="' + n + '" class="inline-flex items-center gap-1 text-primary hover:text-on-primary-container font-label-md text-sm px-2.5 py-1 rounded hover:bg-surface-container transition-colors"><span class="material-symbols-outlined text-[16px]">add</span><span>Agregar</span></button>') +
          '</td></tr>';
      }).join('');
    }
    // Selector Botones / Lista (clases de las pestañas de Clientes en Stitch)
    var V_ON = 'px-3 py-1 bg-surface-container-lowest text-primary font-label-md text-[13px] rounded border border-outline flex items-center gap-1';
    var V_OFF = 'px-3 py-1 text-on-surface-variant hover:text-on-surface font-label-md text-[13px] rounded flex items-center gap-1';
    var selVista = document.createElement('div');
    selVista.className = 'flex items-center gap-1 bg-surface-container p-1 rounded border border-outline';
    selVista.innerHTML = '<button type="button" data-v="botones"><span class="material-symbols-outlined text-[16px]">grid_view</span>Botones</button>' +
      '<button type="button" data-v="lista"><span class="material-symbols-outlined text-[16px]">view_list</span>Lista</button>';
    var tocar = $$('span').filter(function (s) { return /Tocar para sumar/.test(s.textContent); })[0];
    tocar.replaceWith(selVista);
    function ponerVista(v) {
      S.vistaVenta = v; save();
      grilla.classList.toggle('hidden', v === 'lista'); lista.classList.toggle('hidden', v !== 'lista');
      $$('[data-v]', selVista).forEach(function (b) { b.className = b.dataset.v === v ? V_ON : V_OFF; });
      if (v === 'lista') pintarLista();
    }
    $$('[data-v]', selVista).forEach(function (b) { b.addEventListener('click', function () { ponerVista(b.dataset.v); }); });
    ponerVista(S.vistaVenta || 'botones');

    // Fecha de entrega: sale impresa en el ticket y el remito
    var entregaIso = pedido ? pedido.entrega : addDias(HOY, 3);
    var bloqueMedio = contMedios;
    var bloqueEnt = document.createElement('div');
    bloqueEnt.className = 'flex flex-col gap-1.5 pt-space-xs';
    bloqueEnt.innerHTML = '<span class="text-[12px] uppercase font-bold text-on-surface-variant">Fecha de entrega</span>' +
      '<div class="flex items-center gap-1 bg-surface-container p-1 rounded">' +
      '<button type="button" data-e="0">Hoy</button><button type="button" data-e="1">Mañana</button><button type="button" data-e="3">En 3 días</button>' +
      '<input type="date" data-e-fecha class="flex-1 min-w-0 py-1.5 px-2 text-[13px] bg-surface-container-lowest border border-outline rounded text-on-surface focus:outline-none focus:border-primary"></div>';
    bloqueMedio.before(bloqueEnt);
    var fechaEnt = $('[data-e-fecha]', bloqueEnt);
    function ponerEntrega(iso) {
      entregaIso = iso; fechaEnt.value = iso;
      $$('[data-e]', bloqueEnt).forEach(function (b) { b.className = addDias(HOY, +b.dataset.e) === iso ? MP_ON + ' px-2' : MP_OFF + ' px-2'; });
    }
    $$('[data-e]', bloqueEnt).forEach(function (b) { b.addEventListener('click', function () { ponerEntrega(addDias(HOY, +b.dataset.e)); }); });
    fechaEnt.addEventListener('change', function () { if (fechaEnt.value) ponerEntrega(fechaEnt.value); });
    ponerEntrega(entregaIso);
    var bloqueObs = document.createElement('div');
    bloqueObs.className = 'flex flex-col gap-1.5';
    bloqueObs.innerHTML = '<label for="observaciones-remito" class="text-[12px] font-bold text-on-surface-variant">Observaciones para el remito (opcional)</label>' +
      '<textarea id="observaciones-remito" rows="2" class="' + INPUT + '" placeholder="Ej. Camisa manchada; saco con forro roto"></textarea>' +
      '<span class="text-xs text-on-surface-variant">Salen impresas en la copia del cliente y del local.</span>';
    bloqueEnt.after(bloqueObs);
    var observaciones = $('textarea', bloqueObs);
    observaciones.value = pedido ? pedido.observaciones || '' : '';
    var opcionPrecios = document.createElement('label'); opcionPrecios.className = 'text-sm text-on-surface flex items-center gap-2';
    opcionPrecios.innerHTML = '<input type="checkbox" data-sin-precios> Remito sin precios para el cliente'; bloqueObs.appendChild(opcionPrecios);
    var sinPrecios = $('input', opcionPrecios);
    var tarifario = $$('button').filter(function (b) { return /Ver tarifario completo/.test(b.textContent); })[0];
    if (tarifario) tarifario.addEventListener('click', function () { location.href = vistaPermitida('precios') ? 'precios.html' : 'venta.html'; });
    pintarCliente(); render(); nro();
  })();

  // ── CLIENTES ──────────────────────────────────────────────────────
  if (VISTA === 'clientes') (function () {
    var secciones = $$('main section');
    secciones.forEach(function (sec) { $('div.bg-surface-container-lowest', sec).classList.remove('divide-y', 'divide-outline'); });
    var tabsCont = $('main div.flex.items-center.gap-1.bg-surface-container');
    var tabs = $$('button', tabsCont);
    var TAB_ON = 'px-3 py-1 bg-surface-container-lowest text-primary font-label-md text-label-md rounded border border-outline shadow-none';
    var TAB_OFF = 'px-3 py-1 text-on-surface-variant hover:text-on-surface font-label-md text-label-md rounded';
    var filtroTipo = 'todos';
    var buscador = $('main input[type="text"]');
    buscador.value = ''; buscador.placeholder = 'Buscar por nombre, teléfono o CUIT';
    function iniciales(n) { return n.split(/\s+/).filter(Boolean).slice(-2).map(function (p) { return p[0]; }).join('').toUpperCase(); }
    function fila(c) {
      var emp = c.tipo === 'empresa';
      return '<div data-cb-cliente="' + (emp ? 'empresa' : 'particular') + '" class="p-3.5 flex items-center justify-between hover:bg-surface-container-low transition-colors"><div class="flex items-center gap-3">' +
        '<div class="w-8 h-8 ' + (emp ? 'rounded bg-surface-container' : 'rounded-full bg-surface-variant') + ' flex items-center justify-center text-primary font-headline-md font-bold text-xs">' + esc(iniciales(c.nombre)) + '</div>' +
        '<div><div class="flex items-center gap-2"><span class="font-headline-md font-semibold text-on-surface text-[15px]">' + esc(c.nombre) + '</span>' +
        '<span class="text-xs text-on-surface-variant">· ' + (emp ? 'CUIT ' + esc(c.cuit) : 'Tel: ' + esc(c.tel)) + '</span></div>' +
        '<div class="flex items-center gap-3 text-xs text-on-surface-variant mt-0.5">' +
        (emp ? '<span class="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant border border-outline-variant">Resp. Inscripto</span>' : '') +
        (c.ultimo ? '<span>Último pedido: <strong class="text-on-surface font-medium">' + esc(c.ultimo) + '</strong>' + (c.ultimoNro ? ' (' + esc(c.ultimoNro) + ')' : '') + '</span>' : '<span>Sin pedidos todavía</span>') +
        '</div></div></div><div class="flex items-center gap-2">' + (function () {
          var deuda = ventas().filter(function (v) { var vc = clienteRegistro(v); return vc && vc.id === c.id; }).reduce(function (n, v) { return n + saldo(v); }, 0);
          var botonDeuda = '<button type="button" data-cb-accion="secundaria" data-deuda="' + esc(c.id) + '" class="' + BTN + '">' + (emp ? 'Deuda del local' : 'Remitos y deuda') + ' · <b data-cb-importe="total">' + plata(deuda) + '</b></button>';
          // Empresa: sus remitos de cuenta empresa están en Remitos; la deuda sólo aparece si quedó algo impago del mostrador.
          return emp ? '<a data-cb-accion="secundaria" data-remitos-empresa href="remitos.html?clienteId=' + encodeURIComponent(c.id) + '" class="' + BTN + ' inline-flex items-center gap-1"><span class="material-symbols-outlined text-[15px]">description</span>Remitos</a>' + (deuda > 0 ? botonDeuda : '') : botonDeuda;
        })() +
        '<a data-cb-accion="terciaria" href="venta.html?clienteId=' + encodeURIComponent(c.id) + '" class="px-3 py-1.5 text-xs font-label-md border border-outline rounded text-primary hover:bg-surface-container active:scale-[0.98] transition-[color,background-color,border-color,transform] flex items-center gap-1">' +
        '<span class="material-symbols-outlined text-[15px]">add_shopping_cart</span><span>Nueva venta</span></a></div></div>';
    }
    function render() {
      var t = norm(buscador.value), dig = soloDig(buscador.value);
      var vis = S.clientes.filter(function (c) {
        return !t || norm(c.nombre).indexOf(t) >= 0 || (dig.length >= 3 && (soloDig(c.tel).indexOf(dig) >= 0 || soloDig(c.cuit).indexOf(dig) >= 0));
      });
      ['empresa', 'particular'].forEach(function (tipo, i) {
        var sec = secciones[i], lista = vis.filter(function (c) { return c.tipo === tipo; });
        $('div.bg-surface-container-lowest', sec).innerHTML = lista.map(fila).join('') ||
          '<div class="p-3.5 text-xs text-on-surface-variant">Sin resultados</div>';
        $('div.flex.items-center.justify-between > span.text-xs', sec).textContent = lista.length + ' registros';
        sec.style.display = (filtroTipo === 'todos' || filtroTipo === tipo) ? '' : 'none';
      });
      var ne = S.clientes.filter(function (c) { return c.tipo === 'empresa'; }).length;
      tabs[0].textContent = 'Todos (' + S.clientes.length + ')';
      tabs[1].textContent = 'Empresas (' + ne + ')';
      tabs[2].textContent = 'Particulares (' + (S.clientes.length - ne) + ')';
      var totalReg = $$('main strong').filter(function (s) { return /^\d+$/.test(s.textContent.trim()); }).pop();
      if (totalReg) totalReg.textContent = S.clientes.length;
    }
    ['todos', 'empresa', 'particular'].forEach(function (k, i) {
      tabs[i].addEventListener('click', function () {
        filtroTipo = k; tabs.forEach(function (o, j) { o.className = j === i ? TAB_ON : TAB_OFF; }); render();
      });
    });
    secciones.forEach(function (sec) { sec.addEventListener('click', function (e) { var b = e.target.closest('[data-deuda]'); if (b) consultarMovimientos(render, S.clientes.filter(function (c) { return c.id === b.dataset.deuda; })[0]); }); });
    buscador.addEventListener('input', render);
    // Panel derecho: alta de particular o empresa, con aviso de duplicado
    var drawer = $$('aside').pop();
    var inputs = $$('input', drawer);
    var nombreIn = inputs[0], telIn = inputs[1];
    var modo = 'particular';
    var link = $('a', drawer);
    var bloqueTel = telIn.closest('div').parentElement;
    var cuitBox = document.createElement('div');
    cuitBox.className = 'hidden';
    cuitBox.innerHTML = '<label class="block text-xs font-label-md text-on-surface mb-1">CUIT <span class="text-error">*</span></label>' +
      '<input class="' + INPUT + '" placeholder="30-00000000-0" type="text">' +
      '<span class="text-[11px] text-on-surface-variant mt-1 block">Para emitir factura A.</span>';
    bloqueTel.after(cuitBox);
    var cuitIn = $('input', cuitBox);
    var titulo = $('h2', drawer);
    function pintarModo() {
      var emp = modo === 'empresa';
      titulo.textContent = emp ? 'Nueva empresa' : 'Nuevo particular';
      bloqueTel.classList.toggle('hidden', emp); cuitBox.classList.toggle('hidden', !emp);
      $('span', link).textContent = emp ? 'Cargar como particular' : 'Cargar como empresa';
      nombreIn.placeholder = emp ? 'Ej. Bodega Los Álamos' : 'Ej. Sofía Benítez';
    }
    link.addEventListener('click', function (e) { e.preventDefault(); modo = modo === 'empresa' ? 'particular' : 'empresa'; pintarModo(); nombreIn.focus(); });
    function limpiar() { nombreIn.value = ''; telIn.value = ''; cuitIn.value = ''; }
    $$('button', drawer).forEach(function (b) {
      if (/Guardar cliente/.test(b.textContent)) b.addEventListener('click', function () {
        var antes = S.clientes.length;
        var c = crearCliente(modo, nombreIn.value, telIn.value ? '261 ' + telIn.value : '', cuitIn.value);
        if (c) { limpiar(); render(); if (S.clientes.length === antes) buscador.value = c.nombre, render(); }
      });
      if (/Cancelar/.test(b.textContent) || b.title === 'Cerrar') b.addEventListener('click', limpiar);
    });
    var nuevoBtn = $$('header button').filter(function (b) { return /Nuevo cliente/.test(b.textContent); })[0];
    if (nuevoBtn) { $('span:last-child', nuevoBtn).textContent = 'Nuevo cliente'; nuevoBtn.addEventListener('click', function () { nombreIn.focus(); }); }
    render();
  })();

  // ── CAJA ──────────────────────────────────────────────────────────
  if (VISTA === 'caja') (function () {
    var tbody = $('main tbody');
    var tot = { Efectivo: [0, 0], Transferencia: [0, 0], 'Mercado Pago': [0, 0] };
    var total = 0, n = 0;
    var cards = $$('main section:first-of-type .grid > div');
    // Verificar efectivo
    var esperado = $$('main strong').filter(function (s) { return /^\$/.test(s.textContent.trim()); })[0];
    if (esperado) esperado.textContent = plata(tot.Efectivo[0]);
    var contado = $('main input[value]');
    contado.value = '';
    var difBox = contado.closest('.grid').children[1];
    var difCaja = $('div.flex', difBox), difVal = $('span.font-headline-md', difCaja), difTxt = $('span.text-\\[13px\\]', difCaja);
    function dif() {
      var d0 = aNum(contado.value) - tot.Efectivo[0];
      difVal.textContent = (d0 < 0 ? '−' : d0 > 0 ? '+' : '') + plata(Math.abs(d0));
      difTxt.textContent = d0 === 0 ? 'Sin diferencia' : 'Diferencia';
      difCaja.className = 'flex items-center justify-between h-[46px] px-space-md rounded-lg border ' +
        (d0 === 0 ? 'bg-primary-fixed border-outline-variant' : 'bg-error-container/60 border-error/30');
      difVal.className = 'font-headline-md font-bold text-[18px] ' + (d0 === 0 ? 'text-on-primary-fixed-variant' : 'text-error');
    }
    contado.addEventListener('input', dif); dif();
    var barra = document.createElement('div'); barra.className = 'px-space-lg py-3 border-b border-outline flex flex-wrap items-end gap-3';
    barra.innerHTML = '<label class="text-xs text-on-surface">Fecha de caja<input aria-label="Fecha de caja" data-fecha-caja type="date" value="' + HOY + '" class="' + INPUT + '"></label>' +
      '<button type="button" data-consultar class="' + BTN + '">Ventas y clientes / buscar remitos</button>';
    $('header').after(barra);
    var fechaCaja = $('[data-fecha-caja]', barra);
    var resumenDeuda = document.createElement('p'); resumenDeuda.className = 'px-space-lg py-2 text-sm text-on-surface'; barra.after(resumenDeuda);
    $('main thead tr').innerHTML = ['Hora', 'Remito', 'Cliente', 'Medios del día', 'Cobrado en fecha', 'Pagado a fecha', 'Debe a fecha', ''].map(function (t) { return '<th class="px-3 py-2 text-left whitespace-nowrap">' + t + '</th>'; }).join('');
    $('[data-consultar]', barra).addEventListener('click', function () { consultarMovimientos(renderCaja); });
    function renderCaja() {
      MEDIOS.forEach(function (m) { tot[m] = [0, 0]; }); total = 0; n = 0; tbody.innerHTML = '';
      var movimientos = [], vistos = {}, deudaDia = 0;
      ventas().forEach(function (v) {
        if (vistos[v.remito] || v.cuentaEmpresa) return; vistos[v.remito] = true; // la caja es sólo del local
        var delDia = pagos(v).filter(function (p) { return p.iso === fechaCaja.value && tot[p.medio]; });
        var pagadoFecha = pagos(v).filter(function (p) { return p.iso <= fechaCaja.value; }).reduce(function (n, p) { return n + p.importe; }, 0);
        var debeFecha = Math.max(0, v.total - pagadoFecha);
        if (v.iso === fechaCaja.value) deudaDia += debeFecha;
        if (v.iso === fechaCaja.value || delDia.length) movimientos.push({ v: v, hora: delDia.length ? delDia.map(function (p) { return p.hora || ''; }).sort()[0] : v.hora || '', pagos: delDia, pagado: pagadoFecha, debe: debeFecha });
      });
      movimientos.sort(function (a, b) { return a.hora.localeCompare(b.hora); });
      movimientos.forEach(function (mov) {
        var v = mov.v, tr = document.createElement('tr'); tr.className = 'border-b border-outline hover:bg-surface-container-low';
        var cobroDia = mov.pagos.reduce(function (suma, p) { tot[p.medio][0] += p.importe; tot[p.medio][1]++; total += p.importe; n++; return suma + p.importe; }, 0);
        var medios = mov.pagos.map(function (p) { return p.medio + ' ' + plata(p.importe); }).join(' · ') || 'Sin cobro';
        tr.innerHTML = [mov.hora || '—', v.remito, v.cliente, medios, plata(cobroDia), plata(mov.pagado), plata(mov.debe)].map(function (t, i) { return '<td ' + (i === 1 ? 'data-cb-numero ' : i >= 4 ? 'data-cb-importe="' + (i === 6 && mov.debe > 0 ? 'pendiente' : i === 4 ? 'total' : 'pagado') + '" ' : '') + 'class="px-3 py-2 text-sm text-on-surface">' + esc(t) + '</td>'; }).join('') + '<td class="px-3 py-2"><button type="button" data-cb-accion="secundaria" class="' + BTN + '" aria-label="Ver remito ' + esc(v.remito) + '">Ver remito</button></td>';
        $('button', tr).addEventListener('click', function () { verRemito(v, renderCaja); }); tbody.appendChild(tr);
      });
      if (!movimientos.length) tbody.innerHTML = '<tr><td colspan="8" class="py-4 px-space-md text-on-surface-variant">Sin remitos ni cobros en esta fecha.</td></tr>';
      resumenDeuda.textContent = 'Pendiente de los remitos del día: ' + plata(deudaDia) + '. Pagado y debe calculados hasta la fecha elegida; el pendiente no suma dinero en caja.';
      MEDIOS.forEach(function (m, i) { $('span.text-headline-md', cards[i]).textContent = plata(tot[m][0]); $('p', cards[i]).textContent = tot[m][1] + ' cobros'; });
      $('span.text-display', cards[3]).textContent = plata(total); $('span.px-2', cards[3]).textContent = n + ' cobros'; $('tfoot tr').innerHTML = '<td colspan="4" class="px-3 py-3">Total cobrado en la fecha</td><td class="text-right px-3 font-bold">' + plata(total) + '</td><td colspan="3"></td>';
      if (esperado) esperado.textContent = plata(tot.Efectivo[0]);
      var pie = $$('main span').filter(function (s) { return /^Mostrando/.test(s.textContent.trim()); })[0]; if (pie) pie.textContent = 'Mostrando ' + n + ' cobros de la fecha elegida';
      var regs = $$('main span').filter(function (s) { return /registros ordenados/.test(s.textContent); })[0]; if (regs) regs.textContent = '· ' + n + ' registros ordenados por hora';
      var fechaCab = $('header p'); if (fechaCab) fechaCab.textContent = fechaCaja.value + ' · Dinero efectivamente cobrado en el local';
      dif();
    }
    fechaCaja.addEventListener('input', renderCaja);
    renderCaja();
    var remitoUrl = new URLSearchParams(location.search).get('remito');
    var elegido = ventas().filter(function (v) { return v.remito === remitoUrl; })[0]; if (elegido) verRemito(elegido, renderCaja);
    $$('main button').forEach(function (b) {
      var t = b.textContent;
      if (/Cerrar caja/.test(t)) b.addEventListener('click', function () { toast('Caja cerrada · total del turno ' + plata(total)); });
      else if (/Recalcular/.test(t)) b.addEventListener('click', dif);
      else if (/Imprimir planilla/.test(t)) b.addEventListener('click', function () { window.print(); });
      else if (/Agregar retiro|Historial|Exportar/.test(t)) b.addEventListener('click', function () { toast('Incluido en la versión final'); });
    });
  })();

  // Fechas de los atajos de período, compartidas por Remitos y Empresas.
  function rangoPeriodo(clave) {
    var inicio = HOY, fin = HOY, x;
    if (clave === 'semana' || clave === 'semanaAnterior') {
      inicio = addDias(HOY, -((d(HOY).getDay() + 6) % 7) - (clave === 'semanaAnterior' ? 7 : 0)); fin = addDias(inicio, 6);
    }
    if (clave === 'mes' || clave === 'anterior') {
      x = d(HOY.slice(0, 7) + '-01'); if (clave === 'anterior') x.setMonth(x.getMonth() - 1);
      inicio = x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-01';
      x.setMonth(x.getMonth() + 1); x.setDate(0);
      fin = x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2);
    }
    if (clave === 'todas') inicio = fin = '';
    return [inicio, fin];
  }
  function fechaLarga(iso) { return iso ? fechaCorta(iso) + '/' + iso.slice(0, 4) : ''; }
  function cabeceraPagina(titulo, subtitulo, botonesHtml) {
    var main = $('main'), header = $('header', main);
    $('h1', header).textContent = titulo;
    if (subtitulo) { var p = document.createElement('p'); p.className = 'text-sm text-on-surface-variant'; p.textContent = subtitulo; $('h1', header).after(p); $('h1', header).parentElement.classList.add('flex-col', 'items-start'); $('h1', header).parentElement.classList.remove('items-center'); }
    $('header > div:last-child', main).innerHTML = botonesHtml;
    Array.prototype.slice.call(main.children).forEach(function (el) { if (el !== header) el.remove(); });
    var cont = document.createElement('div'); cont.className = 'flex-1 overflow-y-auto pb-space-lg'; main.appendChild(cont);
    return cont;
  }
  function atajosHtml(claves) {
    var nombres = { hoy: 'Hoy', semana: 'Esta semana', semanaAnterior: 'Semana anterior', mes: 'Este mes', anterior: 'Mes anterior', todas: 'Todas' };
    return '<div class="flex flex-wrap items-center gap-1" data-atajos>' + claves.map(function (k) { return '<button type="button" data-cb-periodo data-atajo="' + k + '" aria-pressed="false">' + nombres[k] + '</button>'; }).join('') + '</div>';
  }

  // ── REMITOS DE EMPRESA (empleadas y dueño) ────────────────────────
  // Ven, corrigen y reimprimen los remitos con forma de pago Empresa. Sin importes ni facturación.
  if (VISTA === 'remitos') (function () {
    document.title = 'Remitos | CLEANBOX Tintorería';
    var cont = cabeceraPagina('Remitos de empresa', 'Remitos con forma de pago Empresa. No entran en la caja: acá se ven, se corrigen y se vuelven a imprimir.',
      '<a href="venta.html" data-cb-accion="secundaria" class="' + BTN + ' inline-flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">add</span>Nuevo remito</a>');
    cont.innerHTML = '<div data-emp-filtros class="flex flex-wrap items-end gap-3">' +
      campo('Empresa', '<input data-rem-buscar aria-label="Buscar empresa" placeholder="Todas las empresas" class="' + INPUT + '" style="min-width:240px">') +
      campo('Desde', '<input data-rem-desde type="date" aria-label="Desde fecha" class="' + INPUT + '">') + campo('Hasta', '<input data-rem-hasta type="date" aria-label="Hasta fecha" class="' + INPUT + '">') +
      atajosHtml(['hoy', 'semana', 'mes', 'todas']) + '</div>' +
      '<section class="mx-space-lg mt-space-md bg-surface border border-outline rounded-lg overflow-hidden">' +
      '<div class="overflow-x-auto"><table data-cb-tabla class="w-full text-left border-collapse"><thead><tr class="bg-surface-container border-b border-outline text-[12px] uppercase tracking-wider text-on-surface-variant">' +
      '<th class="py-3 px-space-md">Fecha</th><th class="py-3 px-space-md">Remito</th><th class="py-3 px-space-md">Empresa</th><th class="py-3 px-space-md">Prendas</th><th class="py-3 px-space-md text-right">Acciones</th></tr></thead>' +
      '<tbody class="divide-y divide-outline text-sm text-on-surface"></tbody></table></div>' +
      '<div class="px-space-md py-3 bg-surface-container border-t border-outline flex flex-wrap items-center justify-between gap-2"><span data-rem-resumen role="status" class="font-label-md text-xs font-bold text-on-surface"></span>' +
      '<span class="text-xs text-on-surface-variant">La facturación de empresas la hace el dueño desde su sección.</span></div></section>';
    var buscar = $('[data-rem-buscar]', cont), desde = $('[data-rem-desde]', cont), hasta = $('[data-rem-hasta]', cont), tbody = $('tbody', cont);
    var atajos = $$('[data-atajo]', cont);
    function marcar(clave) { atajos.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.atajo === clave)); }); }
    function periodo(clave) { var r = rangoPeriodo(clave); desde.value = r[0]; hasta.value = r[1]; marcar(clave); render(); }
    atajos.forEach(function (b) { b.addEventListener('click', function () { periodo(b.dataset.atajo); }); });
    [desde, hasta].forEach(function (i) { i.addEventListener('input', function () { marcar(''); render(); }); });
    buscar.addEventListener('input', render);
    var lista = [];
    function render() {
      var q = norm(buscar.value);
      if (desde.value && hasta.value && desde.value > hasta.value) { tbody.innerHTML = '<tr><td colspan="5" class="py-4 px-space-md text-error">Revisá el rango de fechas</td></tr>'; $('[data-rem-resumen]', cont).textContent = 'Revisar fechas'; return; }
      lista = ventas().filter(function (v) {
        return v.cuentaEmpresa && (!q || norm(v.cliente).indexOf(q) >= 0) && (!desde.value || v.iso >= desde.value) && (!hasta.value || v.iso <= hasta.value);
      }).sort(function (a, b) { return a.iso === b.iso ? (a.remito < b.remito ? 1 : -1) : a.iso < b.iso ? 1 : -1; });
      tbody.innerHTML = lista.map(function (v, i) {
        return '<tr data-rem-fila="' + esc(v.remito) + '" class="hover:bg-surface-container-low">' +
          '<td class="py-3 px-space-md whitespace-nowrap text-on-surface-variant">' + esc(fechaLarga(v.iso)) + '</td>' +
          '<td class="py-3 px-space-md" data-cb-numero>' + esc(v.remito) + '</td>' +
          '<td class="py-3 px-space-md font-bold">' + esc(v.cliente) + '</td>' +
          '<td class="py-3 px-space-md">' + esc(detalleVenta(v)) + (v.correcciones && v.correcciones.length ? ' <span class="ml-1 inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-secondary-fixed text-on-secondary-fixed-variant">Corregido</span>' : '') + '</td>' +
          '<td class="py-3 px-space-md text-right whitespace-nowrap"><button type="button" data-rem-ver="' + i + '" data-cb-accion="terciaria" class="' + BTN + '">Ver</button> ' +
          '<button type="button" data-rem-corregir="' + i + '" data-cb-accion="secundaria" class="' + BTN + '">Corregir</button> ' +
          '<button type="button" data-rem-imprimir="' + i + '" data-cb-accion="secundaria" class="' + BTN + '">Imprimir</button></td></tr>';
      }).join('') || '<tr><td colspan="5" class="py-space-lg px-space-md text-center text-on-surface-variant">No hay remitos de empresa con estos filtros.</td></tr>';
      var unidades = lista.reduce(function (n, v) { return n + (v.items || []).reduce(function (m, it) { return m + it.cant; }, 0); }, 0);
      $('[data-rem-resumen]', cont).textContent = lista.length + (lista.length === 1 ? ' remito' : ' remitos') + ' · ' + unidades + ' prendas';
    }
    tbody.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rem-ver],[data-rem-corregir],[data-rem-imprimir]'); if (!b) return;
      var v = lista[+(b.dataset.remVer || b.dataset.remCorregir || b.dataset.remImprimir)];
      if (b.hasAttribute('data-rem-ver')) verRemito(v, render);
      else if (b.hasAttribute('data-rem-corregir')) corregirRemito(v, render);
      else imprimirTicket(v);
    });
    var params = new URLSearchParams(location.search), cli = params.get('clienteId') ? S.clientes.filter(function (c) { return c.id === params.get('clienteId'); })[0] : null;
    if (cli) buscar.value = cli.nombre;
    periodo(cli || params.get('remito') ? 'todas' : 'semana');
    var abrir = ventas().filter(function (v) { return v.remito === params.get('remito'); })[0]; if (abrir) verRemito(abrir, render);
  })();

  // ── EMPRESAS (antes Facturar; sólo el dueño) ──────────────────────
  // Filtra por empresa y período, suma las cantidades de todos los remitos y arma una sola factura.
  if (VISTA === 'facturar') (function () {
    document.title = 'Empresas | CLEANBOX Tintorería';
    var empresas = S.clientes.filter(function (c) { return c.tipo === 'empresa'; });
    var cont = cabeceraPagina('Empresas', 'Cantidades de los remitos de empresa y facturación del período. Sólo la ve el dueño.',
      '<button type="button" data-emp-libre data-cb-accion="secundaria" class="' + BTN + '">Factura libre</button>' +
      '<button type="button" data-emp-facturas data-cb-accion="secundaria" class="' + BTN + '"></button>');
    cont.innerHTML = '<div data-emp-filtros class="flex flex-col gap-3"><div class="flex flex-wrap items-end gap-3">' +
      campo('Empresa', '<select data-emp-cliente aria-label="Empresa" class="' + INPUT + '" style="min-width:240px"><option value="">Todas las empresas</option>' +
        empresas.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.nombre) + '</option>'; }).join('') + '</select>') +
      campo('Desde', '<input data-emp-desde type="date" aria-label="Desde fecha" class="' + INPUT + '">') + campo('Hasta', '<input data-emp-hasta type="date" aria-label="Hasta fecha" class="' + INPUT + '">') +
      atajosHtml(['mes', 'anterior', 'semana', 'semanaAnterior', 'hoy']) + '</div>' +
      '<div class="flex flex-wrap items-end gap-3">' + campo('Artículo (opcional)', '<input data-emp-articulo aria-label="Filtrar artículo" placeholder="Todos los artículos" class="' + INPUT + '" style="min-width:240px">') +
      '<label class="text-sm text-on-surface flex items-center gap-2 pb-2"><input type="checkbox" data-emp-local> Incluir también ventas a empresas hechas en el mostrador (con cobro o deuda del local)</label></div></div>' +
      '<div class="mx-space-lg mt-space-md grid gap-space-md items-start" style="grid-template-columns:minmax(0,1.6fr) minmax(280px,1fr)">' +
      '<section data-emp-cantidades class="bg-surface rounded-lg overflow-hidden">' +
      '<div class="px-space-md py-3 border-b border-outline flex flex-wrap items-baseline justify-between gap-2"><h2 class="font-headline-md text-[18px] font-bold text-on-surface">Cantidades del período</h2><span data-emp-sub class="text-xs text-on-surface-variant"></span></div>' +
      '<table data-cb-tabla class="w-full text-left border-collapse"><thead><tr class="bg-surface-container-low border-b border-outline text-[12px] uppercase tracking-wider text-on-surface-variant">' +
      '<th class="py-2 px-space-md">Artículo</th><th class="py-2 px-space-md text-right">Cantidad</th><th class="py-2 px-space-md text-right">En remitos</th></tr></thead><tbody></tbody></table></section>' +
      '<aside data-emp-resumen class="bg-surface rounded-lg p-space-md flex flex-col gap-3">' +
      '<span class="text-[12px] uppercase tracking-wider font-bold text-on-surface-variant">Para facturar</span>' +
      '<div data-emp-res-nombre class="font-headline-md text-[20px] font-bold text-on-surface leading-tight"></div><div data-emp-res-periodo class="text-sm text-on-surface-variant"></div>' +
      '<div data-cb-resumen style="grid-template-columns:repeat(2,minmax(0,1fr))"><div><span>Remitos</span><strong data-emp-res-remitos></strong></div><div><span>Prendas</span><strong data-emp-res-unidades></strong></div></div>' +
      '<button type="button" data-emp-armar data-cb-accion="principal" class="rounded font-label-md">Armar factura con estas cantidades</button>' +
      '<p data-emp-res-ayuda class="text-xs text-on-surface-variant"></p></aside></div>' +
      '<section class="mx-space-lg mt-space-md bg-surface border border-outline rounded-lg overflow-hidden">' +
      '<div class="px-space-md py-3 border-b border-outline flex items-baseline justify-between gap-2"><h2 class="font-headline-md text-[18px] font-bold text-on-surface">Remitos del período</h2><span data-emp-rem-cuenta class="text-xs text-on-surface-variant"></span></div>' +
      '<div class="overflow-x-auto"><table data-cb-tabla class="w-full text-left border-collapse"><thead><tr class="bg-surface-container border-b border-outline text-[12px] uppercase tracking-wider text-on-surface-variant">' +
      '<th class="py-2 px-space-md">Fecha</th><th class="py-2 px-space-md">Remito</th><th class="py-2 px-space-md">Empresa</th><th class="py-2 px-space-md">Prendas</th><th class="py-2 px-space-md"></th></tr></thead>' +
      '<tbody data-emp-remitos class="divide-y divide-outline text-sm text-on-surface"></tbody></table></div></section>';
    var sel = $('[data-emp-cliente]', cont), desde = $('[data-emp-desde]', cont), hasta = $('[data-emp-hasta]', cont), articulo = $('[data-emp-articulo]', cont), local = $('[data-emp-local]', cont);
    var atajos = $$('[data-atajo]', cont), btnFacturas = $('[data-emp-facturas]'), armar = $('[data-emp-armar]', cont);
    var actual = { remitos: [], grupos: [] };
    function marcar(clave) { atajos.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.atajo === clave)); }); }
    function periodo(clave) { var r = rangoPeriodo(clave); desde.value = r[0]; hasta.value = r[1]; marcar(clave); render(); }
    atajos.forEach(function (b) { b.addEventListener('click', function () { periodo(b.dataset.atajo); }); });
    [desde, hasta].forEach(function (i) { i.addEventListener('input', function () { marcar(''); render(); }); });
    [sel, local].forEach(function (i) { i.addEventListener('change', render); });
    articulo.addEventListener('input', render);
    function pintarFacturas() { btnFacturas.textContent = 'Facturas emitidas · ' + (S.facturasEmitidas || []).length; }
    function coincideArticulo(it) { return !articulo.value.trim() || norm(it.nombre).indexOf(norm(articulo.value)) >= 0; }
    function render() {
      var error = desde.value && hasta.value && desde.value > hasta.value;
      var remitos = error ? [] : ventas().filter(function (v) {
        var c = clienteRegistro(v);
        return v.tipo === 'empresa' && (v.cuentaEmpresa || (local.checked && !v.cuentaEmpresa)) && (!sel.value || (c && c.id === sel.value)) &&
          (!desde.value || v.iso >= desde.value) && (!hasta.value || v.iso <= hasta.value) && (v.items || []).some(coincideArticulo);
      }).sort(function (a, b) { return a.iso === b.iso ? (a.remito < b.remito ? -1 : 1) : a.iso < b.iso ? -1 : 1; });
      // Agrupa por empresa y artículo; cada remito cuenta una vez por artículo.
      var porEmpresa = {}, orden = [];
      remitos.forEach(function (v) {
        var c = clienteRegistro(v), clave = c ? c.id : 'sin:' + v.cliente;
        if (!porEmpresa[clave]) { porEmpresa[clave] = { nombre: c ? c.nombre : v.cliente, cliente: c, articulos: {}, ordenArt: [] }; orden.push(clave); }
        var g = porEmpresa[clave];
        (v.items || []).filter(coincideArticulo).forEach(function (it) {
          var k = norm(it.nombre);
          if (!g.articulos[k]) { g.articulos[k] = { nombre: it.nombre, cantidad: 0, remitos: {} }; g.ordenArt.push(k); }
          g.articulos[k].cantidad += it.cant; g.articulos[k].remitos[v.remito] = true;
        });
      });
      actual = { remitos: remitos, grupos: orden.map(function (k) { return porEmpresa[k]; }) };
      var unidades = 0, filas = [];
      actual.grupos.forEach(function (g) {
        var arts = g.ordenArt.map(function (k) { return g.articulos[k]; }).sort(function (a, b) { return b.cantidad - a.cantidad; });
        if (!sel.value) filas.push('<tr data-emp-grupo><td colspan="3" class="py-2 px-space-md">' + esc(g.nombre) + '</td></tr>');
        arts.forEach(function (a) {
          unidades += a.cantidad;
          filas.push('<tr><td class="py-2.5 px-space-md font-label-md text-on-surface">' + esc(a.nombre) + '</td><td class="py-2.5 px-space-md text-right" data-emp-cant>' + a.cantidad.toLocaleString('es-AR') + '</td>' +
            '<td class="py-2.5 px-space-md text-right text-xs text-on-surface-variant">' + Object.keys(a.remitos).length + '</td></tr>');
        });
      });
      $('tbody', $('[data-emp-cantidades]', cont)).innerHTML = error ? '<tr><td colspan="3" class="py-4 px-space-md text-error">Revisá el rango de fechas</td></tr>'
        : filas.join('') || '<tr><td colspan="3" class="py-space-lg px-space-md text-center text-on-surface-variant">No hay remitos de empresa con estos filtros.</td></tr>';
      var nombrePeriodo = desde.value || hasta.value ? (desde.value ? fechaLarga(desde.value) : 'el inicio') + ' al ' + (hasta.value ? fechaLarga(hasta.value) : 'hoy') : 'Todas las fechas';
      $('[data-emp-sub]', cont).textContent = nombrePeriodo + (articulo.value.trim() ? ' · artículo «' + articulo.value.trim() + '»' : '');
      var empresa = sel.value ? empresas.filter(function (c) { return c.id === sel.value; })[0] : null;
      $('[data-emp-res-nombre]', cont).textContent = empresa ? empresa.nombre : 'Todas las empresas';
      $('[data-emp-res-periodo]', cont).textContent = nombrePeriodo;
      $('[data-emp-res-remitos]', cont).textContent = remitos.length; $('[data-emp-res-unidades]', cont).textContent = unidades.toLocaleString('es-AR');
      var puede = !!empresa && remitos.length > 0;
      armar.disabled = !puede;
      $('[data-emp-res-ayuda]', cont).textContent = !empresa ? 'Elegí una empresa para armar su factura del período.' : !remitos.length ? 'No hay remitos para facturar en este período.'
        : 'Se cargan las cantidades con los precios de la lista. Podés cambiar precios, renglones y observaciones antes de emitir.';
      $('[data-emp-rem-cuenta]', cont).textContent = remitos.length + (remitos.length === 1 ? ' remito' : ' remitos');
      $('[data-emp-remitos]', cont).innerHTML = remitos.map(function (v, i) {
        return '<tr class="hover:bg-surface-container-low"><td class="py-2.5 px-space-md whitespace-nowrap text-on-surface-variant">' + esc(fechaLarga(v.iso)) + '</td><td class="py-2.5 px-space-md" data-cb-numero>' + esc(v.remito) + '</td>' +
          '<td class="py-2.5 px-space-md font-bold">' + esc(v.cliente) + '</td><td class="py-2.5 px-space-md">' + esc(detalleVenta(v)) +
          (v.cuentaEmpresa ? '' : ' <span class="ml-1 inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-surface-container-high text-on-surface-variant">Venta del mostrador</span>') + '</td>' +
          '<td class="py-2.5 px-space-md text-right"><button type="button" data-emp-ver="' + i + '" data-cb-accion="secundaria" class="' + BTN + '">Ver remito</button></td></tr>';
      }).join('') || '<tr><td colspan="5" class="py-space-lg px-space-md text-center text-on-surface-variant">Sin remitos en el período.</td></tr>';
    }
    $('[data-emp-remitos]', cont).addEventListener('click', function (e) { var b = e.target.closest('[data-emp-ver]'); if (b) verRemito(actual.remitos[+b.dataset.empVer], render); });
    armar.addEventListener('click', function () {
      var g = actual.grupos[0]; if (armar.disabled || !g) return;
      var renglones = g.ordenArt.map(function (k) { return g.articulos[k]; }).sort(function (a, b) { return b.cantidad - a.cantidad; })
        .map(function (a) { return { nombre: a.nombre, cant: a.cantidad, precio: precioDe(a.nombre) }; });
      var nros = actual.remitos.map(function (v) { return v.remito; });
      var lista = nros.length > 1 ? nros.slice(0, -1).join(', ') + ' y ' + nros[nros.length - 1] : nros[0];
      abrirFactura({ titulo: 'Factura del período · ' + g.nombre, cliente: g.cliente, renglones: renglones, remitos: nros,
        periodo: desde.value && hasta.value ? fechaLarga(desde.value) + ' al ' + fechaLarga(hasta.value) : '',
        observaciones: 'Corresponde a ' + (nros.length > 1 ? 'remitos ' : 'remito ') + lista + '.', alEmitir: pintarFacturas });
    });
    $('[data-emp-libre]').addEventListener('click', function () {
      abrirFactura({ titulo: 'Factura libre', cliente: sel.value ? empresas.filter(function (c) { return c.id === sel.value; })[0] : null, alEmitir: pintarFacturas });
    });
    btnFacturas.addEventListener('click', function () { verFacturas(sel.value); });
    var pre = new URLSearchParams(location.search).get('clienteId');
    if (pre && empresas.some(function (c) { return c.id === pre; })) sel.value = pre;
    pintarFacturas(); periodo('mes');
  })();

  // ── AJUSTES ───────────────────────────────────────────────────────
  if (VISTA === 'ajustes') (function () {
    // Módulos ocultables (patrón de Comandera: settings.modulosOcultos)
    var MAP = { 'Clientes': 'clientes', 'Empresas': 'facturar', 'Presupuestos': 'presupuestos', 'Precios': 'precios' };
    // La pantalla Facturar pasó a ser Empresas (remitos de empresa y facturación del dueño).
    $$('#modulos h3').forEach(function (h) {
      if (h.textContent.trim() !== 'Facturar') return;
      h.textContent = 'Empresas';
      var desc = h.nextElementSibling || h.parentElement.querySelector('p');
      if (desc) desc.textContent = 'Cantidades de los remitos de empresa y facturación del mes. Sólo la ve el dueño.';
      var ico = h.parentElement.parentElement.querySelector('.material-symbols-outlined'); if (ico) ico.textContent = 'domain';
    });
    $$('#modulos input[type="checkbox"]').forEach(function (chk) {
      var fila = chk.closest('div.p-space-md'), nombre = $('h3', fila).textContent.trim(), id = MAP[nombre];
      if (!id) return;
      chk.checked = S.ocultos.indexOf(id) < 0;
      chk.addEventListener('change', function () {
        var i = S.ocultos.indexOf(id);
        if (chk.checked && i >= 0) S.ocultos.splice(i, 1);
        if (!chk.checked && i < 0) S.ocultos.push(id);
        save(); pintarMenu();
        toast(chk.checked ? nombre + ' encendido' : nombre + ' apagado: ya no aparece en el menú');
      });
    });
    // Ticket: los campos actualizan la vista previa
    var N = S.negocio;
    var prev = $('#ticket .w-\\[280px\\]');
    var campos = { nombreNegocio: 'nombre', telefonoNegocio: 'telefono', direccionNegocio: 'direccion', textoPie: 'pie' };
    var dirP = $$('p', prev)[0], telP = $$('p', prev)[1], pieP = $$('div.italic', prev)[0];
    function pintarPrev() {
      dirP.textContent = N.direccion; telP.textContent = 'Tel: ' + N.telefono.replace('+54 9 ', ''); pieP.textContent = N.pie;
      var ico = $('span.material-symbols-outlined', prev);
      if (N.logo && ico) ico.outerHTML = '<img src="' + N.logo + '" alt="" style="max-width:120px;max-height:56px;margin:0 auto 4px">';
    }
    Object.keys(campos).forEach(function (id) {
      var el = document.getElementById(id); if (!el) return;
      el.value = N[campos[id]];
      el.addEventListener('input', function () { N[campos[id]] = el.value; save(); pintarPrev(); });
    });
    var dup = $$('#ticket input[type="checkbox"]')[0];
    if (dup) { dup.checked = N.duplicado; dup.addEventListener('change', function () { N.duplicado = dup.checked; save(); }); }
    // Logo: lo sube el dueño (queda sólo en este navegador)
    var cambiar = $$('#ticket button').filter(function (b) { return /Cambiar imagen/.test(b.textContent); })[0];
    var file = document.createElement('input'); file.type = 'file'; file.accept = 'image/png,image/jpeg'; file.hidden = true;
    document.body.appendChild(file);
    cambiar.addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () {
      var f = file.files[0]; if (!f) return;
      if (f.size > 600000) { toast('Imagen muy pesada (máx. 600 KB)', 'error'); return; }
      var rd = new FileReader();
      rd.onload = function () {
        N.logo = rd.result; save(); pintarMenu(); pintarPrev();
        var nombreArch = $$('#ticket span').filter(function (s) { return /\.png$/.test(s.textContent.trim()); })[0];
        if (nombreArch) nombreArch.textContent = f.name;
        var mini = $('#ticket .w-14'); if (mini) mini.innerHTML = '<img src="' + N.logo + '" alt="" class="max-w-full max-h-full">';
        toast('Logo actualizado');
      };
      rd.readAsDataURL(f);
    });
    var prueba = $$('#ticket button').filter(function (b) { return /ticket de prueba/.test(b.textContent); })[0];
    if (prueba) prueba.addEventListener('click', function () {
      imprimirTicket({ ticket: 'T-0000', remito: 'R-0000', fecha: fechaCorta(HOY) + '/2026', hora: ahora(), cliente: 'Cliente de prueba', tipo: 'particular',
        items: [{ nombre: 'Camisa', cant: 2, precio: 2500 }], total: 5000, medio: 'Efectivo', entrega: 'jue 31/10' });
    });
    $$('header button').forEach(function (b) { if (/Guardar cambios/.test(b.textContent)) b.addEventListener('click', function () { save(); toast('Cambios guardados'); }); });
    $$('#usuarios button').forEach(function (b) { b.addEventListener('click', function () { toast('Incluido en la versión final'); }); });
    // Anclas de la subnavegación
    var anclas = $$('main > div:nth-of-type(1) a');
    anclas.forEach(function (a) {
      a.addEventListener('click', function () {
        anclas.forEach(function (o) { o.className = o === a ? 'text-primary border-b-2 border-primary pb-1 font-bold flex items-center gap-1.5' : 'text-on-surface-variant hover:text-on-surface pb-1 flex items-center gap-1.5'; });
      });
    });
    pintarPrev();
  })();

  // ── PRECIOS ───────────────────────────────────────────────────────
  if (VISTA === 'precios') (function () {
    var tbody = $('main tbody');
    var filas = $$('tr', tbody);
    var tplFila = filas[0].cloneNode(true), tplEdit = filas[filas.length - 1].cloneNode(true);
    var buscador = $('main input[placeholder^="Buscar"]');
    var editando = -1;
    var exportar = document.createElement('button'); exportar.type = 'button'; exportar.className = BTN; exportar.textContent = 'Descargar lista en Excel'; $('header').appendChild(exportar);
    exportar.addEventListener('click', async function () {
      exportar.disabled = true; exportar.textContent = 'Generando Excel…';
      try {
        var XLSX = await biblioteca('XLSX', 'xlsx-0.20.3.min.js');
        var hoja = XLSX.utils.json_to_sheet(S.precios.map(function (p) { return { 'Prenda o servicio': p.nombre, 'Precio (ARS)': p.precio }; }));
        hoja['!cols'] = [{ wch: 48 }, { wch: 20 }];
        S.precios.forEach(function (p, i) { hoja['B' + (i + 2)].z = '"$" #,##0'; });
        var libro = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(libro, hoja, 'Lista de precios');
        XLSX.writeFile(libro, 'CLEANBOX-lista-de-precios.xlsx', { compression: true }); toast('Lista de precios descargada');
      } catch (e) { toast('No se pudo generar el Excel. Volvé a intentar.', 'error'); }
      finally { exportar.disabled = false; exportar.textContent = 'Descargar lista en Excel'; }
    });
    function render() {
      var t = norm(buscador.value);
      tbody.innerHTML = '';
      S.precios.forEach(function (p, i) {
        if (t && norm(p.nombre).indexOf(t) < 0) return;
        var tr = (i === editando ? tplEdit : tplFila).cloneNode(true);
        var td = $$('td', tr);
        $$('span', td[0])[0].textContent = p.icono || 'checkroom';
        $$('span', td[0])[1].textContent = p.nombre;
        if (i === editando) {
          var inp = $('input', td[1]); inp.value = p.precio.toLocaleString('es-AR');
          setTimeout(function () { inp.focus(); inp.select(); }, 0);
          inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') guardar(); if (e.key === 'Escape') { editando = -1; render(); } });
          var bs = $$('button', td[3]);
          bs[0].addEventListener('click', guardar);
          bs[1].addEventListener('click', function () { editando = -1; render(); });
          function guardar() { var v = aNum(inp.value); if (v <= 0) { toast('Precio inválido', 'error'); return; } p.precio = v; editando = -1; save(); render(); toast(p.nombre + ': ' + plata(v)); }
        } else {
          td[1].textContent = plata(p.precio);
          marcarImporte(td[1]);
          $('button', td[3]).addEventListener('click', function () { editando = i; render(); });
        }
        var chk = $('input[type="checkbox"]', td[2]);
        chk.checked = !!p.rapida;
        chk.addEventListener('change', function () { p.rapida = chk.checked; save(); contar(); });
        tbody.appendChild(tr);
      });
      contar();
    }
    function contar() {
      var c = $$('main section span.text-on-surface.font-semibold')[0]; if (c) c.textContent = S.precios.length;
      var r = $$('main section span').filter(function (s) { return /en venta rápida/.test(s.textContent); })[0];
      if (r) r.textContent = S.precios.filter(function (p) { return p.rapida; }).length + ' en venta rápida';
    }
    buscador.addEventListener('input', render);
    var agregar = $$('header button').filter(function (b) { return /Agregar prenda/.test(b.textContent); })[0];
    agregar.addEventListener('click', function () {
      var cuerpo = document.createElement('div');
      cuerpo.className = 'flex flex-col gap-4';
      cuerpo.innerHTML = campo('Prenda o servicio', '<input data-n class="' + INPUT + '" placeholder="Ej. Cortina por metro">') +
        campo('Precio', '<input data-p type="number" min="1" class="' + INPUT + '" placeholder="0">');
      modal('Agregar prenda o servicio', cuerpo, [
        { texto: 'Agregar', primario: true, accion: function () {
          var n = $('[data-n]', cuerpo).value.trim(), v = aNum($('[data-p]', cuerpo).value);
          if (!n || v <= 0) { toast('Completá nombre y precio', 'error'); return false; }
          if (S.precios.some(function (p) { return norm(p.nombre) === norm(n); })) { toast('Ya existe en la lista', 'error'); return false; }
          S.precios.push({ nombre: n, precio: v, rapida: true, icono: 'checkroom' }); save(); render(); toast('Agregado: ' + n);
        } },
        { texto: 'Cancelar', accion: function () {} }
      ]);
    });
    render();
  })();

  // ── PRESUPUESTOS ──────────────────────────────────────────────────
  if (VISTA === 'presupuestos') (function () {
    var secs = $$('main > section');
    var izq = secs[0], hoja = secs[1];
    Array.prototype.forEach.call(izq.children, function (bloque, i) { bloque.dataset.cbPresupuesto = ['cabecera', 'cliente', 'renglones', 'condiciones', 'total'][i]; });
    var cabRenglones = $('h3', izq); if (cabRenglones) cabRenglones.parentElement.setAttribute('data-cb-pres-cab', '');
    var tabEdit = $('tbody', izq), tabHoja = $('tbody', hoja);
    var tplEdit = $('tr', tabEdit).cloneNode(true), tplHoja = $('tr', tabHoja).cloneNode(true);
    var tablaEdit = tabEdit.closest('table'); tablaEdit.style.tableLayout = 'fixed';
    $$('th', tablaEdit).forEach(function (th, i) { th.style.width = ['38%', '16%', '20%', '21%', '5%'][i]; th.style.padding = '8px'; });
    $$('td', tplEdit).forEach(function (td) { td.style.padding = '8px'; td.style.minWidth = '0'; });
    var P = {
      nro: 31, cliente: clientePorNombre('Hotel Cordillera'), pct: 8, nota: 'Retiro y entrega semanal a coordinar.',
      items: [
        { nombre: 'Sábana 2 plazas', desc: 'Lavado industrial + planchado', cant: 120 },
        { nombre: 'Toalla', desc: 'Lavado y secado', cant: 200 },
        { nombre: 'Mantel', desc: 'Desmanchado + apresto ligero', cant: 40 }
      ]
    };
    P.items.forEach(function (it) { it.precio = precioDe(it.nombre); });
    if (S.presupuestoBorrador) P = JSON.parse(JSON.stringify(S.presupuestoBorrador));
    var descIn = $$('input', izq).filter(function (i) { return i.value === '8%'; })[0];
    descIn.value = P.pct + '%';
    var notaIn = $$('input', izq).filter(function (i) { return /Retiro y entrega/.test(i.value); })[0];
    var validez = $('select', izq);
    notaIn.value = P.nota;
    function pintarCliente() {
      var c = P.cliente || {};
      var cajas = $$('div.bg-surface-container-low', izq)[0];
      var tarjeta = $$('div.p-space-sm.border', izq)[0];
      $('div.w-9', tarjeta).textContent = (c.nombre || '?').split(/\s+/).slice(-2).map(function (x) { return x[0]; }).join('').toUpperCase();
      $('span.block', tarjeta).textContent = c.nombre || 'Sin cliente';
      $$('span.block', tarjeta)[1].textContent = c.tipo === 'empresa' ? 'CUIT: ' + c.cuit + ' · Condición IVA: Resp. Inscripto' : (c.tel ? 'Tel: ' + c.tel : '');
      $('span.px-2', tarjeta).textContent = c.tipo === 'empresa' ? 'Empresa' : 'Particular';
      var datos = $$('div.p-3.bg-surface-container-low', hoja)[0];
      $('strong', datos).textContent = c.nombre || '';
      $('p', datos).textContent = c.tipo === 'empresa' ? 'CUIT: ' + c.cuit + ' · Responsable Inscripto' : (c.tel ? 'Tel: ' + c.tel : '');
      return cajas;
    }
    function render(conservarCampos) {
      if (conservarCampos !== true) tabEdit.innerHTML = ''; tabHoja.innerHTML = '';
      var sub = 0, valido = P.items.length > 0;
      P.items.forEach(function (it, i) {
        var pu = it.precio, st = pu * it.cant;
        var ok = !!it.nombre.trim() && Number.isSafeInteger(it.cant) && it.cant > 0 && importeValido(pu) && importeValido(st);
        valido = valido && ok; sub += ok ? st : 0;
        if (conservarCampos !== true) {
          var tr = tplEdit.cloneNode(true), td = $$('td', tr);
          td[0].innerHTML = '<input data-pres-nombre="' + i + '" aria-label="Artículo renglón ' + (i + 1) + '" value="' + esc(it.nombre) + '" class="' + INPUT + '">';
          td[1].innerHTML = '<input data-pres-cant="' + i + '" aria-label="Cantidad renglón ' + (i + 1) + '" type="number" min="1" step="1" value="' + it.cant + '" style="padding:8px 4px" class="' + INPUT + '">';
          td[2].innerHTML = '<input data-pres-precio="' + i + '" aria-label="Precio renglón ' + (i + 1) + '" type="number" min="0" step="1" value="' + pu + '" style="padding:8px 4px" class="' + INPUT + '">';
          [['[data-pres-nombre]', 'nombre'], ['[data-pres-cant]', 'cant'], ['[data-pres-precio]', 'precio']].forEach(function (par) {
            $(par[0], tr).addEventListener('input', function () { it[par[1]] = par[1] === 'nombre' ? this.value : this.value === '' ? NaN : Number(this.value); render(true); });
          });
          $('button', td[4]).addEventListener('click', function () { P.items.splice(i, 1); render(); }); tabEdit.appendChild(tr);
        }
        $$('td', tabEdit.children[i])[3].textContent = ok ? plata(st) : 'Revisar';
        marcarImporte($$('td', tabEdit.children[i])[3]);
        var th = tplHoja.cloneNode(true), tdh = $$('td', th);
        [1, 2, 3].forEach(function (col) { tdh[col].style.paddingLeft = '12px'; tdh[col].style.whiteSpace = 'nowrap'; tdh[col].style.textAlign = col === 1 ? 'center' : 'right'; });
        $$('span', tdh[0])[0].textContent = it.nombre; $$('span', tdh[0])[1].textContent = it.desc || '';
        tdh[1].textContent = Number.isSafeInteger(it.cant) ? it.cant : '—'; tdh[2].textContent = importeValido(pu) ? plata(pu) : '—'; tdh[3].textContent = ok ? plata(st) : '—';
        tabHoja.appendChild(th);
      });
      var desc = Math.round(sub * P.pct / 100), tot = sub - desc;
      valido = valido && importeValido(sub) && importeValido(tot);
      var cuenta = $$('span', izq).filter(function (s) { return /renglones cargados|renglón cargado/.test(s.textContent); })[0];
      if (cuenta) cuenta.textContent = P.items.length + (P.items.length === 1 ? ' renglón cargado' : ' renglones cargados');
      var descTxt = descIn.parentElement.parentElement.querySelector('span.text-error');
      descTxt.textContent = desc ? '-' + plata(desc) : '$0';
      var panelTot = $$('div.bg-surface-container-low.border.border-outline.rounded-lg', izq).pop();
      $('div.text-\\[34px\\]', panelTot).textContent = valido ? plata(tot) : 'Revisá los renglones';
      var strongs = $$('strong', panelTot);
      strongs[0].textContent = plata(sub); strongs[1].textContent = desc ? '-' + plata(desc) : '$0';
      $$('div.text-error', panelTot)[0].firstChild.textContent = 'Descuento (' + P.pct + '%): ';
      var resumen = $$('div.w-64', hoja)[0], filasR = $$(':scope > div', resumen);
      $$('span', filasR[0])[1].textContent = plata(sub);
      $$('span', filasR[1])[0].textContent = 'Descuento (' + P.pct + '%):';
      $$('span', filasR[1])[1].textContent = desc ? '-' + plata(desc) : '$0';
      $$('span', filasR[2])[1].textContent = valido ? plata(tot) : 'Revisar';
      $$('div.border-l-4', hoja)[0].innerHTML = '<strong class="text-on-surface font-label-md">Nota:</strong> ' + esc(notaIn.value);
      var n = 'P-' + ('0000' + P.nro).slice(-4);
      $$('span', hoja).filter(function (s) { return /PRESUPUESTO N°/.test(s.textContent); })[0].textContent = 'PRESUPUESTO N° ' + n;
      $$('span', izq).filter(function (s) { return /^Borrador #/.test(s.textContent.trim()); })[0].textContent = 'Borrador #' + n;
      var val = $$('span', hoja).filter(function (s) { return /^Validez:/.test(s.textContent.trim()); })[0];
      if (val) val.innerHTML = 'Validez: <strong>' + esc(validez.value.split(' (')[0]) + '</strong>';
      if (S.negocio.logo) { var ic = $('div.w-12', hoja); if (ic) ic.outerHTML = '<img src="' + S.negocio.logo + '" alt="" class="w-12 h-12 object-contain">'; }
      return { sub: sub, desc: desc, tot: tot, valido: valido };
    }
    descIn.addEventListener('change', function () { P.pct = Math.max(0, Math.min(100, aNum(descIn.value))); descIn.value = P.pct + '%'; render(); });
    notaIn.addEventListener('input', render);
    validez.addEventListener('change', render);
    $$('button', izq).forEach(function (b) {
      var t = b.textContent;
      if (/Cambiar cliente/.test(t)) b.addEventListener('click', function () {
        var elegido = null;
        modal('Cliente del presupuesto', selectorCliente(function (c) { elegido = c; }), [
          { texto: 'Usar este cliente', primario: true, accion: function () { if (!elegido) { toast('Elegí o creá el cliente', 'error'); return false; } P.cliente = elegido; pintarCliente(); } },
          { texto: 'Cancelar', accion: function () {} }
        ]);
      });
      if (/Agregar renglón/.test(t)) b.addEventListener('click', function () {
        var cuerpo = document.createElement('div');
        cuerpo.className = 'flex flex-col gap-4';
        cuerpo.innerHTML = campo('Prenda o servicio', '<select data-s class="' + INPUT + '">' + S.precios.map(function (p) { return '<option>' + esc(p.nombre) + '</option>'; }).join('') + '</select>') +
          campo('Cantidad', '<input data-c type="number" min="1" value="1" class="' + INPUT + '">');
        modal('Agregar renglón', cuerpo, [
          { texto: 'Agregar', primario: true, accion: function () { var cant = Number($('[data-c]', cuerpo).value); if (!Number.isSafeInteger(cant) || cant < 1) { toast('Revisá la cantidad', 'error'); return false; } var n = $('[data-s]', cuerpo).value; P.items.push({ nombre: n, desc: '', cant: cant, precio: precioDe(n) }); render(); } },
          { texto: 'Cancelar', accion: function () {} }
        ]);
      });
    });
    var libre = document.createElement('button'); libre.type = 'button'; libre.textContent = 'Agregar renglón libre'; libre.className = BTN;
    var agregarLista = $$('button', izq).filter(function (b) { return /Agregar renglón/.test(b.textContent); })[0]; agregarLista.after(libre);
    agregarLista.textContent = 'Agregar de la lista'; agregarLista.style.flex = '1 1 180px'; libre.style.flex = '1 1 180px'; agregarLista.parentElement.classList.add('flex-wrap');
    libre.addEventListener('click', function () { P.items.push({ nombre: '', desc: '', cant: 1, precio: 0 }); render(); $('[data-pres-nombre="' + (P.items.length - 1) + '"]').focus(); });
    function validarPresupuesto() { if (render(true).valido) return true; toast('Revisá artículo, cantidad y precio de cada renglón', 'error'); return false; }
    function texto() { var r = render(); return 'Hola! Te paso el presupuesto P-' + ('0000' + P.nro).slice(-4) + ' de CLEANBOX Tintorería por ' + plata(r.tot) + '. ' + validez.value.split(' (')[0] + ' de validez.'; }
    // Impresión: sólo la hoja A4
    var css = document.createElement('style');
    css.textContent = '@media print{aside,header,main>section:first-child,main>section:last-child>div:first-child,main>section:last-child>div:last-child{display:none!important}body,main{display:block!important;overflow:visible!important;height:auto!important}main>section{width:100%!important}}';
    document.head.appendChild(css);
    $$('button', hoja).forEach(function (b) {
      var t = b.textContent;
      if (/Descargar PDF/.test(t)) b.addEventListener('click', function () { if (validarPresupuesto()) window.print(); });
      if (/WhatsApp/.test(t)) b.addEventListener('click', function () { if (validarPresupuesto()) window.open('https://wa.me/?text=' + encodeURIComponent(texto()), '_blank'); });
      if (/correo/.test(t)) b.addEventListener('click', function () { if (validarPresupuesto()) location.href = 'mailto:?subject=' + encodeURIComponent('Presupuesto CLEANBOX') + '&body=' + encodeURIComponent(texto()); });
      if (/Guardar presupuesto/.test(t)) b.addEventListener('click', function () { if (!validarPresupuesto()) return; var anterior = S.presupuestoBorrador; S.presupuestoBorrador = JSON.parse(JSON.stringify(P)); if (!save()) { S.presupuestoBorrador = anterior; toast('No se pudo guardar el presupuesto', 'error'); return; } toast('Presupuesto P-' + ('0000' + P.nro).slice(-4) + ' guardado'); });
    });
    var nuevo = $$('header button').filter(function (b) { return /Nuevo presupuesto/.test(b.textContent); })[0];
    if (nuevo) nuevo.addEventListener('click', function () { P.nro++; P.items = []; P.pct = 0; descIn.value = '0%'; render(); toast('Presupuesto nuevo'); });
    pintarCliente(); render();
  })();

  // Jerarquía de pantalla sobre los tokens ya elegidos en Stitch. No altera impresos.
  (function jerarquiaVisual() {
    var tema = window.tailwind && window.tailwind.config && window.tailwind.config.theme;
    if (!tema || !tema.extend || !tema.extend.colors) return;
    var colores = tema.extend.colors, css = document.createElement('style'); css.setAttribute('data-cb-jerarquia', '');
    var nombres = ['primary', 'on-primary', 'on-primary-fixed-variant', 'primary-fixed', 'secondary', 'secondary-fixed', 'on-secondary-fixed-variant', 'tertiary-container', 'surface', 'surface-container-low', 'on-surface', 'on-surface-variant', 'outline', 'tertiary-fixed', 'on-tertiary-fixed-variant', 'error'];
    css.textContent = ':root{' + nombres.map(function (n) { return '--cb-' + n + ':' + colores[n] + ';'; }).join('') + '}' +
      '@media screen{' +
      'body [data-cb-importe],body [data-cb-numero],body input[type=number]{font-variant-numeric:tabular-nums lining-nums}' +
      'body [data-cb-importe]{font-weight:700;font-size:15px;line-height:1.4;white-space:nowrap}' +
      'body td[data-cb-importe]{text-align:right;padding-inline:12px}' +
      'body [data-cb-importe=total],body [data-cb-numero]{color:var(--cb-primary)}' +
      'body [data-cb-numero]{font-size:14px;font-weight:700;white-space:nowrap}' +
      'body [data-cb-importe=pagado]{color:var(--cb-on-surface-variant);font-weight:600}' +
      'body [data-cb-importe=pendiente]{color:var(--cb-on-tertiary-fixed-variant);background:var(--cb-tertiary-fixed)}' +
      'body [data-cb-resumen]{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}' +
      'body [data-cb-resumen]>div{padding:12px;border:1px solid var(--cb-outline);border-radius:4px;background:var(--cb-surface-container-low);min-width:0}' +
      'body [data-cb-resumen] span{display:block;font-size:12px;color:var(--cb-on-surface-variant);margin-bottom:4px}' +
      'body [data-cb-resumen] strong{display:block;font-size:26px;line-height:1.2;overflow-wrap:anywhere;white-space:normal}' +
      'body [data-cb-resumen] [data-cb-estado=pendiente]{background:var(--cb-tertiary-fixed);border-color:var(--cb-on-tertiary-fixed-variant)}' +
      'body [data-cb-estado=pendiente] strong,body [data-cb-estado=pendiente] span{color:var(--cb-on-tertiary-fixed-variant)}' +
      'body [data-cb-tabla]{font-variant-numeric:tabular-nums}' +
      'body [data-cb-tabla] tbody tr:nth-child(even){background:var(--cb-surface-container-low)}' +
      'body [data-cb-tabla] tbody tr:hover{background:var(--cb-primary-fixed)}' +
      'body [data-cb-tabla] td{vertical-align:middle}' +
      'body [data-cb-tabla] th{font-weight:700;color:var(--cb-on-surface-variant)}' +
      'body [data-cb-accion]{font-weight:700;min-height:36px;line-height:1.25;white-space:nowrap;justify-content:center}' +
      'body [data-cb-accion=principal]{color:var(--cb-on-primary);background:var(--cb-primary);border:1px solid var(--cb-primary);padding:10px 16px}' +
      'body [data-cb-accion=principal]:hover{background:var(--cb-on-primary-fixed-variant)}' +
      'body [data-cb-accion=secundaria]{color:var(--cb-on-surface);background:var(--cb-surface);border:1px solid var(--cb-outline);padding:8px 12px;font-size:13px}' +
      'body [data-cb-accion=secundaria]:hover{background:var(--cb-surface-container-low);border-color:var(--cb-primary)}' +
      'body [data-cb-accion=terciaria]{color:var(--cb-on-surface-variant);background:transparent;border:1px solid transparent;padding:8px;font-size:13px}' +
      'body [data-cb-accion=terciaria]:hover{color:var(--cb-primary);text-decoration:underline}' +
      'body [data-cb-accion]:focus-visible{outline:2px solid var(--cb-primary);outline-offset:2px}' +
      'body [data-cb-accion]:disabled{opacity:.45}' +
      'body[data-view=caja] main span.text-display{font-size:40px;line-height:1.1;color:var(--cb-primary);font-variant-numeric:tabular-nums}' +
      'body[data-view=caja] main span.text-headline-md{font-size:28px;font-variant-numeric:tabular-nums}' +
      'body[data-view=venta] [data-importe]{color:var(--cb-primary);font-size:18px;font-variant-numeric:tabular-nums}' +
      'body [data-pres-cant],body [data-pres-precio]{font-weight:600}' +
      'body main tfoot td.text-right{font-size:18px;font-weight:700;color:var(--cb-primary)}' +
      'body[data-view=venta] main>section:last-child{border-left:3px solid var(--cb-primary)}' +
      'body [data-renglon]{border:2px solid var(--cb-outline);border-left:5px solid var(--cb-primary);background:var(--cb-surface);padding:8px;gap:6px}' +
      'body [data-renglon]>label>input{border-color:var(--cb-primary);background:var(--cb-surface);font-weight:700;font-size:14px;line-height:20px;padding:6px 8px}' +
      'body [data-renglon-valores]{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr) auto;align-items:center;gap:6px;font-size:12px}' +
      'body [data-renglon-valores]>label{min-width:0;white-space:nowrap}' +
      'body [data-renglon-valores] input{width:100%;padding:4px 6px;min-width:0}' +
      'body [data-cb-cantidad]{gap:2px}' +
      'body [data-renglon] [data-importe]{font-size:18px;padding:2px 4px;background:var(--cb-primary-fixed);border-radius:4px;min-width:0;overflow-wrap:anywhere}' +
      'body [data-cb-cliente]{border:2px solid var(--cb-outline);border-left:5px solid var(--cb-primary);border-radius:6px;margin:8px;background:var(--cb-surface);gap:8px;flex-wrap:wrap}' +
      'body [data-cb-cliente=empresa]{border-left-color:var(--cb-secondary)}' +
      'body [data-cb-cliente]:hover{border-color:var(--cb-primary);background:var(--cb-surface-container-low)}' +
      'body [data-cb-cliente]>div:first-child{min-width:0;flex:1 1 270px}' +
      'body [data-cb-cliente]>div:last-child{margin-left:auto}' +
      'body section[aria-labelledby=col-recibido]{border:2px solid var(--cb-primary)}' +
      'body section[aria-labelledby=col-preparacion]{border:2px solid var(--cb-secondary)}' +
      'body section[aria-labelledby=col-listo]{border:2px solid var(--cb-tertiary-container)}' +
      'body section[aria-labelledby=col-recibido]>div:first-child{background:var(--cb-primary-fixed);color:var(--cb-on-primary-fixed-variant)}' +
      'body section[aria-labelledby=col-preparacion]>div:first-child{background:var(--cb-secondary-fixed);color:var(--cb-on-secondary-fixed-variant)}' +
      'body section[aria-labelledby=col-listo]>div:first-child{background:var(--cb-tertiary-fixed);color:var(--cb-on-tertiary-fixed-variant)}' +
      'body [data-cb-pedido]{border:2px solid var(--cb-outline);border-left:4px solid var(--cb-primary)}' +
      'body [data-cb-pedido=preparacion]{border-left-color:var(--cb-secondary)}' +
      'body [data-cb-pedido=listo]{border-left-color:var(--cb-tertiary-container)}' +
      'body [data-cb-pedido] [data-acc=preparar],body [data-cb-pedido] [data-acc=listo],body [data-cb-pedido] [data-acc=entregar]{padding:8px 10px;border-radius:4px;color:var(--cb-on-primary);background:var(--cb-primary);border:1px solid transparent;font-weight:700}' +
      'body [data-cb-pedido] [data-acc=listo]{background:var(--cb-secondary)}' +
      'body [data-cb-pedido] [data-acc=entregar]{background:var(--cb-tertiary-container)}' +
      'body [data-cb-filtros]{width:auto;margin:16px 24px 0;padding:16px;border:2px solid var(--cb-outline);border-left:5px solid var(--cb-primary);border-bottom:0;border-radius:8px 8px 0 0;background:var(--cb-surface-container-low);gap:12px}' +
      'body [data-cb-filtros]>div:first-child{display:contents}' +
      'body [data-cb-filtros-extra]{margin:0 24px 16px;padding:16px;border:2px solid var(--cb-outline);border-left:5px solid var(--cb-primary);border-radius:0 0 8px 8px;background:var(--cb-surface)}' +
      'body [data-cb-filtros-extra] input{border-color:var(--cb-primary);background:var(--cb-surface);font-weight:600}' +
      'body [data-cb-periodo]{min-height:38px;padding:8px 12px;border:2px solid var(--cb-outline);border-radius:6px;background:var(--cb-surface);color:var(--cb-on-surface);font-size:13px;font-weight:700}' +
      'body [data-cb-periodo][aria-pressed=true]{background:var(--cb-primary);border-color:var(--cb-primary);color:var(--cb-on-primary)}' +
      'body [data-cb-estado-factura]{min-height:38px;padding:8px 12px;border:2px solid var(--cb-outline);border-radius:6px;background:var(--cb-surface);color:var(--cb-on-surface);font-weight:700}' +
      'body [data-cb-estado-factura=sin]{background:var(--cb-tertiary-fixed);color:var(--cb-on-tertiary-fixed-variant);border-color:var(--cb-tertiary-container)}' +
      'body [data-cb-estado-factura=con]{background:var(--cb-secondary-fixed);color:var(--cb-on-secondary-fixed-variant);border-color:var(--cb-secondary)}' +
      'body [data-cb-filtros-extra] [data-unidades]{padding:10px 12px;border-left:4px solid var(--cb-primary);background:var(--cb-primary-fixed);font-weight:700}' +
      'body [data-filtros-activos]>button{border-color:var(--cb-primary);font-weight:700}' +
      'body [data-cb-presupuesto]{border:2px solid var(--cb-outline);border-left:5px solid var(--cb-primary)}' +
      'body [data-cb-presupuesto=cabecera]{background:var(--cb-primary-fixed);border-color:var(--cb-primary)}' +
      'body [data-cb-presupuesto=cliente]{border-left-color:var(--cb-secondary)}' +
      'body [data-cb-presupuesto=renglones]{border-color:var(--cb-primary)}' +
      'body [data-cb-pres-cab]{padding:10px 12px;border-radius:4px;background:var(--cb-primary)}' +
      'body [data-cb-pres-cab] h3,body [data-cb-pres-cab] span{color:var(--cb-on-primary)}' +
      'body [data-cb-presupuesto=total]{background:var(--cb-primary-fixed);border-color:var(--cb-primary)}' +
      'body[data-view=presupuestos] main>section:last-child .w-64{border:2px solid var(--cb-primary);padding:12px}' +
      // Remitos de empresa y Empresas: empresas en azul (secondary), como en Clientes.
      'body [data-emp-filtros]{margin:16px 24px 0;padding:16px;border:2px solid var(--cb-outline);border-left:5px solid var(--cb-secondary);border-radius:8px;background:var(--cb-surface-container-low)}' +
      'body [data-emp-filtros] input,body [data-emp-filtros] select{border-color:var(--cb-secondary);background:var(--cb-surface);font-weight:600}' +
      'body [data-emp-filtros] [data-cb-periodo][aria-pressed=true]{background:var(--cb-secondary);border-color:var(--cb-secondary)}' +
      'body [data-emp-cantidades],body [data-emp-resumen]{border:2px solid var(--cb-outline);border-left:5px solid var(--cb-secondary)}' +
      'body [data-emp-cant]{font-family:Outfit,sans-serif;font-size:22px;font-weight:700;color:var(--cb-on-secondary-fixed-variant);font-variant-numeric:tabular-nums;white-space:nowrap}' +
      'body [data-emp-grupo] td{background:var(--cb-secondary-fixed);color:var(--cb-on-secondary-fixed-variant);font-weight:700;font-size:14px}' +
      'body [data-emp-resumen] [data-cb-resumen] strong{color:var(--cb-on-secondary-fixed-variant)}' +
      'body [data-emp-armar]:disabled{cursor:not-allowed}' +
      'body [data-cb-cuenta-empresa]{border-left:5px solid var(--cb-secondary);background:var(--cb-secondary-fixed)}' +
      'body [data-cb-cuenta-empresa] b,body [data-cb-cuenta-empresa] span{color:var(--cb-on-secondary-fixed-variant)}' +
      'body[data-view=venta] main>section:last-child[data-cb-remito-empresa=true]{border-left-color:var(--cb-secondary)}' +
      'body [data-cb-remito-empresa=true] span.uppercase{color:var(--cb-secondary)}' +
      'body [data-modo-empresa][aria-pressed=true]{background:var(--cb-secondary);border-color:var(--cb-secondary);color:var(--cb-on-primary)}' +
      'body [data-corregir] input[aria-invalid=true],body [data-factura-form] input[aria-invalid=true],body [data-cant][aria-invalid=true]{border-color:var(--cb-error)}' +
      '@media(max-width:520px){body [data-cb-resumen]{grid-template-columns:1fr}body [data-cb-resumen] strong{font-size:24px}}}';
    document.head.appendChild(css);
    if (['caja', 'facturar', 'precios'].indexOf(VISTA) >= 0) $$('main table').forEach(function (t) { t.setAttribute('data-cb-tabla', ''); });
    var principales = { pedidos: /Recibir pedido/, venta: /Cobrar e imprimir/, clientes: /Nuevo cliente/, caja: /Cerrar caja/, precios: /Agregar prenda/, presupuestos: /Guardar presupuesto/, ajustes: /Guardar cambios/ };
    $$('main button').forEach(function (b) {
      var texto = b.textContent.trim();
      if (principales[VISTA] && principales[VISTA].test(texto)) b.dataset.cbAccion = 'principal';
      else if (/Ver facturas emitidas|Nuevo presupuesto|Descargar|Agregar renglón|Agregar de la lista|Ventas y clientes|Historial de cierres/.test(texto)) b.dataset.cbAccion = 'secundaria';
      else if (/Enviar por|Cancelar/.test(texto)) b.dataset.cbAccion = 'terciaria';
    });
    if (VISTA === 'clientes') $$('a[href^="venta.html?clienteId="]').forEach(function (a) { a.dataset.cbAccion = 'terciaria'; });
  })();

  // Botón de reinicio de la demo (Alt+R) para volver a los datos de ejemplo
  document.addEventListener('keydown', function (e) {
    if (e.altKey && (e.key === 'r' || e.key === 'R')) { try { localStorage.removeItem(KEY); } catch (x) {} location.reload(); }
  });
})();
