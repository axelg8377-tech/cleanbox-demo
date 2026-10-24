/* CLEANBOX — demo clickeable. Datos ficticios guardados sólo en este navegador.
   Sin servidor, sin ARCA real: las facturas son de muestra.
   Los permisos de esta demo son visuales; en el sistema real los valida el servidor. */
(function () {
  'use strict';

  // ── Estado de la demo ──────────────────────────────────────────────
  var KEY = 'cleanbox-demo-v1';
  var HOY = '2026-10-24'; // fecha de los datos de ejemplo
  var NO_OCULTABLES = ['pedidos', 'venta', 'caja', 'ajustes'];
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
    t.className = 'fixed bottom-6 right-6 z-[60] px-space-md py-space-sm rounded-lg border font-label-md text-label-md flex items-center gap-2 ' +
      (tipo === 'error' ? 'bg-error-container text-on-error-container border-error' : 'bg-surface text-on-surface border-primary');
    t.innerHTML = '<span class="material-symbols-outlined text-[18px] ' + (tipo === 'error' ? 'text-error' : 'text-primary') + '">' +
      (tipo === 'error' ? 'error' : 'check_circle') + '</span><span>' + esc(msg) + '</span>';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  // Ventana modal con clases del sistema de Stitch
  function modal(titulo, cuerpo, botones) {
    var fondo = document.createElement('div');
    fondo.className = 'fixed inset-0 z-50 bg-inverse-surface/40 flex items-center justify-center p-space-md';
    fondo.innerHTML = '<div class="w-full max-w-[480px] bg-surface-container-lowest border border-outline rounded-lg flex flex-col max-h-[90vh]">' +
      '<div class="p-space-md border-b border-outline flex items-center justify-between"><h2 class="font-headline-md text-headline-md font-bold text-on-surface">' + esc(titulo) + '</h2>' +
      '<button type="button" data-cerrar class="w-8 h-8 rounded hover:bg-surface-container flex items-center justify-center text-on-surface-variant" title="Cerrar"><span class="material-symbols-outlined text-[20px]">close</span></button></div>' +
      '<div class="p-space-md overflow-y-auto flex flex-col gap-4" data-cuerpo></div>' +
      '<div class="p-space-md border-t border-outline bg-surface flex items-center gap-space-sm" data-pie></div></div>';
    $('[data-cuerpo]', fondo).appendChild(cuerpo);
    (botones || []).forEach(function (b) {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = b.primario
        ? 'flex-1 bg-primary text-on-primary rounded py-2 px-space-md font-label-md text-label-md flex items-center justify-center gap-1.5 hover:bg-primary-container active:scale-[0.98] transition-colors'
        : 'px-space-md py-2 text-on-surface-variant hover:text-on-surface border border-outline rounded font-label-md text-label-md hover:bg-surface-container transition-colors';
      el.textContent = b.texto;
      el.addEventListener('click', function () { if (b.accion() !== false) cerrar(); });
      $('[data-pie]', fondo).appendChild(el);
    });
    function cerrar() { fondo.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') cerrar(); }
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

  // Remitos ficticios compartidos por Caja y Facturar. No se agregan al guardar ni al recargar.
  var EJEMPLOS = [
    { remito: 'R-0228', ticket: 'T-0414', iso: '2026-10-23', hora: '10:05', cliente: 'Bodega Cerro Negro', tipo: 'empresa',
      items: [{ nombre: 'Camisa', cant: 6, precio: 2500 }, { nombre: 'Pantalón', cant: 2, precio: 3000 }], total: 21000, pagos: [], observaciones: 'Una camisa con mancha en el cuello.' },
    { remito: 'R-0229', ticket: 'T-0415', iso: HOY, hora: '09:20', cliente: 'Bodega Piedra Alta', tipo: 'empresa',
      items: [{ nombre: 'Bolsa de lavado institucional', cant: 6, precio: 6500 }], total: 39000, pagos: [] },
    { remito: 'R-0230', ticket: 'T-0416', iso: HOY, hora: '09:45', cliente: 'Lucía Ferreyra', tipo: 'particular',
      items: [{ nombre: 'Camisa', cant: 2, precio: 2500 }], total: 5000, pagos: [{ iso: HOY, hora: '09:45', medio: 'Efectivo', importe: 2000 }] },
    { remito: 'R-0231', ticket: 'T-0417', iso: HOY, hora: '10:00', cliente: 'Hotel Cordillera', tipo: 'empresa',
      items: [{ nombre: 'Mantel', cant: 10, precio: 4000 }], total: 40000, pagos: [{ iso: HOY, hora: '10:00', medio: 'Transferencia', importe: 40000 }] }
  ];
  if (!S.remitosEjemplo) S.remitosEjemplo = JSON.parse(JSON.stringify(EJEMPLOS));
  function ventas() { return S.remitosEjemplo.concat(S.ventas); }
  function pagos(v) {
    // Compatibilidad: un arreglo vacío es deuda; sólo ventas antiguas sin campo eran cobros completos.
    return Array.isArray(v.pagos) ? v.pagos : (['Efectivo', 'Transferencia', 'Mercado Pago'].indexOf(v.medio) >= 0
      ? [{ iso: v.iso, hora: v.hora, medio: v.medio, importe: v.total }] : []);
  }
  function cobrado(v) { return pagos(v).reduce(function (n, p) { return n + p.importe; }, 0); }
  function saldo(v) { return Math.max(0, v.total - cobrado(v)); }
  function estadoCobro(v) { return saldo(v) === 0 ? 'Pagado' : cobrado(v) ? 'Pago parcial' : 'Debe / cuenta corriente'; }
  function detalleVenta(v) { return v.items ? v.items.map(function (it) { return it.cant + ' ' + it.nombre; }).join(' + ') : v.detalle || ''; }
  function ventaPedido(p) { return p && ventas().filter(function (v) { return v.pedido === '#' + p.n; })[0]; }
  function fechaValida(iso) { return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !isNaN(d(iso).getTime()) && fechaCorta(iso) === iso.slice(8, 10) + '/' + iso.slice(5, 7); }
  var BTN = 'px-3 py-2 border border-outline rounded text-primary font-label-md text-[13px] hover:bg-surface-container focus:outline-primary';
  var MEDIOS = ['Efectivo', 'Transferencia', 'Mercado Pago'];

  function formularioPago(obtenerTotal, inicial) {
    var box = document.createElement('div'), modo = inicial || 'Debe', valores = {};
    box.className = 'flex flex-col gap-2';
    box.innerHTML = '<span class="text-xs font-bold text-on-surface-variant">Forma de pago</span><div data-modos class="flex flex-wrap gap-1"></div>' +
      '<div data-importes class="flex flex-col gap-2"></div><p data-saldo role="status" class="text-[13px] font-label-md text-on-surface"></p>';
    MEDIOS.forEach(function (m) {
      var label = document.createElement('label'); label.className = 'flex items-center justify-between gap-2 text-[13px] text-on-surface';
      label.innerHTML = esc(m) + '<input aria-label="Importe en ' + esc(m) + '" type="number" min="0" step="1" value="0" class="w-28 px-2 py-1.5 bg-background border border-outline rounded focus:border-primary">';
      valores[m] = $('input', label); valores[m].addEventListener('input', actualizar); $('[data-importes]', box).appendChild(label);
    });
    ['Debe'].concat(MEDIOS, ['Parcial / combinado']).forEach(function (m) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = m; b.className = BTN;
      b.addEventListener('click', function () { modo = m; actualizar(); }); $('[data-modos]', box).appendChild(b);
    });
    function leer() {
      var total = obtenerTotal(), lista = [];
      if (!importeValido(total)) return null;
      if (modo === 'Debe') return [];
      if (modo !== 'Parcial / combinado') return total > 0 ? [{ medio: modo, importe: total }] : [];
      var invalido = MEDIOS.some(function (m) { var el = valores[m]; return el.value === '' || !el.checkValidity() || !importeValido(Number(el.value)); });
      if (invalido) return null;
      MEDIOS.forEach(function (m) { var n = Number(valores[m].value); if (n > 0) lista.push({ medio: m, importe: n }); });
      var suma = lista.reduce(function (n, p) { return n + p.importe; }, 0);
      return importeValido(suma) && suma > 0 && suma <= total ? lista : null;
    }
    function actualizar() {
      $$('button', $('[data-modos]', box)).forEach(function (b) { b.setAttribute('aria-pressed', String(b.textContent === modo)); b.classList.toggle('bg-primary-container', b.textContent === modo); });
      $('[data-importes]', box).classList.toggle('hidden', modo !== 'Parcial / combinado');
      var lista = leer(), suma = lista ? lista.reduce(function (n, p) { return n + p.importe; }, 0) : 0;
      $('[data-saldo]', box).textContent = lista ? 'Paga ahora: ' + plata(suma) + ' · Queda debiendo: ' + plata(obtenerTotal() - suma) : 'Revisá los importes: deben ser positivos y no superar el saldo.';
    }
    actualizar();
    return { elemento: box, leer: leer, actualizar: actualizar, reiniciar: function () { modo = 'Debe'; MEDIOS.forEach(function (m) { valores[m].value = 0; }); actualizar(); } };
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
      '<p class="font-label-md text-on-surface">Total: ' + plata(v.total) + '<br>Pagado: ' + plata(cobrado(v)) + '<br>Saldo pendiente: ' + plata(saldo(v)) + ' · ' + estadoCobro(v) + '</p>' +
      '<div class="text-sm text-on-surface"><b>Historial de pagos</b>' + (pagos(v).length ? pagos(v).map(function (p) { return '<p>' + esc(p.iso) + ' · ' + esc(p.medio) + ' · ' + plata(p.importe) + '</p>'; }).join('') : '<p>Sin pagos registrados.</p>') + '</div>';
    var acciones = [{ texto: 'Imprimir remito', accion: function () { imprimirTicket(v); } }];
    if (saldo(v) > 0) acciones.unshift({ texto: 'Registrar pago', primario: true, accion: function () { registrarPago(v, alCambiar); } });
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

  function consultarMovimientos(alCambiar) {
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
    function enFecha(iso) { return iso ? (!desde.value || iso >= desde.value) && (!hasta.value || iso <= hasta.value) : !desde.value && !hasta.value; }
    function renderConsulta() {
      if (desde.value && hasta.value && desde.value > hasta.value) { $('[data-resumen]', cuerpo).textContent = 'Revisá el rango de fechas'; $('tbody', cuerpo).innerHTML = ''; return; }
      var filas = [], q = norm(buscar.value), identidades = {}, sinIdentificar = 0, cantVentas = 0;
      ventas().forEach(function (v) {
        var actividad = [], p = S.pedidos.filter(function (p0) { return v.pedido === '#' + p0.n; })[0];
        if (enFecha(v.iso)) actividad.push('Venta / remito');
        if (pagos(v).some(function (pago) { return enFecha(pago.iso); })) actividad.push('Cobro');
        if (p && p.entregadoIso && enFecha(p.entregadoIso)) actividad.push('Entrega');
        if (actividad.length && (!q || norm(v.cliente).indexOf(q) >= 0) && (!pendientes.checked || saldo(v) > 0)) {
          if (enFecha(v.iso)) cantVentas++;
          var fechasActividad = [];
          if (enFecha(v.iso) && v.iso) fechasActividad.push(v.iso);
          pagos(v).forEach(function (pago) { if (enFecha(pago.iso) && fechasActividad.indexOf(pago.iso) < 0) fechasActividad.push(pago.iso); });
          if (p && p.entregadoIso && enFecha(p.entregadoIso) && fechasActividad.indexOf(p.entregadoIso) < 0) fechasActividad.push(p.entregadoIso);
          filas.push({ registro: v, fecha: fechasActividad.join(', ') || 'Sin fecha', actividad: actividad.join(' / '), venta: v });
        }
      });
      if (!pendientes.checked) S.pedidos.forEach(function (p) {
        if (enFecha(p.iso) && (!q || norm(p.cliente).indexOf(q) >= 0)) filas.push({ registro: p, fecha: p.iso || 'Sin fecha de recepción', actividad: 'Recepción #' + p.n, venta: ventaPedido(p) });
      });
      filas.forEach(function (f) { var c = clienteRegistro(f.registro); if (c) identidades[c.id] = true; else sinIdentificar++; });
      var remitosUnicos = {};
      filas.forEach(function (f) { if (f.venta) remitosUnicos[f.venta.remito] = f.venta; });
      var saldoFiltrado = Object.keys(remitosUnicos).reduce(function (n, id) { return n + saldo(remitosUnicos[id]); }, 0);
      $('[data-resumen]', cuerpo).textContent = cantVentas + ' ventas · ' + Object.keys(identidades).length + ' clientes identificados · ' + filas.length + ' movimientos · Saldo de remitos: ' + plata(saldoFiltrado) + (sinIdentificar ? ' · ' + sinIdentificar + ' movimientos sin identidad confirmada' : '');
      $('tbody', cuerpo).innerHTML = filas.map(function (f, i) {
        return '<tr class="border-b border-outline"><td class="py-2">' + esc(f.fecha) + '<br><span class="text-xs text-on-surface-variant">' + esc(f.actividad) + '</span></td><td>' + esc(f.registro.cliente) + '</td><td class="text-right">' + (f.venta ? plata(f.venta.total) : '—') + '</td><td class="text-right">' + (f.venta ? plata(saldo(f.venta)) : '—') + '</td><td><button type="button" data-mov="' + i + '" class="' + BTN + '">' + (f.venta ? 'Ver remito' : 'Cargar remito') + '</button></td></tr>';
      }).join('') || '<tr><td colspan="5" class="py-4">Sin movimientos con estos filtros.</td></tr>';
      $$('[data-mov]', cuerpo).forEach(function (b) { b.addEventListener('click', function () { var f = filas[+b.dataset.mov]; if (f.venta) verRemito(f.venta, function () { renderConsulta(); if (alCambiar) alCambiar(); }); else location.href = 'venta.html?pedido=' + f.registro.n; }); });
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

  // ── Impresión de ticket/remito 80 mm (por duplicado) ──────────────
  function imprimirTicket(v) {
    var N = S.negocio;
    var copia = function (leyenda) {
      return '<div class="t">' + (N.logo ? '<img src="' + N.logo + '" class="logo">' : '<div class="marca">CLEANBOX</div>') +
        '<div class="c">TINTORERÍA</div><div class="c s">' + esc(N.direccion) + '<br>Tel: ' + esc(N.telefono) + '</div><hr>' +
        '<div class="f"><b>' + (v.tipo === 'empresa' ? 'REMITO ' + v.remito : 'TICKET ' + v.ticket) + '</b><span>' + esc(v.fecha || v.iso) + ' ' + esc(v.hora) + '</span></div>' +
        '<div>Cliente: ' + esc(v.cliente) + '</div>' + (v.cuit ? '<div class="s">CUIT: ' + esc(v.cuit) + '</div>' : '') +
        (v.pedido ? '<div class="s">Pedido ' + esc(v.pedido) + '</div>' : '') + '<hr>' +
        v.items.map(function (i) { return '<div class="f"><span>' + i.cant + ' ' + esc(i.nombre) + '</span><span>' + plata(i.cant * i.precio) + '</span></div>'; }).join('') +
        (v.descuento ? '<div class="f s"><span>Descuento</span><span>-' + plata(v.descuento) + '</span></div>' : '') +
        '<hr><div class="f tot"><span>TOTAL</span><span>' + plata(v.total) + '</span></div>' +
        '<div class="f"><span>Pagado</span><span>' + plata(cobrado(v)) + '</span></div><div class="f"><b>Saldo pendiente</b><b>' + plata(saldo(v)) + '</b></div>' +
        '<div class="s">' + estadoCobro(v) + '</div>' + pagos(v).map(function (p) { return '<div class="s">' + esc(p.iso) + ' · ' + esc(p.medio) + ': ' + plata(p.importe) + '</div>'; }).join('') +
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
      var numCls = prep ? 'text-secondary' : 'text-primary';
      var cab = listo ? '<span class="text-[10px] tracking-widest text-tertiary font-mono font-bold uppercase">LISTO PARA RETIRAR</span>'
        : '<span class="text-[10px] tracking-widest text-on-surface-variant font-mono uppercase">TICKET DE MOSTRADOR</span>';
      var derecha = (listo && p.entrega === HOY)
        ? '<span class="font-label-md text-xs font-bold text-tertiary bg-tertiary-fixed px-2 py-0.5 rounded border border-outline-variant flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">schedule</span>Entrega hoy</span>'
        : '<span class="text-xs text-on-surface-variant font-medium">Recepción ' + esc(p.hora) + '</span>';
      var meta = (p.detalle ? '<span class="px-2 py-0.5 bg-surface-container rounded border border-outline-variant font-medium text-on-surface">' + esc(p.detalle) + '</span>' : '') +
        (listo && p.nota ? '<span class="text-on-surface-variant font-medium">' + esc(p.nota) + '</span>'
          : '<span class="flex items-center gap-1 font-medium text-on-surface-variant"><span class="material-symbols-outlined text-[14px]">event</span>' + entregaTxt(p.entrega) + '</span>');
      var accion = listo
        ? '<button data-acc="entregar" class="font-label-md text-xs font-bold text-primary hover:text-on-primary-fixed-variant bg-surface-container hover:bg-surface-container-high px-2.5 py-1 rounded border border-outline flex items-center gap-1 active:scale-[0.98]" type="button"><span>Entregar y cobrar</span><span class="material-symbols-outlined text-[14px]">arrow_forward</span></button>'
        : prep
          ? '<button data-acc="listo" class="font-label-md text-xs font-bold text-secondary hover:text-on-secondary-container flex items-center gap-1 hover:underline active:scale-[0.98]" type="button"><span>Marcar listo</span><span class="material-symbols-outlined text-[14px]">arrow_forward</span></button>'
          : '<button data-acc="preparar" class="font-label-md text-xs font-bold text-primary hover:text-on-primary-fixed-variant flex items-center gap-1 hover:underline active:scale-[0.98]" type="button"><span>Pasar a preparación</span><span class="material-symbols-outlined text-[14px]">arrow_forward</span></button>';
      return '<article data-n="' + p.n + '" class="relative bg-surface border border-outline rounded-lg flex flex-col overflow-hidden">' +
        '<div class="h-5 bg-surface-container-low border-b border-dashed border-outline px-3 flex items-center justify-between">' +
        '<div class="w-2.5 h-2.5 rounded-full bg-outline-variant -ml-4 border border-outline"></div>' + cab +
        '<div class="w-2.5 h-2.5 rounded-full bg-outline-variant -mr-4 border border-outline"></div></div>' +
        '<div class="p-3 flex flex-col"><div class="flex items-baseline justify-between mb-1"><span class="font-headline-md text-headline-md font-bold ' + numCls + '">#' + p.n + '</span>' + derecha + '</div>' +
        '<div class="font-label-md text-label-md text-on-surface mb-2">' + esc(p.cliente) + '</div>' +
        '<div class="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant mb-3">' + meta + '</div>' +
        '<div class="pt-2 border-t border-outline flex flex-wrap justify-end gap-2"><button type="button" data-acc="remito" class="' + BTN + '">' + (ventaPedido(p) ? 'Ver remito / pagos' : 'Remito / anticipo') + '</button>' + accion + '</div></div></article>';
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
    // Recibir pedido: cliente (con alta en el mismo paso), detalle opcional, fecha de entrega
    var recibir = byText('header button', 'Recibir pedido')[0] || $$('header button').filter(function (b) { return /Recibir pedido/.test(b.textContent); })[0];
    recibir.addEventListener('click', function () {
      var cli = null, entrega = addDias(HOY, 3);
      var cuerpo = document.createElement('div');
      cuerpo.className = 'flex flex-col gap-4';
      cuerpo.appendChild(selectorCliente(function (c) { cli = c; }));
      var extra = document.createElement('div');
      extra.className = 'flex flex-col gap-4';
      extra.innerHTML = campo('Detalle <span class="text-on-surface-variant font-normal">(opcional)</span>', '<input data-det class="' + INPUT + '" placeholder="Ej. 6 bolsas · 3 camisas y 1 saco">') +
        campo('Observaciones para el remito (opcional)', '<textarea data-obs rows="2" class="' + INPUT + '" placeholder="Ej. Camisa con mancha en el cuello; saco con forro roto"></textarea>') +
        '<div><label class="' + LABEL + '">Fecha de entrega</label><div class="flex flex-wrap items-center gap-2">' +
        '<button type="button" data-d="1" class="px-3 py-1.5 rounded border border-outline font-label-md text-[13px] text-on-surface hover:bg-surface-container">Mañana</button>' +
        '<button type="button" data-d="3" class="px-3 py-1.5 rounded border border-primary bg-primary-container text-on-primary-container font-label-md text-[13px]">En 3 días</button>' +
        '<button type="button" data-d="7" class="px-3 py-1.5 rounded border border-outline font-label-md text-[13px] text-on-surface hover:bg-surface-container">En 1 semana</button>' +
        '<input data-fecha type="date" class="px-3 py-1.5 bg-background border border-outline rounded text-[14px] text-on-surface focus:outline-none focus:border-primary" value="' + entrega + '"></div></div>' +
        '<p class="text-[12px] text-on-surface-variant">El conteo de prendas se puede hacer al entregar.</p>';
      cuerpo.appendChild(extra);
      var fechaIn = $('[data-fecha]', extra);
      $$('[data-d]', extra).forEach(function (b) {
        b.addEventListener('click', function () {
          fechaIn.value = addDias(HOY, +b.dataset.d);
          $$('[data-d]', extra).forEach(function (o) { o.className = 'px-3 py-1.5 rounded border font-label-md text-[13px] ' + (o === b ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline text-on-surface hover:bg-surface-container'); });
        });
      });
      modal('Recibir pedido', cuerpo, [
        { texto: 'Guardar pedido', primario: true, accion: function () {
          if (!cli) { toast('Elegí o creá el cliente', 'error'); return false; }
          var p = { n: S.sigPedido++, clienteId: cli.id, cliente: cli.nombre, detalle: $('[data-det]', extra).value.trim(), entrega: fechaIn.value || entrega, estado: 'recibido', hora: ahora() };
          p.observaciones = $('[data-obs]', extra).value.trim();
          p.iso = HOY;
          S.pedidos.unshift(p); cli.ultimo = fechaCorta(HOY); cli.ultimoNro = '#' + p.n; save(); render();
          toast('Pedido #' + p.n + ' recibido');
        } },
        { texto: 'Cancelar', accion: function () {} }
      ]);
    });
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
    if (ventaPedido(pedido)) { location.replace('caja.html?remito=' + encodeURIComponent(ventaPedido(pedido).remito)); return; }
    var cliente = pedido ? clienteRegistro(pedido) : (params.get('clienteId') ? S.clientes.filter(function (c) { return c.id === params.get('clienteId'); })[0] : params.get('cliente') ? clienteUnico(params.get('cliente')) : null);
    // Si no viene de un pedido ni de Clientes, arranca con el ejemplo de Stitch
    var items = [];
    if (!pedido && !cliente && !params.has('clienteId') && !params.has('cliente') && !params.has('pedido')) {
      cliente = clientePorNombre('Bodega Cerro Negro');
      items = [{ nombre: 'Bolsa de lavado institucional', cant: 5 }, { nombre: 'Mantel', cant: 2 }];
    }
    var descPct = cliente && cliente.tipo === 'empresa' && items.length ? 10 : 0;
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
            cliente = elegido; if (cliente.tipo !== 'empresa') descPct = 0; pintarCliente(); render();
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
          '<label class="flex flex-col gap-1 text-xs text-on-surface-variant">Descripción' +
          '<input data-descripcion="' + i + '" aria-label="Descripción del renglón ' + (i + 1) + '" value="' + esc(descripcion(it)) + '" class="' + INPUT + ' font-bold"></label>' +
          '<div class="flex justify-between items-center gap-2 text-[13px]"><label class="flex items-center gap-1 text-on-surface-variant">Unitario $' +
          '<input data-precio="' + i + '" aria-label="Precio unitario del renglón ' + (i + 1) + '" type="number" min="0" step="1" value="' + esc(it.precioEntrada != null ? it.precioEntrada : unitario(it)) + '" class="w-24 min-w-0 px-2 py-1.5 bg-surface-container-lowest border border-outline rounded text-on-surface focus:outline-none focus:border-primary"></label>' +
          '<div class="flex items-center gap-2 bg-surface-container-lowest border border-outline rounded p-0.5">' +
          '<button type="button" data-menos="' + i + '" class="w-7 h-7 flex items-center justify-center rounded text-on-surface hover:bg-surface-container active:scale-95 text-lg font-bold">−</button>' +
          '<span class="font-headline-md text-[15px] font-bold w-5 text-center">' + it.cant + '</span>' +
          '<button type="button" data-mas="' + i + '" class="w-7 h-7 flex items-center justify-center rounded text-on-surface hover:bg-surface-container active:scale-95 text-lg font-bold">+</button></div></div>' +
          '<div class="text-right font-headline-md text-[16px] font-bold text-on-surface" data-importe>' + plata(it.cant * unitario(it)) + '</div></div>';
      }).join('') : '<p class="text-[13px] text-on-surface-variant py-space-sm">Tocá una prenda de la izquierda para sumarla.</p>');
      // Botones de la grilla: "N en ticket"
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
      if (lista) pintarLista();
      return totales();
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
      var m = e.target.closest('[data-menos],[data-mas]'); if (!m) return;
      var i = +(m.dataset.menos || m.dataset.mas);
      items[i].cant += m.dataset.mas ? 1 : -1;
      if (items[i].cant <= 0) items.splice(i, 1);
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
    formPago = formularioPago(function () { return totalesSinActualizar(); }, cliente && cliente.tipo === 'empresa' ? 'Debe' : 'Efectivo');
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
      if (invalido) { toast('Completá la descripción y un precio válido en cada renglón', 'error'); invalido.focus(); return; }
      if (ventaPedido(pedido)) { toast('Este pedido ya tiene remito. Abrilo desde Caja para registrar el pago.', 'error'); return; }
      var r = render();
      var nuevosPagos = formPago.leer();
      if (!nuevosPagos || !importeValido(r.tot) || r.tot <= 0 || items.some(function (it) { return !importeValido(unitario(it)) || !Number.isSafeInteger(it.cant) || it.cant <= 0 || !importeValido(unitario(it) * it.cant); })) { toast('Revisá total e importes del pago: usá pesos enteros válidos', 'error'); return; }
      var v = {
        ticket: 'T-' + ('0000' + S.sigTicket++).slice(-4), remito: 'R-' + ('0000' + S.sigRemito++).slice(-4),
        fecha: fechaCorta(HOY) + '/2026', iso: HOY, hora: ahora(), clienteId: cliente.id, cliente: cliente.nombre, tipo: cliente.tipo, cuit: cliente.cuit || '',
        items: items.map(function (it) { return { nombre: descripcion(it).trim(), cant: it.cant, precio: unitario(it) }; }),
        detalle: items.map(function (it) { return it.cant + ' ' + descripcion(it).trim().toLowerCase(); }).join(' + '),
        observaciones: observaciones.value.trim(),
        pagos: nuevosPagos.map(function (p) { return { medio: p.medio, importe: p.importe, iso: HOY, hora: ahora() }; }),
        descuento: r.desc, total: r.tot, medio: nuevosPagos.length > 1 ? 'Combinado' : nuevosPagos.length ? nuevosPagos[0].medio : 'Debe', pedido: pedido ? '#' + pedido.n : '',
        entrega: entregaIso ? (function (x) { return DIAS[x.getDay()] + ' ' + ('0' + x.getDate()).slice(-2) + '/' + ('0' + (x.getMonth() + 1)).slice(-2) + '/' + x.getFullYear(); })(d(entregaIso)) : ''
      };
      S.ventas.push(v);
      var estadoAnterior = pedido && pedido.estado;
      if (pedido && params.get('entregar') === '1') { pedido.estado = 'entregado'; pedido.entregadoIso = HOY; }
      cliente.ultimo = fechaCorta(HOY); if (pedido) cliente.ultimoNro = '#' + pedido.n;
      if (!save()) { S.ventas.pop(); if (pedido) { pedido.estado = estadoAnterior; delete pedido.entregadoIso; } toast('No se pudo guardar el remito. Revisá el almacenamiento del navegador.', 'error'); return; }
      if (imprimir) imprimirTicket(v);
      toast('Remito ' + v.remito + ' guardado · pagado ' + plata(cobrado(v)) + ' · debe ' + plata(saldo(v)));
      items = []; pedido = null; totalManual = null; descPct = 0; observaciones.value = ''; formPago.reiniciar(); ponerEntrega(addDias(HOY, 3)); pintarCliente(); render(); nro();
    }
    var cobrarBtn = $$('button', colTicket).filter(function (b) { return /Cobrar e imprimir/.test(b.textContent); })[0];
    var guardarBtn = $$('button', colTicket).filter(function (b) { return /Guardar sin imprimir/.test(b.textContent); })[0];
    var avisoRemito = document.createElement('p'); avisoRemito.className = 'text-xs text-on-surface-variant';
    avisoRemito.textContent = 'Confirmá prendas y total antes de guardar el remito o un anticipo. Después podés registrar pagos sobre este mismo comprobante.';
    agregarRenglon.after(avisoRemito);
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
      var b = e.target.closest('[data-l-mas],[data-l-menos]'); if (!b) return;
      var nombre = b.dataset.lMas || b.dataset.lMenos;
      var it = items.filter(function (x) { return x.nombre === nombre; })[0];
      if (b.dataset.lMas) { if (it) it.cant++; else items.push({ nombre: nombre, cant: 1 }); }
      else if (it) { it.cant--; if (it.cant <= 0) items.splice(items.indexOf(it), 1); }
      totalManual = null; render();
    });
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
            ? '<div class="inline-flex items-center gap-2 bg-surface-container-lowest border border-outline rounded p-0.5">' +
              '<button type="button" data-l-menos="' + n + '" class="w-7 h-7 flex items-center justify-center rounded text-on-surface hover:bg-surface-container text-lg font-bold">−</button>' +
              '<span class="font-headline-md text-[15px] font-bold w-6 text-center">' + it.cant + '</span>' +
              '<button type="button" data-l-mas="' + n + '" class="w-7 h-7 flex items-center justify-center rounded text-on-surface hover:bg-surface-container text-lg font-bold">+</button></div>'
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
    var tarifario = $$('button').filter(function (b) { return /Ver tarifario completo/.test(b.textContent); })[0];
    if (tarifario) tarifario.addEventListener('click', function () { location.href = vistaPermitida('precios') ? 'precios.html' : 'venta.html'; });
    pintarCliente(); render(); nro();
  })();

  // ── CLIENTES ──────────────────────────────────────────────────────
  if (VISTA === 'clientes') (function () {
    var secciones = $$('main section');
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
      return '<div class="p-3.5 flex items-center justify-between hover:bg-surface-container-low transition-colors"><div class="flex items-center gap-3">' +
        '<div class="w-8 h-8 ' + (emp ? 'rounded bg-surface-container' : 'rounded-full bg-surface-variant') + ' flex items-center justify-center text-primary font-headline-md font-bold text-xs">' + esc(iniciales(c.nombre)) + '</div>' +
        '<div><div class="flex items-center gap-2"><span class="font-headline-md font-semibold text-on-surface text-[15px]">' + esc(c.nombre) + '</span>' +
        '<span class="text-xs text-on-surface-variant">· ' + (emp ? 'CUIT ' + esc(c.cuit) : 'Tel: ' + esc(c.tel)) + '</span></div>' +
        '<div class="flex items-center gap-3 text-xs text-on-surface-variant mt-0.5">' +
        (emp ? '<span class="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant border border-outline-variant">Resp. Inscripto</span>' : '') +
        (c.ultimo ? '<span>Último pedido: <strong class="text-on-surface font-medium">' + esc(c.ultimo) + '</strong>' + (c.ultimoNro ? ' (' + esc(c.ultimoNro) + ')' : '') + '</span>' : '<span>Sin pedidos todavía</span>') +
        '</div></div></div><div class="flex items-center gap-2">' +
        '<a href="venta.html?clienteId=' + encodeURIComponent(c.id) + '" class="px-3 py-1.5 text-xs font-label-md border border-outline rounded text-primary hover:bg-surface-container active:scale-[0.98] transition-[color,background-color,border-color,transform] flex items-center gap-1">' +
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
    var plantilla = $$('tr', tbody);
    var MEDIO_ROW = {};
    plantilla.forEach(function (tr) { MEDIO_ROW[$$('td', tr)[3].textContent.trim()] = tr; });
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
    $('[data-consultar]', barra).addEventListener('click', function () { consultarMovimientos(renderCaja); });
    function renderCaja() {
      MEDIOS.forEach(function (m) { tot[m] = [0, 0]; }); total = 0; n = 0; tbody.innerHTML = '';
      var movimientos = [];
      ventas().forEach(function (v) { pagos(v).forEach(function (p) { if (p.iso === fechaCaja.value && tot[p.medio]) movimientos.push({ v: v, p: p }); }); });
      movimientos.sort(function (a, b) { return (a.p.hora || '').localeCompare(b.p.hora || ''); });
      movimientos.forEach(function (mov) {
        var v = mov.v, p = mov.p, tr = (MEDIO_ROW[p.medio] || plantilla[0]).cloneNode(true), td = $$('td', tr);
        td[0].textContent = p.hora; td[1].textContent = v.ticket || v.remito; td[2].textContent = v.cliente; td[4].textContent = plata(p.importe);
        var b = $('button', td[5]); b.setAttribute('aria-label', 'Ver remito ' + v.remito); b.addEventListener('click', function () { verRemito(v, renderCaja); });
        tbody.appendChild(tr); tot[p.medio][0] += p.importe; tot[p.medio][1]++; total += p.importe; n++;
      });
      if (!movimientos.length) tbody.innerHTML = '<tr><td colspan="6" class="py-4 px-space-md text-on-surface-variant">Sin cobros en esta fecha. Los remitos en debe no suman caja.</td></tr>';
      MEDIOS.forEach(function (m, i) { $('span.text-headline-md', cards[i]).textContent = plata(tot[m][0]); $('p', cards[i]).textContent = tot[m][1] + ' cobros'; });
      $('span.text-display', cards[3]).textContent = plata(total); $('span.px-2', cards[3]).textContent = n + ' cobros'; $('tfoot td.text-right').textContent = plata(total);
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

  // ── FACTURAR ──────────────────────────────────────────────────────
  if (VISTA === 'facturar') (function () {
    var tbody = $('main tbody');
    var filas0 = $$('tr', tbody);
    var tplSin = filas0[0], tplCon = filas0[3];
    // Filas de ejemplo de Stitch → datos
    var REM = ventas();
    if (!S.facturas['R-0231']) S.facturas['R-0231'] = 'A 0003-00000412';
    var estado = 'sin';
    var ESTADOS = { sin: 'Estado: Sin facturar', con: 'Estado: Facturadas', todas: 'Estado: Todas' };

    // Filtros: el texto fijo de Stitch pasa a ser campo editable con el mismo estilo
    var barra = $('main > div:nth-of-type(1)');
    var pillCli = $('div.flex.items-center.gap-2', barra);
    var nombreSpan = $('span.font-bold', pillCli);
    var cliIn = document.createElement('input');
    cliIn.value = nombreSpan.textContent.trim(); cliIn.placeholder = 'Todos';
    cliIn.className = 'font-bold text-on-surface font-label-md text-xs bg-transparent border-0 p-0 w-40 focus:ring-0 focus:outline-none';
    nombreSpan.replaceWith(cliIn);
    $('button', pillCli).addEventListener('click', function () { cliIn.value = ''; render(); });
    var pillFecha = $$('div.flex.items-center.gap-1\\.5', barra)[0];
    var fechas = $$('span.font-medium', pillFecha);
    function campoFecha(span, iso) {
      var i = document.createElement('input'); i.type = 'date'; i.value = iso;
      i.className = 'font-medium text-xs text-on-surface bg-transparent border-0 p-0 focus:ring-0 focus:outline-none';
      span.replaceWith(i); return i;
    }
    var desde = campoFecha(fechas[0], '2026-10-01'), hasta = campoFecha(fechas[1], '2026-10-31');
    var atajos = $$('div.flex.items-center.gap-1 > button', barra);
    var AT_ON = 'px-2.5 py-1 rounded text-xs font-bold font-label-md bg-primary-container text-on-primary-container border border-primary';
    var AT_OFF = 'px-2.5 py-1 rounded text-xs font-label-md text-on-surface-variant hover:bg-surface-container transition-colors';
    var rangos = [[HOY, HOY], [addDias(HOY, -4), addDias(HOY, 2)], ['2026-10-01', '2026-10-31']];
    atajos.forEach(function (b, i) {
      b.addEventListener('click', function () {
        desde.value = rangos[i][0]; hasta.value = rangos[i][1];
        atajos.forEach(function (o) { o.className = o === b ? AT_ON : AT_OFF; }); render();
      });
    });
    [cliIn, desde, hasta].forEach(function (x) { x.addEventListener('input', function () { atajos.forEach(function (o) { o.className = AT_OFF; }); render(); }); });
    var btnEstado = $$('button', barra).filter(function (b) { return /Estado:/.test(b.textContent); })[0];
    btnEstado.addEventListener('click', function () {
      estado = estado === 'sin' ? 'con' : estado === 'con' ? 'todas' : 'sin';
      $('span', btnEstado).textContent = ESTADOS[estado]; render();
    });
    var emitidas = $$('header button').filter(function (b) { return /facturas emitidas/.test(b.textContent); })[0];
    if (emitidas) { $('span.material-symbols-outlined', emitidas).textContent = 'receipt_long'; emitidas.addEventListener('click', function () { estado = 'con'; $('span', btnEstado).textContent = ESTADOS.con; render(); }); }

    function fila(r) {
      var fact = S.facturas[r.remito];
      var tr = (fact ? tplCon : tplSin).cloneNode(true);
      tr.className = 'hover:bg-surface-container-low transition-colors';
      var td = $$('td', tr), f = r.iso.split('-');
      td[0].textContent = f[2] + '/' + f[1] + '/' + f[0];
      td[1].textContent = r.remito; td[2].textContent = r.cliente; td[3].textContent = detalleVenta(r);
      var ico = r.medio === 'Efectivo' ? ['payments', 'text-tertiary'] : r.medio === 'Mercado Pago' ? ['qr_code_2', 'text-primary'] : ['account_balance', 'text-secondary'];
      td[4].textContent = estadoCobro(r);
      td[5].textContent = plata(r.total);
      td[6].classList.add('whitespace-nowrap'); td[7].classList.add('whitespace-nowrap');
      if (fact) {
        td[6].innerHTML = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold font-label-md bg-primary-fixed text-on-primary-fixed-variant border border-outline-variant"><span class="material-symbols-outlined text-[13px]">check_circle</span>' + esc(fact) + '</span>';
        var bs = $$('button', td[7]);
        bs[0].addEventListener('click', function () { pdf(r, fact); });
        bs[1].addEventListener('click', function () { location.href = 'mailto:?subject=' + encodeURIComponent('Factura ' + fact + ' · CLEANBOX') + '&body=' + encodeURIComponent('Hola, te enviamos la factura ' + fact + ' por ' + plata(r.total) + ' (remito ' + r.remito + ').'); });
        bs[2].addEventListener('click', function () { window.open('https://wa.me/?text=' + encodeURIComponent('Hola! Te enviamos la factura ' + fact + ' de CLEANBOX por ' + plata(r.total) + ' (remito ' + r.remito + ').'), '_blank'); });
      } else if (r.tipo !== 'empresa') {
        td[6].innerHTML = '<span class="inline-block px-2 py-0.5 rounded text-[11px] font-bold font-label-md bg-surface-container-high text-on-surface-variant border border-outline-variant">Remito particular</span>';
        td[7].innerHTML = '<span class="text-[11px] text-on-surface-variant">No lleva factura</span>';
      } else {
        $('button', td[7]).addEventListener('click', function () { facturar(r); });
      }
      var ver = document.createElement('button'); ver.type = 'button'; ver.textContent = 'Ver remito'; ver.className = BTN;
      ver.addEventListener('click', function () { verRemito(r, render); }); td[7].prepend(ver);
      return tr;
    }
    function render() {
      var t = norm(cliIn.value);
      var vis = REM.filter(function (r) {
        var f = S.facturas[r.remito];
        return (!t || norm(r.cliente).indexOf(t) >= 0) && (!desde.value || r.iso >= desde.value) && (!hasta.value || r.iso <= hasta.value) &&
          (estado === 'todas' || (estado === 'sin' ? !f : !!f));
      }).sort(function (a, b) { return a.iso < b.iso ? -1 : 1; });
      tbody.innerHTML = '';
      vis.forEach(function (r) { tbody.appendChild(fila(r)); });
      if (!vis.length) tbody.innerHTML = '<tr><td colspan="8" class="py-space-lg px-space-md text-center text-on-surface-variant">No hay remitos con estos filtros.</td></tr>';
      var sin = vis.filter(function (r) { return !S.facturas[r.remito] && r.tipo === 'empresa'; });
      var resumen = $$('main span').filter(function (s) { return /remitos ·|remito ·/.test(s.textContent); })[0];
      if (resumen) resumen.textContent = vis.length + (vis.length === 1 ? ' remito' : ' remitos') + ' · ' + sin.length + ' sin facturar';
      var pend = $$('main span.font-headline-md').pop();
      pend.textContent = plata(sin.reduce(function (a, r) { return a + r.total; }, 0));
    }
    function facturar(r) {
      var c = clientePorNombre(r.cliente) || {};
      var neto = r.total / 1.21, iva = r.total - neto;
      var cuerpo = document.createElement('div');
      cuerpo.className = 'flex flex-col gap-3 text-[14px]';
      cuerpo.innerHTML = '<div class="p-3 rounded bg-surface-container-low border border-outline flex flex-col gap-1">' +
        '<div class="flex justify-between"><span class="text-on-surface-variant">Cliente</span><b>' + esc(r.cliente) + '</b></div>' +
        '<div class="flex justify-between"><span class="text-on-surface-variant">CUIT</span><span>' + esc(c.cuit || '—') + '</span></div>' +
        '<div class="flex justify-between"><span class="text-on-surface-variant">Remito</span><span>' + esc(r.remito) + ' · ' + esc(detalleVenta(r)) + '</span></div></div>' +
        '<div class="flex flex-col gap-1"><div class="flex justify-between"><span>Neto gravado</span><span>' + plata(neto) + '</span></div>' +
        '<div class="flex justify-between"><span>IVA 21%</span><span>' + plata(iva) + '</span></div>' +
        '<div class="flex justify-between font-headline-md text-[20px] font-bold text-primary border-t border-outline pt-2"><span>Total factura A</span><span>' + plata(r.total) + '</span></div></div>' +
        '<p class="text-[12px] text-on-surface-variant">Demo: no se envía a ARCA. En el sistema real se pide el CAE y se guarda el PDF.</p>';
      modal('Emitir factura A', cuerpo, [
        { texto: 'Emitir factura A', primario: true, accion: function () {
          var num = 'A 0003-' + ('00000000' + S.sigFactura++).slice(-8);
          S.facturas[r.remito] = num; save(); render();
          toast('Factura ' + num + ' emitida (demo)');
        } },
        { texto: 'Cancelar', accion: function () {} }
      ]);
    }
    function pdf(r, num) {
      var N = S.negocio, c = clientePorNombre(r.cliente) || {};
      var neto = r.total / 1.21;
      var w = window.open('', '_blank', 'width=800,height=900');
      if (!w) { toast('El navegador bloqueó la ventana', 'error'); return; }
      w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Factura ' + esc(num) + '</title><style>' +
        'body{font:14px/1.5 Arial,sans-serif;color:#17262f;max-width:720px;margin:24px auto;padding:0 16px}' +
        '.top{display:flex;justify-content:space-between;border:1px solid #b9c9d2;padding:16px}.A{font:700 40px Arial;border:2px solid #17262f;width:56px;text-align:center;align-self:flex-start}' +
        'table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border-bottom:1px solid #e3edf2;padding:6px;text-align:left}.r{text-align:right}' +
        '.demo{margin-top:24px;padding:8px;border:1px dashed #b3261e;color:#b3261e;text-align:center;font-weight:700}' +
        '</style></head><body><div class="top"><div>' + (N.logo ? '<img src="' + N.logo + '" style="max-height:60px"><br>' : '<b style="font-size:22px;color:#0f7799">CLEANBOX</b><br>') +
        esc(N.direccion) + '<br>IVA Responsable Inscripto</div><div class="A">A</div><div class="r"><b>FACTURA</b><br>N° ' + esc(num.replace('A ', '')) + '<br>Fecha: ' + fechaCorta(HOY) + '/2026</div></div>' +
        '<p><b>' + esc(r.cliente) + '</b><br>CUIT ' + esc(c.cuit || '') + ' · IVA Responsable Inscripto<br>Remito ' + esc(r.remito) + '</p>' +
        '<table><tr><th>Detalle</th><th class="r">Importe</th></tr><tr><td>' + esc(detalleVenta(r)) + '</td><td class="r">' + plata(neto) + '</td></tr>' +
        '<tr><td class="r">Neto gravado</td><td class="r">' + plata(neto) + '</td></tr><tr><td class="r">IVA 21%</td><td class="r">' + plata(r.total - neto) + '</td></tr>' +
        '<tr><th class="r">TOTAL</th><th class="r">' + plata(r.total) + '</th></tr></table>' +
        '<div class="demo">DEMO SIN VALIDEZ FISCAL · sin CAE</div></body></html>');
      w.document.close();
    }
    render();
  })();

  // ── AJUSTES ───────────────────────────────────────────────────────
  if (VISTA === 'ajustes') (function () {
    // Módulos ocultables (patrón de Comandera: settings.modulosOcultos)
    var MAP = { 'Clientes': 'clientes', 'Facturar': 'facturar', 'Presupuestos': 'presupuestos', 'Precios': 'precios' };
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
    var tabEdit = $('tbody', izq), tabHoja = $('tbody', hoja);
    var tplEdit = $('tr', tabEdit).cloneNode(true), tplHoja = $('tr', tabHoja).cloneNode(true);
    var P = {
      nro: 31, cliente: clientePorNombre('Hotel Cordillera'), pct: 8, nota: 'Retiro y entrega semanal a coordinar.',
      items: [
        { nombre: 'Sábana 2 plazas', desc: 'Lavado industrial + planchado', cant: 120 },
        { nombre: 'Toalla', desc: 'Lavado y secado', cant: 200 },
        { nombre: 'Mantel', desc: 'Desmanchado + apresto ligero', cant: 40 }
      ]
    };
    var descIn = $$('input', izq).filter(function (i) { return i.value === '8%'; })[0];
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
    function render() {
      tabEdit.innerHTML = ''; tabHoja.innerHTML = '';
      var sub = 0;
      P.items.forEach(function (it, i) {
        var pu = precioDe(it.nombre), st = pu * it.cant; sub += st;
        var tr = tplEdit.cloneNode(true), td = $$('td', tr);
        $$('span', td[0])[0].textContent = it.nombre; $$('span', td[0])[1].textContent = it.desc || '';
        var q = $('input', td[1]); q.value = it.cant;
        q.addEventListener('change', function () { it.cant = Math.max(1, aNum(q.value)); render(); });
        td[2].textContent = plata(pu); td[3].textContent = plata(st);
        $('button', td[4]).addEventListener('click', function () { P.items.splice(i, 1); render(); });
        tabEdit.appendChild(tr);
        var th = tplHoja.cloneNode(true), tdh = $$('td', th);
        $$('span', tdh[0])[0].textContent = it.nombre; $$('span', tdh[0])[1].textContent = it.desc || '';
        tdh[1].textContent = it.cant; tdh[2].textContent = plata(pu); tdh[3].textContent = plata(st);
        tabHoja.appendChild(th);
      });
      var desc = Math.round(sub * P.pct / 100), tot = sub - desc;
      var cuenta = $$('span', izq).filter(function (s) { return /renglones cargados|renglón cargado/.test(s.textContent); })[0];
      if (cuenta) cuenta.textContent = P.items.length + (P.items.length === 1 ? ' renglón cargado' : ' renglones cargados');
      var descTxt = descIn.parentElement.parentElement.querySelector('span.text-error');
      descTxt.textContent = desc ? '-' + plata(desc) : '$0';
      var panelTot = $$('div.bg-surface-container-low.border.border-outline.rounded-lg', izq).pop();
      $('div.text-\\[34px\\]', panelTot).textContent = plata(tot);
      var strongs = $$('strong', panelTot);
      strongs[0].textContent = plata(sub); strongs[1].textContent = desc ? '-' + plata(desc) : '$0';
      $$('div.text-error', panelTot)[0].firstChild.textContent = 'Descuento (' + P.pct + '%): ';
      var resumen = $$('div.w-64', hoja)[0], filasR = $$(':scope > div', resumen);
      $$('span', filasR[0])[1].textContent = plata(sub);
      $$('span', filasR[1])[0].textContent = 'Descuento (' + P.pct + '%):';
      $$('span', filasR[1])[1].textContent = desc ? '-' + plata(desc) : '$0';
      $$('span', filasR[2])[1].textContent = plata(tot);
      $$('div.border-l-4', hoja)[0].innerHTML = '<strong class="text-on-surface font-label-md">Nota:</strong> ' + esc(notaIn.value);
      var n = 'P-' + ('0000' + P.nro).slice(-4);
      $$('span', hoja).filter(function (s) { return /PRESUPUESTO N°/.test(s.textContent); })[0].textContent = 'PRESUPUESTO N° ' + n;
      $$('span', izq).filter(function (s) { return /^Borrador #/.test(s.textContent.trim()); })[0].textContent = 'Borrador #' + n;
      var val = $$('span', hoja).filter(function (s) { return /^Validez:/.test(s.textContent.trim()); })[0];
      if (val) val.innerHTML = 'Validez: <strong>' + esc(validez.value.split(' (')[0]) + '</strong>';
      if (S.negocio.logo) { var ic = $('div.w-12', hoja); if (ic) ic.outerHTML = '<img src="' + S.negocio.logo + '" alt="" class="w-12 h-12 object-contain">'; }
      return { sub: sub, desc: desc, tot: tot };
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
          { texto: 'Agregar', primario: true, accion: function () { P.items.push({ nombre: $('[data-s]', cuerpo).value, desc: '', cant: Math.max(1, aNum($('[data-c]', cuerpo).value)) }); render(); } },
          { texto: 'Cancelar', accion: function () {} }
        ]);
      });
    });
    function texto() { var r = render(); return 'Hola! Te paso el presupuesto P-' + ('0000' + P.nro).slice(-4) + ' de CLEANBOX Tintorería por ' + plata(r.tot) + '. ' + validez.value.split(' (')[0] + ' de validez.'; }
    // Impresión: sólo la hoja A4
    var css = document.createElement('style');
    css.textContent = '@media print{aside,header,main>section:first-child,main>section:last-child>div:first-child,main>section:last-child>div:last-child{display:none!important}body,main{display:block!important;overflow:visible!important;height:auto!important}main>section{width:100%!important}}';
    document.head.appendChild(css);
    $$('button', hoja).forEach(function (b) {
      var t = b.textContent;
      if (/Descargar PDF/.test(t)) b.addEventListener('click', function () { window.print(); });
      if (/WhatsApp/.test(t)) b.addEventListener('click', function () { window.open('https://wa.me/?text=' + encodeURIComponent(texto()), '_blank'); });
      if (/correo/.test(t)) b.addEventListener('click', function () { location.href = 'mailto:?subject=' + encodeURIComponent('Presupuesto CLEANBOX') + '&body=' + encodeURIComponent(texto()); });
      if (/Guardar presupuesto/.test(t)) b.addEventListener('click', function () { toast('Presupuesto P-' + ('0000' + P.nro).slice(-4) + ' guardado'); });
    });
    var nuevo = $$('header button').filter(function (b) { return /Nuevo presupuesto/.test(b.textContent); })[0];
    if (nuevo) nuevo.addEventListener('click', function () { P.nro++; P.items = []; P.pct = 0; descIn.value = '0%'; render(); toast('Presupuesto nuevo'); });
    pintarCliente(); render();
  })();

  // Botón de reinicio de la demo (Alt+R) para volver a los datos de ejemplo
  document.addEventListener('keydown', function (e) {
    if (e.altKey && (e.key === 'r' || e.key === 'R')) { try { localStorage.removeItem(KEY); } catch (x) {} location.reload(); }
  });
})();
