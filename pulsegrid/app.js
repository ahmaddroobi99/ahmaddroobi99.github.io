(() => {
  const STEPS = 16;
  const TRACKS = [
    { id: "kick", name: "KICK", sub: "808 BODY" },
    { id: "snare", name: "SNARE", sub: "SNAP" },
    { id: "hats", name: "HATS", sub: "CLOSED" },
    { id: "perc", name: "PERC", sub: "RIM / CLICK" },
  ];

  const defaultPattern = () => ({
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hats:  [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,1,1,0],
    perc:  [0,0,0,1, 0,0,0,0, 0,1,0,0, 0,0,1,0],
  });

  const state = {
    pattern: defaultPattern(),
    playing: false,
    step: 0,
    bpm: 120,
    swing: 0,
    nextNoteTime: 0,
    timerId: null,
    audio: null,
  };

  const tracksEl = document.getElementById("tracks");
  const numsEl = document.getElementById("stepNumbers");
  const playBtn = document.getElementById("playBtn");
  const playLabel = playBtn.querySelector(".play-label");
  const tempo = document.getElementById("tempo");
  const bpmVal = document.getElementById("bpmVal");
  const swing = document.getElementById("swing");
  const swingVal = document.getElementById("swingVal");
  const runLed = document.getElementById("runLed");
  const status = document.getElementById("status");

  function buildUI() {
    numsEl.innerHTML = `<span class="label">TRK</span>` +
      Array.from({ length: STEPS }, (_, i) =>
        `<span class="${i % 4 === 0 ? "beat" : ""}">${i + 1}</span>`
      ).join("");

    tracksEl.innerHTML = TRACKS.map((t) => {
      const pads = Array.from({ length: STEPS }, (_, i) => {
        const on = state.pattern[t.id][i] ? "on" : "";
        const beat = i % 4 === 0 ? "beat-mark" : "";
        return `<button type="button" class="pad ${t.id} ${on} ${beat}" data-track="${t.id}" data-step="${i}" aria-label="${t.name} step ${i + 1}"></button>`;
      }).join("");
      return `<div class="track ${t.id}">
        <div class="track-meta">
          <div class="track-name">${t.name}</div>
          <div class="track-sub">${t.sub}</div>
        </div>
        ${pads}
      </div>`;
    }).join("");
  }

  function syncPads() {
    document.querySelectorAll(".pad").forEach((pad) => {
      const tr = pad.dataset.track;
      const st = +pad.dataset.step;
      pad.classList.toggle("on", !!state.pattern[tr][st]);
    });
  }

  function highlight(step) {
    document.querySelectorAll(".pad.current").forEach((p) => p.classList.remove("current"));
    document.querySelectorAll(`.pad[data-step="${step}"]`).forEach((p) => p.classList.add("current"));
  }

  function ensureAudio() {
    if (state.audio) return state.audio;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
    state.audio = { ctx, master };
    return state.audio;
  }

  function envGain(ctx, dest, t, a, d, peak = 1) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    g.connect(dest);
    return g;
  }

  function playKick(t) {
    const { ctx, master } = ensureAudio();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);
    const g = envGain(ctx, master, t, 0.004, 0.28, 1);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + 0.32);

    const click = ctx.createOscillator();
    click.type = "square";
    click.frequency.value = 90;
    const cg = envGain(ctx, master, t, 0.001, 0.03, 0.18);
    click.connect(cg);
    click.start(t);
    click.stop(t + 0.04);
  }

  function playSnare(t) {
    const { ctx, master } = ensureAudio();
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = "highpass";
    bp.frequency.value = 1200;
    const ng = envGain(ctx, master, t, 0.002, 0.16, 0.55);
    noise.connect(bp);
    bp.connect(ng);
    noise.start(t);
    noise.stop(t + 0.2);

    const body = ctx.createOscillator();
    body.type = "triangle";
    body.frequency.setValueAtTime(190, t);
    body.frequency.exponentialRampToValueAtTime(120, t + 0.08);
    const bg = envGain(ctx, master, t, 0.002, 0.1, 0.35);
    body.connect(bg);
    body.start(t);
    body.stop(t + 0.14);
  }

  function playHats(t) {
    const { ctx, master } = ensureAudio();
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    const g = envGain(ctx, master, t, 0.001, 0.045, 0.28);
    noise.connect(hp);
    hp.connect(g);
    noise.start(t);
    noise.stop(t + 0.07);
  }

  function playPerc(t) {
    const { ctx, master } = ensureAudio();
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(820, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.06);
    const g = envGain(ctx, master, t, 0.001, 0.08, 0.22);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1400;
    osc.connect(bp);
    bp.connect(g);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  const voices = { kick: playKick, snare: playSnare, hats: playHats, perc: playPerc };

  function secondsPerStep() {
    return 60 / state.bpm / 4;
  }

  function schedule() {
    const { ctx } = ensureAudio();
    const lookahead = 0.12;
    const stepDur = secondsPerStep();

    while (state.nextNoteTime < ctx.currentTime + lookahead) {
      const swingAmt = (state.swing / 100) * stepDur * 0.5;
      const when = state.nextNoteTime + (state.step % 2 === 1 ? swingAmt : 0);
      const step = state.step;

      TRACKS.forEach((tr) => {
        if (state.pattern[tr.id][step]) voices[tr.id](when);
      });

      const delay = Math.max(0, (when - ctx.currentTime) * 1000);
      setTimeout(() => highlight(step), delay);

      state.nextNoteTime += stepDur;
      state.step = (state.step + 1) % STEPS;
    }
  }

  function start() {
    const audio = ensureAudio();
    if (audio.ctx.state === "suspended") audio.ctx.resume();
    state.playing = true;
    state.step = 0;
    state.nextNoteTime = audio.ctx.currentTime + 0.05;
    schedule();
    state.timerId = setInterval(schedule, 25);
    playBtn.classList.add("playing");
    playLabel.textContent = "STOP";
    runLed.classList.add("on");
    status.textContent = `PLAYING · ${state.bpm} BPM · SWING ${state.swing}%`;
  }

  function stop() {
    state.playing = false;
    clearInterval(state.timerId);
    state.timerId = null;
    playBtn.classList.remove("playing");
    playLabel.textContent = "PLAY";
    runLed.classList.remove("on");
    document.querySelectorAll(".pad.current").forEach((p) => p.classList.remove("current"));
    status.textContent = `STOPPED · 4/4 · 16 STEPS`;
  }

  function togglePlay() {
    state.playing ? stop() : start();
  }

  tracksEl.addEventListener("click", (e) => {
    const pad = e.target.closest(".pad");
    if (!pad) return;
    const tr = pad.dataset.track;
    const st = +pad.dataset.step;
    state.pattern[tr][st] = state.pattern[tr][st] ? 0 : 1;
    pad.classList.toggle("on", !!state.pattern[tr][st]);
    if (!state.playing) {
      ensureAudio();
      if (state.audio.ctx.state === "suspended") state.audio.ctx.resume();
      voices[tr](state.audio.ctx.currentTime);
    }
  });

  playBtn.addEventListener("click", togglePlay);
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.target.tagName !== "INPUT") {
      e.preventDefault();
      togglePlay();
    }
  });

  tempo.addEventListener("input", () => {
    state.bpm = +tempo.value;
    bpmVal.textContent = state.bpm;
    if (state.playing) status.textContent = `PLAYING · ${state.bpm} BPM · SWING ${state.swing}%`;
  });
  document.getElementById("tempoDown").addEventListener("click", () => {
    tempo.value = Math.max(60, +tempo.value - 1);
    tempo.dispatchEvent(new Event("input"));
  });
  document.getElementById("tempoUp").addEventListener("click", () => {
    tempo.value = Math.min(180, +tempo.value + 1);
    tempo.dispatchEvent(new Event("input"));
  });

  swing.addEventListener("input", () => {
    state.swing = +swing.value;
    swingVal.textContent = state.swing + "%";
    if (state.playing) status.textContent = `PLAYING · ${state.bpm} BPM · SWING ${state.swing}%`;
  });

  document.getElementById("clearBtn").addEventListener("click", () => {
    TRACKS.forEach((t) => { state.pattern[t.id] = Array(STEPS).fill(0); });
    syncPads();
  });

  document.getElementById("randomBtn").addEventListener("click", () => {
    const density = { kick: 0.28, snare: 0.22, hats: 0.55, perc: 0.2 };
    TRACKS.forEach((t) => {
      state.pattern[t.id] = Array.from({ length: STEPS }, (_, i) => {
        if (t.id === "kick" && i % 4 === 0) return Math.random() < 0.85 ? 1 : 0;
        if (t.id === "snare" && (i === 4 || i === 12)) return Math.random() < 0.8 ? 1 : 0;
        return Math.random() < density[t.id] ? 1 : 0;
      });
    });
    syncPads();
  });

  buildUI();
})();
