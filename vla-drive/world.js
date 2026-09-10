const World = (() => {
  const W = 1100, H = 420;
  const PATHS = { straight: makePath(false,0), exit1: makePath(true,1), exit2: makePath(true,2) };
  function makePath(takeExit, which) {
    const pts = [];
    for (let i = 0; i <= 220; i++) {
      const t = i / 220;
      let y = 250 + Math.sin(t * Math.PI * 1.4) * 18;
      const x = 40 + t * 1020;
      if (takeExit && which === 1 && t > 0.38 && t < 0.78) y -= Math.sin(((t-0.38)/0.4)*Math.PI) * 118;
      if (takeExit && which === 2 && t > 0.58 && t < 0.96) y -= Math.sin(((t-0.58)/0.38)*Math.PI) * 128;
      pts.push({ x, y });
    }
    return pts;
  }
  function nearest(path, p) {
    let best = 0, d2 = Infinity;
    for (let i = 0; i < path.length; i++) {
      const dx = path[i].x - p.x, dy = path[i].y - p.y, v = dx*dx + dy*dy;
      if (v < d2) { d2 = v; best = i; }
    }
    return { i: best, pt: path[best], dist: Math.sqrt(d2) };
  }
  function headingAt(path, i) {
    const a = path[Math.max(0,i)], b = path[Math.min(path.length-1, i+4)];
    return Math.atan2(b.y-a.y, b.x-a.x);
  }
  function drawRoad(ctx) {
    ctx.fillStyle = "#07090e"; ctx.fillRect(0,0,W,H);
    const drawLane = (path, color, width) => {
      ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
      for (const p of path) ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.stroke();
    };
    drawLane(PATHS.straight, "#1a2330", 56);
    drawLane(PATHS.exit1, "#1a2330", 46);
    drawLane(PATHS.exit2, "#1a2330", 46);
    drawLane(PATHS.straight, "#2c3a4d", 4);
    ctx.setLineDash([10,14]); drawLane(PATHS.straight, "#c9d6e8", 2); ctx.setLineDash([]);
    ctx.fillStyle = "#8b97ab"; ctx.font = "11px IBM Plex Mono, monospace";
    ctx.fillText("EXIT 1", PATHS.exit1[92].x-18, PATHS.exit1[92].y-34);
    ctx.fillText("EXIT 2", PATHS.exit2[148].x-18, PATHS.exit2[148].y-34);
  }
  function drawCar(ctx, car) {
    ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.yaw);
    ctx.strokeStyle = "#d6c36a"; ctx.fillStyle = "rgba(214,195,106,0.12)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-22,-12,44,24,5); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10,-12); ctx.lineTo(22,0); ctx.lineTo(10,12); ctx.stroke();
    ctx.strokeStyle = "#6ee7f5"; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.moveTo(18,0);
    for (let a = -0.7; a <= 0.7; a += 0.08) {
      const r = 70 + Math.sin(car.t * 8 + a * 9) * 8;
      ctx.lineTo(18 + Math.cos(a)*r, Math.sin(a)*r);
    }
    ctx.stroke(); ctx.restore();
  }
  function cameraView(ctx, car, worldCanvas) {
    ctx.fillStyle = "#05070b"; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
    ctx.save(); ctx.translate(ctx.canvas.width/2, ctx.canvas.height*0.72); ctx.rotate(-car.yaw);
    ctx.translate(-car.x, -car.y); ctx.scale(1.15,1.15); ctx.drawImage(worldCanvas,0,0); ctx.restore();
    ctx.fillStyle = "rgba(110,231,245,0.08)"; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
  }
  return { W,H,PATHS,nearest,headingAt,drawRoad,drawCar,cameraView };
})();
