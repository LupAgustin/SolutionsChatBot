// editor.js

// Referencias al DOM
const canvasEl   = document.getElementById("canvas");
const connCanvas = document.getElementById("connCanvas");
const ctx        = connCanvas.getContext("2d");
const importer   = document.getElementById("importFile");

let nodes       = [];
let connections = [];
let counter     = 0;
let currentDrag = null;

// Zoom
let zoom = 1, ZOOM_STEP = 0.1, MIN_ZOOM = 0.5, MAX_ZOOM = 2;

// Ajusta canvas
function resizeCanvas() {
  connCanvas.width  = canvasEl.clientWidth;
  connCanvas.height = canvasEl.clientHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// — NODO START —
function createStartNode(id = 'start-0', pos = null) {
  if (nodes.some(n => n.classList.contains('start-node'))) return;
  const n = document.createElement('div');
  n.className  = 'start-node';
  n.dataset.id = id;
  if (pos) {
    n.style.top  = pos.top;
    n.style.left = pos.left;
  } else {
    n.style.top  = '20px';
    n.style.left = '20px';
  }
  n.innerHTML = `
    Start
    <div class="output-connector"></div>
  `;
  makeDraggable(n);
  n.querySelector('.output-connector')
   .addEventListener('mousedown', e => startDrag(e, id, null));
  canvasEl.appendChild(n);
  nodes.push(n);
}
createStartNode();

// — ZOOM —
function doZoom(delta) {
  zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
  canvasEl.style.zoom = zoom;
  draw();
}
document.getElementById("zoomIn").addEventListener("click", () => doZoom(+ZOOM_STEP));
document.getElementById("zoomOut").addEventListener("click", () => doZoom(-ZOOM_STEP));

// — PANNING —
let isPanning = false, panStart = {};
canvasEl.addEventListener("mousedown", e => {
  if (e.target === canvasEl) {
    isPanning = true;
    panStart = { x:e.clientX, y:e.clientY, sx:canvasEl.scrollLeft, sy:canvasEl.scrollTop };
    e.preventDefault();
  }
});
document.addEventListener("mousemove", e => {
  if (!isPanning) return;
  canvasEl.scrollLeft = panStart.sx - (e.clientX - panStart.x);
  canvasEl.scrollTop  = panStart.sy - (e.clientY - panStart.y);
  draw();
});
document.addEventListener("mouseup", () => { isPanning = false; });

// — ZOOM con rueda —
canvasEl.addEventListener("wheel", e => {
  e.preventDefault();
  const d = e.deltaY < 0 ? +ZOOM_STEP : -ZOOM_STEP;
  const old = zoom;
  zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + d));
  const rect = canvasEl.getBoundingClientRect();
  const mx = e.clientX - rect.left + canvasEl.scrollLeft;
  const my = e.clientY - rect.top  + canvasEl.scrollTop;
  const ratio = zoom/old;
  canvasEl.scrollLeft = mx*ratio - (e.clientX - rect.left);
  canvasEl.scrollTop  = my*ratio - (e.clientY - rect.top);
  canvasEl.style.zoom = zoom;
  draw();
});

// — CREAR TEXTO —
function createTextNode(id=null, text="", pos=null) {
  const nid = id || `txt-${counter++}`;
  const n = document.createElement("div");
  n.className = "text-node";
  n.dataset.id = nid;
  if (pos) { n.style.top=pos.top; n.style.left=pos.left; }
  else {
    n.style.top  = `${80+Math.random()*200}px`;
    n.style.left = `${80+Math.random()*300}px`;
  }
  n.innerHTML = `
    <button class="delete-node">×</button>
    <div class="input-connector"></div>
    <textarea placeholder="Mensaje...">${text}</textarea>
    <div class="output-connector"></div>
  `;
  n.querySelector(".delete-node").onclick = () => {
    nodes = nodes.filter(x=>x!==n);
    connections = connections.filter(c=>c.from!==nid&&c.to!==nid);
    n.remove(); draw();
  };
  makeDraggable(n);
  n.querySelector(".output-connector")
   .addEventListener("mousedown", e=>startDrag(e,nid,null));
  canvasEl.appendChild(n);
  nodes.push(n);
}

// — CREAR OPCIONES —
function createOptionsNode(id=null, opts=[], pos=null) {
  const nid = id||`opt-${counter++}`;
  const n = document.createElement("div");
  n.className = "options-node";
  n.dataset.id = nid;
  if (pos) { n.style.top=pos.top; n.style.left=pos.left; }
  else {
    n.style.top  = `${80+Math.random()*200}px`;
    n.style.left = `${80+Math.random()*300}px`;
  }
  n.innerHTML = `
    <button class="delete-node">×</button>
    <div class="input-connector"></div>
    <div class="options"></div>
    <button class="addOption">➕ Opción</button>
  `;
  n.querySelector(".delete-node").onclick = () => {
    nodes = nodes.filter(x=>x!==n);
    connections = connections.filter(c=>c.from!==nid&&c.to!==nid);
    n.remove(); draw();
  };
  makeDraggable(n);
  opts.forEach(o=>addOption(n,o.texto,o.siguiente));
  n.querySelector(".addOption")
   .addEventListener("click", ()=>addOption(n));
  canvasEl.appendChild(n);
  nodes.push(n);
}

// — AÑADIR OPCIÓN —
function addOption(node, txt="", to=null) {
  const idx = node.querySelectorAll(".option").length;
  const oid = `${node.dataset.id}-opt-${idx}`;
  const div = document.createElement("div");
  div.className = "option";
  div.innerHTML = `
    <input placeholder="Texto" value="${txt}" />
    <button class="delete-option">×</button>
    <div class="connector" data-option="${oid}"></div>
  `;
  div.querySelector(".delete-option").onclick = ()=>{
    connections = connections.filter(c=>!(c.from===node.dataset.id&&c.option===oid));
    div.remove(); draw();
  };
  div.querySelector(".connector")
     .addEventListener("mousedown",e=>startDrag(e,node.dataset.id,oid));
  node.querySelector(".options").appendChild(div);
  if (to) { connections.push({from:node.dataset.id,option:oid,to}); draw(); }
}

// — DRAGGABLE —
function makeDraggable(el) {
  let sx, sy;
  el.addEventListener("mousedown", function(e) {
    if (["TEXTAREA","INPUT"].includes(e.target.tagName)) return;
    if (e.target.matches(".connector, .input-connector, .output-connector, .delete-node, .addOption, .delete-option"))
      return;
    const rect = el.getBoundingClientRect();
    sx = (e.clientX - rect.left)/zoom;
    sy = (e.clientY - rect.top)/zoom;
    function mv(ev) {
      const cr = canvasEl.getBoundingClientRect();
      const x = (ev.clientX - cr.left)/zoom - sx + canvasEl.scrollLeft;
      const y = (ev.clientY - cr.top )/zoom - sy + canvasEl.scrollTop;
      el.style.left = `${x}px`;
      el.style.top  = `${y}px`;
      draw();
    }
    function up(){ document.removeEventListener("mousemove",mv); document.removeEventListener("mouseup",up); }
    document.addEventListener("mousemove", mv);
    document.addEventListener("mouseup", up);
    e.preventDefault();
  });
}

// — CONEXIONES —
function startDrag(e, fromId, optionId) {
  e.preventDefault();
  currentDrag = { from: fromId, option: optionId };
}
document.addEventListener("mouseup", e => {
  if (!currentDrag) return;
  const el  = document.elementFromPoint(e.clientX, e.clientY);
  const tgt = el && el.closest(".input-connector");
  if (tgt) {
    const toId = tgt.parentElement.dataset.id;
    connections.push({ from: currentDrag.from, option: currentDrag.option, to: toId });
    draw();
  }
  currentDrag = null;
});

// — DIBUJAR —
// Dibuja todas las flechas (versión actualizada para Start)
function draw() {
  ctx.clearRect(0, 0, connCanvas.width, connCanvas.height);
  const rect = canvasEl.getBoundingClientRect();

  connections.forEach(c => {
    let fromEl;

    if (c.option === null) {
      // primero pruebo como text-node
      fromEl = document.querySelector(
        `.text-node[data-id="${c.from}"] .output-connector`
      );
      // si no existe, puede ser el Start
      if (!fromEl) {
        fromEl = document.querySelector(
          `.start-node[data-id="${c.from}"] .output-connector`
        );
      }
    } else {
      // conector de opciones
      fromEl = document.querySelector(
        `.options-node[data-id="${c.from}"] .connector[data-option="${c.option}"]`
      );
    }

    const toEl = document.querySelector(
      `[data-id="${c.to}"] > .input-connector`
    );
    if (!fromEl || !toEl) return;

    // coordenadas absolutas de ambos conectores
    const r1 = fromEl.getBoundingClientRect(),
          r2 = toEl.getBoundingClientRect(),
          x1 = r1.left + r1.width/2 - rect.left,
          y1 = r1.top  + r1.height/2 - rect.top,
          x2 = r2.left + r2.width/2 - rect.left,
          y2 = r2.top  + r2.height/2 - rect.top;

    // línea
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "#555";
    ctx.lineWidth   = 2;
    ctx.stroke();

    // cabeza de flecha
    const ang = Math.atan2(y2 - y1, x2 - x1),
          head = 6;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - head * Math.cos(ang - Math.PI/6),
      y2 - head * Math.sin(ang - Math.PI/6)
    );
    ctx.lineTo(
      x2 - head * Math.cos(ang + Math.PI/6),
      y2 - head * Math.sin(ang + Math.PI/6)
    );
    ctx.closePath();
    ctx.fillStyle = "#555";
    ctx.fill();
  });
}


/// ==== EXPORTAR ESTADO + FLOW PARA CHATBOT ====
document.getElementById("export").addEventListener("click", () => {
  // 1) Construyo el estado del editor
  const state = {
    start:   null,
    textNodes:   {},
    optionNodes: {}
  };

  // — Start —
  const startEl = nodes.find(n => n.classList.contains("start-node"));
  if (startEl) {
    const sid = startEl.dataset.id;
    state.start = {
      id:   sid,
      pos:  { top: startEl.style.top, left: startEl.style.left },
      next: (() => {
        const c = connections.find(c=>c.from===sid && c.option===null);
        return c ? c.to : null;
      })()
    };
  }

  // — Text‑nodes —
  nodes.filter(n=>n.classList.contains("text-node"))
       .forEach(n => {
         const id      = n.dataset.id;
         const mensaje = n.querySelector("textarea").value;
         const pos     = { top: n.style.top, left: n.style.left };
         const next    = (() => {
           const c = connections.find(c=>c.from===id && c.option===null);
           return c ? c.to : null;
         })();
         state.textNodes[id] = { mensaje, pos, next };
       });

  // — Option‑nodes —
  nodes.filter(n=>n.classList.contains("options-node"))
       .forEach(n => {
         const id = n.dataset.id;
         const pos = { top: n.style.top, left: n.style.left };
         const opciones = [];
         n.querySelectorAll(".option").forEach((opt,i) => {
           const texto = opt.querySelector("input").value;
           const nid   = (() => {
             const oid = `${id}-opt-${i}`;
             const c   = connections.find(c=>c.from===id&&c.option===oid);
             return c ? c.to : null;
           })();
           opciones.push({ texto, next: nid });
         });
         state.optionNodes[id] = { pos, opciones };
       });

  // 2) Construyo el flow plano para el chatbot
  const flow = {};
  const firstId = state.start?.next || null;

  Object.entries(state.textNodes).forEach(([id, tn]) => {
    // clave: "inicio" si coincide con firstId
    const key = (id === firstId) ? "inicio" : id;
    const opciones = [];
    // buscar opciones en state.optionNodes[id]
    const on = state.optionNodes[tn.next] || state.optionNodes[`${id}-opts`];
    // pero en nuestro state cada option-node id coincide con tn.next
    if (state.optionNodes[tn.next]) {
      state.optionNodes[tn.next].opciones.forEach(o => {
        // mapeo next==firstId → "inicio"
        let dest = o.next;
        if (dest === firstId) dest = "inicio";
        opciones.push({ texto: o.texto, siguiente: dest });
      });
    }
    flow[key] = { mensaje: tn.mensaje, opciones };
  });

  // 3) Empaqueto todo y descargo
  const payload = { state, flow };
  const blob    = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
  const a       = document.createElement("a");
  a.href        = URL.createObjectURL(blob);
  a.download    = "flujo.json";
  a.click();
});

// ==== IMPORTAR ESTADO + FLOW EN EDITOR ====
importer.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const { state, flow } = JSON.parse(reader.result);

    // 1) limpio canvas
    nodes.forEach(n => n.remove());
    nodes = []; connections = []; counter = 0;

    // 2) recreo Start
    if (state.start) {
      createStartNode(state.start.id, state.start.pos);
    } else {
      createStartNode();
    }

    // 3) text-nodes (con sus posiciones)
    Object.entries(state.textNodes).forEach(([id, tn]) => {
      createTextNode(id, tn.mensaje, tn.pos);
    });

    // 4) options-nodes (con sus posiciones y texto)
    Object.entries(state.optionNodes).forEach(([id, on]) => {
      // transforme {texto, next} → {texto, siguiente} para el editor
      const opts = on.opciones.map(o => ({ texto: o.texto, siguiente: o.next }));
      createOptionsNode(id, opts, on.pos);
    });

    // 5) reconstruyo conexiones:
    // — Start → text
    if (state.start?.next) {
      connections.push({ from: state.start.id, option: null, to: state.start.next });
    }
    // — text → options
    Object.entries(state.textNodes).forEach(([id, tn]) => {
      if (tn.next) {
        connections.push({ from: id, option: null, to: tn.next });
      }
    });
    // — options → text
    Object.entries(state.optionNodes).forEach(([id, on]) => {
      on.opciones.forEach((o, i) => {
        if (o.next) {
          connections.push({
            from:   id,
            option: `${id}-opt-${i}`,
            to:     o.next
          });
        }
      });
    });

    // 6) dibujo flechas
    draw();
  };
  reader.readAsText(file);
});





// — BOTONES —
document.getElementById("addTextNode")
        .addEventListener("click",()=>createTextNode());
document.getElementById("addOptionsNode")
        .addEventListener("click",()=>createOptionsNode());
