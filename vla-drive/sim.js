(() => {
  const world = document.getElementById("world");
  const cam = document.getElementById("cam");
  const wctx = world.getContext("2d");
  const cctx = cam.getContext("2d");
  const car = {}; Policy.reset(car);
  let task = Policy.TASKS[0], running = true, last = performance.now();
  let act = Policy.step(car, task, false);
  const patchesEl = document.getElementById("patches");
  for (let i=0;i<9;i++) { const d=document.createElement("div"); d.className="patch"; patchesEl.appendChild(d); }
  const tokensEl = document.getElementById("tokens");
  for (let i=0;i<16;i++) { const d=document.createElement("div"); d.className="dot"; tokensEl.appendChild(d); }
  const chipsEl = document.getElementById("chips");
  Policy.TASKS.forEach((t) => {
    const b = document.createElement("button");
    b.className = "chip" + (t===task?" active":"");
    b.textContent = t.id;
    b.onclick = () => {
      task = t;
      document.getElementById("instText").textContent = t.text;
      [...chipsEl.children].forEach((c)=>c.classList.toggle("active", c.textContent===t.id));
    };
    chipsEl.appendChild(b);
  });
  document.getElementById("btnPlay").onclick = () => { running=!running; document.getElementById("btnPlay").textContent = running?"Pause":"Play"; };
  document.getElementById("btnReset").onclick = () => Policy.reset(car);
  const keys = new Set();
  window.addEventListener("keydown", (e) => { keys.add(e.key.toLowerCase()); if (e.key.toLowerCase()==="r") Policy.reset(car); });
  window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
  function applyKeys() {
    if (!document.getElementById("manual").checked) return;
    car.manualSteer=0; car.manualThr=0.05; car.manualBrk=0;
    if (keys.has("a")) car.manualSteer=-18;
    if (keys.has("d")) car.manualSteer=18;
    if (keys.has("w")) car.manualThr=0.7;
    if (keys.has("s")) car.manualBrk=0.7;
  }
  function paintUI() {
    document.getElementById("steerTxt").textContent = (act.steerDeg>=0?"+":"")+act.steerDeg.toFixed(1)+"\u00b0";
    document.getElementById("thrTxt").textContent = act.throttle.toFixed(2);
    document.getElementById("brkTxt").textContent = act.brake.toFixed(2);
    document.getElementById("steerBar").style.width = (50+act.steerDeg*1.4)+"%";
    document.getElementById("thrBar").style.width = (act.throttle*100)+"%";
    document.getElementById("brkBar").style.width = (act.brake*100)+"%";
    document.getElementById("confBar").style.width = (act.conf*100)+"%";
    document.getElementById("confLabel").textContent = "confidence "+act.conf.toFixed(2);
    document.getElementById("speedHud").textContent = "v = "+(car.v*3.6).toFixed(1)+" km/h";
    document.getElementById("steerHud").textContent = "steer "+(act.steerDeg>=0?"+":"")+act.steerDeg.toFixed(1)+"\u00b0";
    document.getElementById("modeHud").textContent = document.getElementById("manual").checked?"MANUAL":"AUTO";
    document.getElementById("patchLabel").textContent = "patch "+((act.patch%9)+1)+"/9";
    [...patchesEl.children].forEach((el,i)=>el.classList.toggle("on", i===act.patch%9));
    [...tokensEl.children].forEach((el,i)=>el.classList.toggle("live", i<6+Math.floor(act.conf*10)));
  }
  function frame(now) {
    const dt = Math.min(0.033, (now-last)/1000); last = now; applyKeys();
    if (running) { act = Policy.step(car, task, document.getElementById("manual").checked); Policy.integrate(car, act, dt); }
    World.drawRoad(wctx); World.drawCar(wctx, car); World.cameraView(cctx, car, world); paintUI();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
