(() => {
  const SCRIPT_URL = (document.currentScript && document.currentScript.src) || location.href;
  const WA = (window.MAR && window.MAR.wa) || "";
  const wa = (t) => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ES = document.documentElement.lang === "es", LOC = ES ? "es-ES" : "it-IT";
  const T = ES ? {
    def: "¡Hola Mar! Quiero información sobre las clases.", play: "Escucha la clave", stop: "Para la clave",
    pickDay: "Elige primero el día.", busy: "Ocupado", pickAll: "Elige clase, día y hora.", at: "a las",
    req: "¡Hola Mar! Quiero reservar:", name: "Nombre", note: "Notas", prenota: "#prenota",
    hi: "¡Hola! Soy el asistente de Mar 💃 Con 3 preguntas te indico la clase ideal para ti.",
    q1: "¿Qué quieres bailar?", a1: ["Salsa", "Bachata", "Salsa Lady", "Timba / Rumba", "Folclore peruano", "Preparar una competición", "Soy profesor/a"],
    q2: "¿Qué nivel tienes?", a2: ["Empiezo de cero", "Ya bailo un poco", "Nivel avanzado"],
    q3: "¿Prefieres presencial u online?", a3: ["En Bari", "Online"],
    end: (o) => `¡Perfecto! Te propongo empezar con una clase de prueba ${o ? "online (40 €)" : "presencial (30 €)"}: evaluamos tu nivel y creamos tu plan.`,
    go: "Seguir en WhatsApp", slot: "Elegir día y hora",
    msg: (p) => `¡Hola Mar! Te escribo desde la web.\n• Quiero aprender: ${p.stile}\n• Nivel: ${p.livello}\n• Formato: ${p.formato}\nQuiero reservar la clase de prueba.`
  } : {
    def: "Ciao Mar! Vorrei informazioni sulle lezioni.", play: "Ascolta la clave", stop: "Ferma la clave",
    pickDay: "Scegli prima il giorno.", busy: "Occupato", pickAll: "Scegli lezione, giorno e ora.", at: "ore",
    req: "Ciao Mar! Vorrei prenotare:", name: "Nome", note: "Note", prenota: "#prenota",
    hi: "¡Hola! Sono l'assistente di Mar 💃 In 3 domande ti indico la lezione giusta per te.",
    q1: "Cosa vuoi ballare?", a1: ["Salsa", "Bachata", "Salsa Lady", "Timba / Rumba", "Folclore peruviano", "Preparare una gara", "Sono insegnante"],
    q2: "Che livello hai?", a2: ["Parto da zero", "Ballo già un po'", "Livello avanzato"],
    q3: "Preferisci in presenza o online?", a3: ["A Bari", "Online"],
    end: (o) => `Perfetto! Ti propongo di iniziare con una lezione di prova ${o ? "online (40 €)" : "in presenza (30 €)"}: valutiamo il tuo livello e costruiamo il tuo piano.`,
    go: "Continua su WhatsApp", slot: "Scegli giorno e ora",
    msg: (p) => `Ciao Mar! Ho scritto dal sito.\n• Voglio imparare: ${p.stile}\n• Livello: ${p.livello}\n• Formato: ${p.formato}\nVorrei prenotare la lezione di prova.`
  };

  /* link WhatsApp */
  $$("[data-wa]").forEach((a) => { a.href = wa(a.dataset.wa || T.def); a.target = "_blank"; a.rel = "noopener"; });

  /* menu mobile */
  const burger = $("#burger"), nav = $("#nav");
  burger && burger.addEventListener("click", () => { const o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });

  /* prezzi: presenza / online */
  $$("[data-toggle]").forEach((box) => {
    const btns = $$("button", box);
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((x) => x.setAttribute("aria-pressed", x === b));
      $$("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== b.dataset.show));
    }));
  });

  /* clave 3-2: suona davvero */
  const beats = $("#beats");
  if (beats) {
    const CL = [0, 3, 6, 10, 12];
    ["Lato 3", "Lato 2"].forEach((lab, b) => {
      const bar = document.createElement("div"); bar.className = "cbar"; bar.innerHTML = `<small>${lab}</small><div class="cells"></div>`;
      const row = $(".cells", bar);
      for (let j = 0; j < 8; j++) {
        const i = b * 8 + j, n = i / 2 + 1, st = document.createElement("span");
        st.className = "st" + (CL.includes(i) ? " hit" : "") + (n === 4 || n === 8 ? " rest" : "");
        st.innerHTML = `<i></i><em>${i % 2 ? "" : n}</em>`; row.appendChild(st);
      }
      beats.appendChild(bar);
    });
    const cells = $$(".st", beats), btn = $("#clavePlay");
    /* base: brano di salsa a 90 BPM (4 battute in loop) con la voce che conta 1-2-3, 5-6-7 */
    const SRC = new URL("salsa-90bpm.wav", SCRIPT_URL).href, E = 60 / 90 / 2;
    const WORDS = { 1: "Uno", 2: "Dos", 3: "Tres", 5: "Cinco", 6: "Seis", 7: "Siete" };
    const box = $("#clave"), word = $("#cword");
    let ctx, buf, srcNode, t0 = 0, raf = 0, on = false, last = -1;
    const draw = () => {
      const lat = ctx.outputLatency || ctx.baseLatency || 0;
      const el = ctx.currentTime - t0 - lat;
      if (el >= 0) {
        const s = Math.floor(el / E) % 16;
        if (s !== last) { last = s; cells.forEach((c, i) => c.classList.toggle("now", i === s));
          const n = Math.floor(s / 2) + 1; if (s % 2 === 0) { word.textContent = WORDS[n] || "·"; word.classList.toggle("rest", !WORDS[n]); } }
      }
      raf = requestAnimationFrame(draw);
    };
    const stop = () => { on = false; srcNode && srcNode.stop(); srcNode = null; cancelAnimationFrame(raf); last = -1;
      cells.forEach((c) => c.classList.remove("now")); word.textContent = ""; box.classList.remove("playing");
      btn.setAttribute("aria-pressed", false); btn.setAttribute("aria-label", T.play); };
    btn.addEventListener("click", async () => {
      if (on) return stop();
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") await ctx.resume();
      on = true; btn.setAttribute("aria-pressed", true); btn.setAttribute("aria-label", T.stop); box.classList.add("playing");
      try {
        if (!buf) { box.classList.add("loading"); const r = await fetch(SRC); buf = await ctx.decodeAudioData(await r.arrayBuffer()); box.classList.remove("loading"); }
      } catch (e) { box.classList.remove("loading"); stop(); return; }
      if (!on) return;
      srcNode = ctx.createBufferSource(); srcNode.buffer = buf; srcNode.loop = true; srcNode.connect(ctx.destination);
      t0 = ctx.currentTime + 0.06; srcNode.start(t0); draw();
    });
  }

  /* prenotazione: scegli servizio, giorno e ora */
  const bk = $("#booker");
  if (bk) {
    const state = { servizio: null, giorno: null, ora: null };
    const sum = $("#bkSum"), send = $("#bkSend"), daysEl = $("#bkDays"), hoursEl = $("#bkHours");
    const fmt = (d) => d.toLocaleDateString(LOC, { weekday: "long", day: "numeric", month: "long" });
    // disponibilità di esempio (sarà sostituita dal calendario di Mar)
    const ORE = ["10:00", "11:30", "17:00", "18:30", "20:00"];
    const busy = (d, h) => ((d.getDate() * 7 + h * 3) % 5) === 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today); d.setDate(d.getDate() + i);
      const b = document.createElement("button"); b.type = "button"; b.className = "day"; b.setAttribute("aria-pressed", "false");
      b.innerHTML = `<small>${d.toLocaleDateString(LOC, { weekday: "short" })}</small><b>${d.getDate()}</b><small>${d.toLocaleDateString(LOC, { month: "short" })}</small>`;
      if (d.getDay() === 0) b.disabled = true;
      b.addEventListener("click", () => { $$(".day", daysEl).forEach((x) => x.setAttribute("aria-pressed", x === b)); state.giorno = d; state.ora = null; renderHours(); update(); });
      daysEl.appendChild(b);
    }
    function renderHours() {
      hoursEl.innerHTML = "";
      if (!state.giorno) { hoursEl.innerHTML = `<p class="demo-note">${T.pickDay}</p>`; return; }
      ORE.forEach((h, i) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "opt"; b.textContent = h; b.setAttribute("aria-pressed", "false");
        if (busy(state.giorno, i)) { b.disabled = true; b.title = T.busy; }
        b.addEventListener("click", () => { $$(".opt", hoursEl).forEach((x) => x.setAttribute("aria-pressed", x === b)); state.ora = h; update(); });
        hoursEl.appendChild(b);
      });
    }
    $$("#bkServ .opt").forEach((b) => b.addEventListener("click", () => { $$("#bkServ .opt").forEach((x) => x.setAttribute("aria-pressed", x === b)); state.servizio = b.dataset.v; update(); }));
    function update() {
      const ok = state.servizio && state.giorno && state.ora;
      sum.innerHTML = ok ? `<b>${state.servizio}</b><br>${fmt(state.giorno)}, ${T.at} ${state.ora}` : T.pickAll;
      send.toggleAttribute("aria-disabled", !ok); send.style.opacity = ok ? 1 : 0.5;
    }
    send.addEventListener("click", (e) => {
      e.preventDefault(); if (!(state.servizio && state.giorno && state.ora)) return;
      const nome = ($("#bkName") || {}).value || ""; const note = ($("#bkNote") || {}).value || "";
      window.open(wa(`${T.req}\n• ${state.servizio}\n• ${fmt(state.giorno)}, ${T.at} ${state.ora}` + (nome ? `\n• ${T.name}: ${nome}` : "") + (note ? `\n• ${T.note}: ${note}` : "")), "_blank");
    });
    const pre = new URLSearchParams(location.search).get("s");
    if (pre) { const b = $(`#bkServ .opt[data-k="${pre}"]`); b && b.click(); }
    renderHours(); update();
  }

  /* vinile: gira con lo scroll */
  const vd = $("#vdisc"), va = $(".varm");
  if (vd && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let tk = false;
    const spin = () => { tk = false; const r = vd.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
      vd.style.transform = `rotate(${p * 720}deg)`; va && va.style.setProperty("--arm", `${p * 18}deg`);
      $$(".tracks li").forEach((li, i, a) => li.classList.toggle("on", p > 0.2 + i * 0.5 / a.length)); };
    addEventListener("scroll", () => { if (!tk) { tk = true; requestAnimationFrame(spin); } }, { passive: true }); spin();
  }

  /* assistente: primo contatto (regole semplici, poi passa a WhatsApp) */
  const bot = $("#bot"), fab = $("#botFab"), body = $("#botBody"), opts = $("#botOpts");
  if (bot) {
    const profile = {};
    const say = (t, who = "m") => { const d = document.createElement("div"); d.className = "msg " + who; d.textContent = t; body.appendChild(d); body.scrollTop = body.scrollHeight; };
    const typing = (cb) => { const d = document.createElement("div"); d.className = "msg m typing"; d.innerHTML = "<i></i><i></i><i></i>"; body.appendChild(d); body.scrollTop = body.scrollHeight; setTimeout(() => { d.remove(); cb(); }, 650); };
    const ask = (q, choices, key, then) => typing(() => { say(q); opts.innerHTML = ""; choices.forEach((c) => { const b = document.createElement("button"); b.textContent = c; b.onclick = () => { say(c, "u"); profile[key] = c; opts.innerHTML = ""; then(c); }; opts.appendChild(b); }); });
    const finish = () => typing(() => {
      say(T.end(profile.formato === "Online"));
      opts.innerHTML = "";
      const a = document.createElement("a"); a.className = "go"; a.textContent = T.go; a.target = "_blank"; a.rel = "noopener";
      a.href = wa(T.msg(profile));
      const p = document.createElement("a"); p.textContent = T.slot; p.href = T.prenota;
      opts.append(a, p);
    });
    const start = () => {
      body.innerHTML = ""; say(T.hi);
      ask(T.q1, T.a1, "stile", () => ask(T.q2, T.a2, "livello", () => ask(T.q3, T.a3, "formato", finish)));
    };
    let started = false;
    fab.addEventListener("click", () => { bot.hidden = !bot.hidden; if (!bot.hidden && !started) { started = true; start(); } });
    $("#botClose").addEventListener("click", () => (bot.hidden = true));
  }
})();
