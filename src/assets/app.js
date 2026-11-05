(() => {
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

  /* passo base: brano in loop, il conteggio 1-8 si illumina a tempo */
  const cl = $("#clave");
  if (cl && cl.dataset.src) {
    const btn = $("#clavePlay"), items = $$("#counts li");
    const Q = 60 / Number(cl.dataset.bpm), A = Number(cl.dataset.a), B = Number(cl.dataset.b);
    const SRC = new URL(cl.dataset.src.replace(/^\//, ""), document.baseURI).href;
    let ctx, buf, node, t0 = 0, raf = 0, on = false, last = -1;
    const draw = () => {
      const e = ctx.currentTime - t0 - (ctx.outputLatency || ctx.baseLatency || 0);
      if (e >= 0) { const n = Math.floor((e % (8 * Q)) / Q); if (n !== last) { last = n; items.forEach((li, i) => li.classList.toggle("now", i === n)); } }
      raf = requestAnimationFrame(draw);
    };
    const stop = () => { on = false; node && node.stop(); node = null; cancelAnimationFrame(raf); last = -1;
      items.forEach((li) => li.classList.remove("now")); cl.classList.remove("playing"); btn.setAttribute("aria-pressed", false); };
    btn.addEventListener("click", async () => {
      if (on) return stop();
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") await ctx.resume();
      on = true; cl.classList.add("playing"); btn.setAttribute("aria-pressed", true);
      try { if (!buf) { cl.classList.add("loading"); buf = await ctx.decodeAudioData(await (await fetch(SRC)).arrayBuffer()); } }
      catch (err) { cl.classList.remove("loading"); return stop(); }
      cl.classList.remove("loading"); if (!on) return;
      node = ctx.createBufferSource(); node.buffer = buf; node.loop = true; node.loopStart = A; node.loopEnd = B;
      node.connect(ctx.destination); t0 = ctx.currentTime + 0.05; node.start(t0, A); draw();
    });
  }

  /* il bottone WhatsApp fisso si nasconde mentre la prenotazione è sullo schermo */
  const fabWa = $(".wa-fab"), bookSec = $("#prenota");
  if (fabWa && bookSec && "IntersectionObserver" in window)
    new IntersectionObserver(([e]) => fabWa.classList.toggle("away", e.isIntersecting), { threshold: 0.25 }).observe(bookSec);

  /* prenotazione: stile, lezione, giorno e ora → messaggio WhatsApp già scritto */
  const bk = $("#booker");
  if (bk) {
    const state = { stile: null, servizio: null, giorno: null, ora: null };
    const sum = $("#bkSum"), send = $("#bkSend"), daysEl = $("#bkDays"), hoursEl = $("#bkHours");
    const fmt = (d) => d.toLocaleDateString(LOC, { weekday: "long", day: "numeric", month: "long" });
    // disponibilità di esempio (sarà sostituita dal calendario di Mar)
    const ORE = ["10:00", "11:30", "17:00", "18:30", "20:00"];
    const busy = (d, h) => ((d.getDate() * 7 + h * 3) % 5) === 0;
    const pick = (box, sel, b) => $$(sel, box).forEach((x) => x.setAttribute("aria-pressed", x === b));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today); d.setDate(d.getDate() + i);
      const b = document.createElement("button"); b.type = "button"; b.className = "day"; b.setAttribute("aria-pressed", "false");
      b.innerHTML = `<small>${d.toLocaleDateString(LOC, { weekday: "short" })}</small><b>${d.getDate()}</b><small>${d.toLocaleDateString(LOC, { month: "short" })}</small>`;
      if (d.getDay() === 0) b.disabled = true;
      b.addEventListener("click", () => { pick(daysEl, ".day", b); state.giorno = d; state.ora = null; renderHours(); update(); });
      daysEl.appendChild(b);
    }
    function renderHours() {
      hoursEl.innerHTML = "";
      if (!state.giorno) { hoursEl.innerHTML = `<p class="bk-empty">${T.pickDay}</p>`; return; }
      ORE.forEach((h, i) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "opt"; b.textContent = h; b.setAttribute("aria-pressed", "false");
        if (busy(state.giorno, i)) { b.disabled = true; b.title = T.busy; }
        b.addEventListener("click", () => { pick(hoursEl, ".opt", b); state.ora = h; update(); });
        hoursEl.appendChild(b);
      });
    }
    $$("#bkStyle .opt").forEach((b) => b.addEventListener("click", () => { pick($("#bkStyle"), ".opt", b); state.stile = b.dataset.v; update(); }));
    $$("#bkServ .opt").forEach((b) => b.addEventListener("click", () => { pick($("#bkServ"), ".opt", b); state.servizio = b.dataset.v; update(); }));
    const ok = () => state.stile && state.servizio && state.giorno && state.ora;
    const set = (id, v) => { const el = $(id); el.textContent = v || "—"; el.classList.toggle("set", !!v); };
    function update() {
      set("#rcStyle", state.stile); set("#rcServ", state.servizio);
      set("#rcDay", state.giorno && fmt(state.giorno)); set("#rcHour", state.ora);
      sum.classList.remove("warn"); sum.textContent = ok() ? "Tutto pronto: aggiungi il tuo nome e invia." : "Scegli stile, lezione, giorno e ora.";
      send.toggleAttribute("aria-disabled", !ok());
    }
    send.addEventListener("click", (e) => {
      e.preventDefault();
      if (!ok()) {
        const miss = !state.stile ? "#bkStyle" : !state.servizio ? "#bkServ" : !state.giorno ? "#bkDays" : "#bkHours", st = $(miss).closest(".bstep");
        st.classList.remove("missing"); void st.offsetWidth; st.classList.add("missing"); st.scrollIntoView({ behavior: "smooth", block: "center" });
        sum.classList.add("warn"); return;
      }
      const nome = $("#bkName").value.trim(), note = $("#bkNote").value.trim();
      window.open(wa(`${T.req}\n• Stile: ${state.stile}\n• ${state.servizio}\n• ${fmt(state.giorno)}, ${T.at} ${state.ora}` + (nome ? `\n• ${T.name}: ${nome}` : "") + (note ? `\n• ${T.note}: ${note}` : "")), "_blank");
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
