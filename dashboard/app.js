// Simulación del flujo de MediLink. Todo es falso: sirve para explicar la idea, no para operar.

const NS = "http://www.w3.org/2000/svg";
const COLORES = { evento: "#1d2733", cama: "#2f6fdb", medicina: "#c26a12", alerta: "#c8372d", ok: "#2c8a3f" };

let hospitales;
let comboActual = null;   // { paciente, cama, medicina, restante, timer }
let colaPendiente = {};   // eventos que un nodo caído recibirá al recuperarse
let siguientePaciente = 0;
let ocupado = false;

const $ = (id) => document.getElementById(id);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const buscar = (id) => hospitales.find((h) => h.id === id);
const activos = () => hospitales.filter((h) => h.activo);

// ---------- Estado ----------

function reiniciar() {
  if (comboActual) clearInterval(comboActual.timer);
  hospitales = HOSPITALES_INICIALES.map((h) => ({
    ...h,
    activo: true,
    camasReservadas: 0,
    medicinas: h.medicinas.map((m) => ({ ...m, reservadas: 0 }))
  }));
  comboActual = null;
  colaPendiente = {};
  siguientePaciente = 0;
  ocupado = false;
  $("log").innerHTML = "";
  marcarPaso(0);
  dibujarMapa();
  pintarInventario();
  pintarComboVacio();
  actualizarBotones();
}

// ---------- Mapa ----------

function svg(tag, attrs = {}, padre = $("mapa")) {
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  padre.appendChild(el);
  return el;
}

function dibujarMapa() {
  const mapa = $("mapa");
  mapa.innerHTML = "";

  hospitales.forEach((h) => svg("line", { class: "enlace", x1: h.x, y1: h.y, x2: BUS.x, y2: BUS.y }));
  svg("g", { id: "capa-traslados" });

  const bus = svg("g", { class: "bus" });
  svg("circle", { cx: BUS.x, cy: BUS.y, r: 34 }, bus);
  svg("text", { x: BUS.x, y: BUS.y - 2 }, bus).textContent = "Bus de";
  svg("text", { x: BUS.x, y: BUS.y + 12 }, bus).textContent = "eventos";

  hospitales.forEach((h) => {
    const g = svg("g", { class: "nodo" + (h.activo ? "" : " caido"), id: "nodo-" + h.id });
    svg("circle", { cx: h.x, cy: h.y, r: 30 }, g);
    svg("text", { class: "letra", x: h.x, y: h.y }, g).textContent = h.id;
    svg("text", { class: "nombre", x: h.x, y: h.y + 48 }, g).textContent = h.nombre;
    svg("text", { class: "estado", x: h.x, y: h.y + 63 }, g).textContent = h.activo
      ? "En línea"
      : `CAÍDO · ${(colaPendiente[h.id] || 0)} eventos en cola`;
    g.addEventListener("click", () => alternarNodo(h.id));
  });
}

// Anima un "paquete" (evento) viajando de un punto a otro.
function enviar(desde, hasta, color = COLORES.evento, ms = 600) {
  return new Promise((resolve) => {
    const p = svg("circle", { class: "paquete", cx: desde.x, cy: desde.y, r: 6, fill: color });
    const inicio = performance.now();
    function paso(t) {
      const k = Math.min((t - inicio) / ms, 1);
      p.setAttribute("cx", desde.x + (hasta.x - desde.x) * k);
      p.setAttribute("cy", desde.y + (hasta.y - desde.y) * k);
      if (k < 1) requestAnimationFrame(paso);
      else { p.remove(); resolve(); }
    }
    requestAnimationFrame(paso);
  });
}

// Publicar = nodo → bus → resto de nodos activos. Los caídos acumulan el evento en su cola.
async function publicar(origen, color) {
  await enviar(origen, BUS, color);
  hospitales.filter((h) => h !== origen && !h.activo).forEach((h) => {
    colaPendiente[h.id] = (colaPendiente[h.id] || 0) + 1;
  });
  dibujarMapaConservandoTraslados();
  await Promise.all(activos().filter((h) => h !== origen).map((h) => enviar(BUS, h, color)));
}

function dibujarMapaConservandoTraslados() {
  const traslados = $("capa-traslados")?.innerHTML || "";
  dibujarMapa();
  $("capa-traslados").innerHTML = traslados;
  resaltar(comboActual ? [comboActual.cama.id, comboActual.medicina.id] : []);
}

function dibujarTraslado(a, b) {
  const capa = $("capa-traslados");
  const curva = `M ${a.x} ${a.y} Q ${BUS.x} ${Math.min(a.y, b.y) - 60} ${b.x} ${b.y}`;
  svg("path", { class: "traslado", d: curva }, capa);
  setTimeout(() => (capa.innerHTML = ""), 4000);
}

// ---------- Paneles ----------

function pintarInventario() {
  $("inventario").innerHTML = hospitales.map((h) => {
    const libres = h.camas - h.camasReservadas;
    const meds = h.medicinas.map((m) => `
      <span class="chip medicina">${m.nombre}: ${m.cant - m.reservadas}
        ${m.reservadas ? `<span class="res">(${m.reservadas} res.)</span>` : ""}
        ${m.caducaEnDias <= 14 ? `<span class="caduca">· caduca en ${m.caducaEnDias} d</span>` : ""}
      </span>`).join("");
    return `
      <div class="hosp ${h.activo ? "" : "caido"}">
        <div class="hosp-titulo"><span>${h.id} · ${h.nombre}</span><span>${h.activo ? "🟢" : "🔴"}</span></div>
        <span class="chip cama">Camas libres: ${libres}
          ${h.camasReservadas ? `<span class="res">(${h.camasReservadas} res.)</span>` : ""}
        </span>
        ${meds}
      </div>`;
  }).join("");
}

function pintarComboVacio(mensaje) {
  $("combo-cuerpo").className = mensaje ? "" : "vacio";
  $("combo-cuerpo").innerHTML = mensaje ||
    'Pulsa <b>+ Paciente crítico</b> para ver cómo la red arma un combo <b>cama + medicina</b> entre hospitales.';
}

function pintarCombo() {
  const c = comboActual;
  $("combo-cuerpo").className = "";
  $("combo-cuerpo").innerHTML = `
    <div class="paciente">
      <strong>${c.paciente.nombre}</strong> <span class="etiqueta">${c.paciente.motivo}</span><br>
      Necesita: <b>${c.paciente.necesita}</b> · Llegó al hospital <b>${c.origen.id}</b>
    </div>
    <div class="piezas">
      <div class="pieza cama">
        <div class="tipo">Cama</div>
        <div class="donde">${c.cama.id} · ${c.cama.nombre}</div>
        <div class="razon">El que más camas libres tiene</div>
      </div>
      <div class="pieza medicina">
        <div class="tipo">${c.paciente.necesita}</div>
        <div class="donde">${c.medicina.id} · ${c.medicina.nombre}</div>
        <div class="razon">Lote que caduca antes (${c.lote.caducaEnDias} días): evita desperdicio</div>
      </div>
    </div>
    <div class="ttl"><div id="ttl-barra" style="width:${(c.restante / TTL_SEGUNDOS) * 100}%"></div></div>
    <div class="ttl-texto">Reserva válida por <b id="ttl-seg">${c.restante}</b> s. Si nadie aprueba, se libera sola.</div>
    <div class="combo-acciones">
      <button class="btn ok" id="btn-aprobar">Aprobar traslado</button>
      <button class="btn" id="btn-rechazar">Rechazar</button>
    </div>`;
  $("btn-aprobar").onclick = aprobar;
  $("btn-rechazar").onclick = () => liberarCombo("rechazado por el médico");
}

function registrar(tipo, texto) {
  const hora = new Date().toLocaleTimeString("es-EC", { hour12: false });
  $("log").insertAdjacentHTML("afterbegin",
    `<li><span class="hora">${hora}</span><span class="tipo ${tipo}">${tipo}</span><span>${texto}</span></li>`);
}

function marcarPaso(n) {
  document.querySelectorAll("#pasos li").forEach((li) => {
    const p = Number(li.dataset.paso);
    li.classList.toggle("activo", p === n);
    li.classList.toggle("hecho", p < n);
  });
}

function actualizarBotones() {
  $("btn-paciente").disabled = ocupado || !!comboActual || activos().length === 0;
}

// ---------- Flujo principal ----------

async function nuevoPaciente() {
  ocupado = true;
  actualizarBotones();

  const paciente = PACIENTES[siguientePaciente++ % PACIENTES.length];
  const posibles = activos();
  const origen = posibles[Math.floor(Math.random() * posibles.length)];

  // 1. Paciente crítico
  marcarPaso(1);
  registrar("paciente_critico", `${paciente.nombre} llega a ${origen.id} y necesita cama + ${paciente.necesita}`);
  await publicar(origen, COLORES.alerta);

  // 2. Cada hospital activo revisa su inventario y ofrece lo que tiene
  marcarPaso(2);
  await esperar(300);
  const ofertasCama = [];
  const ofertasMed = [];
  for (const h of activos()) {
    if (h.camas - h.camasReservadas > 0) {
      h.camasReservadas++;
      ofertasCama.push(h);
      registrar("oferta_cama", `${h.id} reserva 1 cama (le quedan ${h.camas - h.camasReservadas})`);
    }
    const lote = h.medicinas.find((m) => m.nombre === paciente.necesita && m.cant - m.reservadas > 0);
    if (lote) {
      lote.reservadas++;
      ofertasMed.push({ h, lote });
      registrar("oferta_medicina", `${h.id} reserva 1 ${lote.nombre} (caduca en ${lote.caducaEnDias} días)`);
    }
  }
  pintarInventario();
  await Promise.all([
    ...ofertasCama.map((h) => enviar(h, BUS, COLORES.cama)),
    ...ofertasMed.map(({ h }) => enviar(h, BUS, COLORES.medicina))
  ]);
  await enviar(BUS, origen, COLORES.evento);

  // 3. El hospital de origen elige la mejor combinación y libera el resto
  if (!ofertasCama.length || !ofertasMed.length) {
    ofertasCama.forEach((h) => h.camasReservadas--);
    ofertasMed.forEach(({ lote }) => lote.reservadas--);
    const falta = !ofertasCama.length ? "camas" : paciente.necesita;
    registrar("reserva_liberada", `No hay ${falta} disponible en la red. Se liberan las reservas.`);
    pintarComboVacio(`<div class="mensaje alerta">Sin combo para <b>${paciente.nombre}</b>: no hay ${falta} en ningún hospital activo.</div>`);
    marcarPaso(0);
    terminarPaso();
    return;
  }

  marcarPaso(3);
  const cama = ofertasCama.reduce((a, b) => (b.camas - b.camasReservadas > a.camas - a.camasReservadas ? b : a));
  const { h: medicina, lote } = ofertasMed.reduce((a, b) => (b.lote.caducaEnDias < a.lote.caducaEnDias ? b : a));

  ofertasCama.filter((h) => h !== cama).forEach((h) => {
    h.camasReservadas--;
    registrar("reserva_liberada", `${h.id} libera su cama (no fue elegida)`);
  });
  ofertasMed.filter((o) => o.h !== medicina).forEach((o) => {
    o.lote.reservadas--;
    registrar("reserva_liberada", `${o.h.id} libera su ${o.lote.nombre} (no fue elegida)`);
  });

  registrar("combo_propuesto", `Cama en ${cama.id} + ${paciente.necesita} desde ${medicina.id}`);
  comboActual = { paciente, origen, cama, medicina, lote, restante: TTL_SEGUNDOS };
  comboActual.timer = setInterval(tickTTL, 1000);
  pintarInventario();
  pintarCombo();
  resaltar([cama.id, medicina.id]);
  await publicar(origen, COLORES.ok);
  terminarPaso();
}

function tickTTL() {
  const c = comboActual;
  c.restante--;
  if ($("ttl-seg")) {
    $("ttl-seg").textContent = c.restante;
    $("ttl-barra").style.width = `${(c.restante / TTL_SEGUNDOS) * 100}%`;
  }
  if (c.restante <= 0) liberarCombo("el TTL expiró sin aprobación");
}

async function aprobar() {
  const c = comboActual;
  clearInterval(c.timer);
  comboActual = null;

  c.cama.camasReservadas--;
  c.cama.camas--;
  c.lote.reservadas--;
  c.lote.cant--;

  marcarPaso(4);
  registrar("traslado_aprobado", `${c.paciente.nombre}: ${c.paciente.necesita} viaja de ${c.medicina.id} a ${c.cama.id}`);
  pintarInventario();
  pintarComboVacio(`<div class="mensaje ok">Traslado aprobado: <b>${c.paciente.nombre}</b> ocupa cama en <b>${c.cama.id}</b> y recibe ${c.paciente.necesita} desde <b>${c.medicina.id}</b>.</div>`);
  resaltar([]);
  if (c.cama !== c.medicina) dibujarTraslado(c.medicina, c.cama);
  await publicar(c.origen, COLORES.ok);
  actualizarBotones();
}

function liberarCombo(motivo) {
  const c = comboActual;
  if (!c) return;
  clearInterval(c.timer);
  comboActual = null;

  if (c.cama.camasReservadas > 0) c.cama.camasReservadas--;
  if (c.lote.reservadas > 0) c.lote.reservadas--;

  registrar("reserva_liberada", `Combo de ${c.paciente.nombre} cancelado: ${motivo}`);
  pintarInventario();
  pintarComboVacio(`<div class="mensaje alerta">Reserva liberada (${motivo}). Los recursos vuelven a estar disponibles.</div>`);
  resaltar([]);
  marcarPaso(0);
  actualizarBotones();
}

function terminarPaso() {
  ocupado = false;
  actualizarBotones();
}

function resaltar(ids) {
  hospitales.forEach((h) => $("nodo-" + h.id)?.classList.toggle("resaltado", ids.includes(h.id)));
}

// ---------- Caída y recuperación de nodos ----------

async function alternarNodo(id) {
  if (ocupado) return;
  const h = buscar(id);
  h.activo = !h.activo;

  if (!h.activo) {
    colaPendiente[id] = 0;
    registrar("nodo_caido", `${h.id} deja de responder. El resto de la red sigue operando.`);
    if (comboActual && (comboActual.cama === h || comboActual.medicina === h)) {
      liberarCombo(`el hospital ${h.id} se cayó; pulsa + Paciente crítico para reasignar`);
    }
  } else {
    const n = colaPendiente[id] || 0;
    registrar("nodo_recuperado", `${h.id} vuelve a la red y sincroniza ${n} evento(s) pendientes de su cola`);
    colaPendiente[id] = 0;
  }

  dibujarMapaConservandoTraslados();
  pintarInventario();
  actualizarBotones();
}

function caidaAleatoria() {
  const candidatos = hospitales.filter((h) => h.activo);
  const caidos = hospitales.filter((h) => !h.activo);
  // Si ya hay uno caído lo recupera; si no, tumba uno al azar.
  if (caidos.length) alternarNodo(caidos[0].id);
  else if (candidatos.length) alternarNodo(candidatos[Math.floor(Math.random() * candidatos.length)].id);
}

// ---------- Inicio ----------

$("btn-paciente").addEventListener("click", nuevoPaciente);
$("btn-caida").addEventListener("click", caidaAleatoria);
$("btn-reiniciar").addEventListener("click", reiniciar);
reiniciar();
