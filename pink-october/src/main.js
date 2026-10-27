// Starbucks × Pink October — motion piece.
// Every frame is a pure function of t: GSAP timeline seek + procedural state.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { T, BEAT, BAR, DURATION, HUGS } from './timing.js';

gsap.registerPlugin(SplitText, CustomEase);
gsap.ticker.lagSmoothing(0);
gsap.ticker.sleep();

const W = 1080, H = 1920, FPS = 30;
const q = new URLSearchParams(location.search);
const SCALE = parseFloat(q.get('scale') || '1');
const wrap = document.getElementById('wrap');
wrap.style.transform = `scale(${SCALE})`;
document.body.style.width = `${W * SCALE}px`;
document.body.style.height = `${H * SCALE}px`;
const stage = document.getElementById('stage');
const A = '../assets/';

// ---------- utils ----------
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const imgCache = new Map();
function loadImg(src) {
  if (imgCache.has(src)) return imgCache.get(src);
  const p = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(src)); i.src = src; });
  imgCache.set(src, p);
  if (imgCache.size > 400) imgCache.delete(imgCache.keys().next().value);
  return p;
}
const frameSrc = (clip, i) => `../cache/frames/${clip}/${String(i).padStart(5, '0')}.jpg`;
const FRAMES = { talk: 360, banner: 541, cake: 97 };

// ---------- renderer ----------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(Math.round(W * SCALE), Math.round(H * SCALE), false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.autoClear = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, W / H, 0.05, 100);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// background: fullscreen gradient + drifting pink light blobs
const bgUniforms = {
  uTime: { value: 0 },
  uTop: { value: new THREE.Vector3() }, uBot: { value: new THREE.Vector3() },
  uBlob: { value: new THREE.Vector3() }, uBlobAmt: { value: 1 },
};
const bgScene = new THREE.Scene();
const bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: bgUniforms, depthWrite: false,
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
  fragmentShader: `
    uniform float uTime; uniform vec3 uTop, uBot, uBlob; uniform float uBlobAmt; varying vec2 vUv;
    void main(){
      vec3 c = mix(uBot, uTop, smoothstep(0., 1., vUv.y));
      vec2 p = vUv * vec2(.5625, 1.);
      float b1 = exp(-5.5 * distance(p, vec2(.12 + .07 * sin(uTime * .31), .78 + .05 * cos(uTime * .23))));
      float b2 = exp(-4.5 * distance(p, vec2(.46 + .06 * cos(uTime * .27), .30 + .06 * sin(uTime * .35))));
      float b3 = exp(-7.0 * distance(p, vec2(.30 + .05 * sin(uTime * .40), .52 + .04 * cos(uTime * .5))));
      c += uBlob * uBlobAmt * (.85 * b1 + .75 * b2 + .45 * b3);
      gl_FragColor = vec4(c, 1.);
    }`,
})));
const hex3 = (h) => ({ r: ((h >> 16) & 255) / 255, g: ((h >> 8) & 255) / 255, b: (h & 255) / 255 });
const bg = { top: hex3(0x3a0c27), bot: hex3(0x10030a), blob: hex3(0x8a1650), amt: 0.7 };

// lights
const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-2.5, 3, 5); scene.add(key);
const fill = new THREE.DirectionalLight(0xffc4dc, 0.7); fill.position.set(3, -1, 4); scene.add(fill);
const rimL = new THREE.PointLight(0xff3d8f, 18, 8, 1.6); rimL.position.set(-2.4, 1.4, -1.2); scene.add(rimL);
const rimR = new THREE.PointLight(0xff6fb0, 14, 8, 1.6); rimR.position.set(2.4, -0.8, -1.0); scene.add(rimR);
const lightS = { sweep: -6 };

// ---------- textures ----------
function radialTex(stops, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glowTex = radialTex([[0, 'rgba(255,140,190,1)'], [0.25, 'rgba(255,80,150,.55)'], [0.6, 'rgba(255,40,120,.12)'], [1, 'rgba(255,0,100,0)']]);
const softTex = radialTex([[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,220,235,.45)'], [1, 'rgba(255,200,225,0)']]);
const shadowTex = (() => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  g.filter = 'blur(18px)'; g.fillStyle = 'rgba(25,0,12,.85)'; g.fillRect(40, 40, 176, 176);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const heartTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  g.translate(256, 270); g.scale(9, 9);
  g.beginPath(); g.moveTo(0, 8); g.bezierCurveTo(-16, -2, -12, -18, 0, -9); g.bezierCurveTo(12, -18, 16, -2, 0, 8); g.closePath();
  g.shadowColor = 'rgba(255,60,140,1)'; g.shadowBlur = 40; g.lineWidth = 1.4; g.strokeStyle = 'rgba(255,190,220,1)'; g.stroke(); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
function sprite(tex, color = 0xffffff, additive = true) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false }));
  s.material.opacity = 0; return s;
}

// ---------- materials ----------
const pearl = new THREE.MeshPhysicalMaterial({ color: 0xfffbfd, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 1, sheenColor: new THREE.Color(0xff8fc0), sheenRoughness: 0.35, envMapIntensity: 0.9, transparent: true });
const green = new THREE.MeshPhysicalMaterial({ color: 0x003d27, roughness: 0.45, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 0.3, transparent: true });
const coinMat = new THREE.MeshPhysicalMaterial({ color: 0x003d27, roughness: 0.45, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 0.3, transparent: true });
const satin = new THREE.MeshPhysicalMaterial({ color: 0xff2a82, emissive: 0x5c0029, roughness: 0.34, metalness: 0.05, sheen: 1, sheenColor: new THREE.Color(0xffb8d6), sheenRoughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.3, side: THREE.DoubleSide, transparent: true });

// ---------- logo / siren ----------
const logo = new THREE.Group(); scene.add(logo);
const siren = new THREE.Group(); logo.add(siren);
const coin = new THREE.Mesh(new THREE.LatheGeometry([
  new THREE.Vector2(0, -0.075), new THREE.Vector2(0.982, -0.075), new THREE.Vector2(1.0, -0.06), new THREE.Vector2(1.006, -0.0375),
  new THREE.Vector2(1.0, -0.015), new THREE.Vector2(0.982, 0), new THREE.Vector2(0, 0)], 160), coinMat);
coin.rotation.x = Math.PI / 2; coin.scale.y = -1; // axis along z, face at z=0 toward camera
logo.add(coin);
const ring = new THREE.Mesh(new THREE.TorusGeometry(1.04, 0.012, 12, 220), new THREE.MeshBasicMaterial({ color: 0xff7ab5, transparent: true, opacity: 0, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }));
logo.add(ring);
const halo = sprite(glowTex, 0xffffff); halo.scale.setScalar(3.4); halo.position.z = -0.3; logo.add(halo);

const arms = { L: [], R: [] };
async function buildSiren() {
  const data = await (await fetch('./siren.json')).json();
  const toShape = (s) => {
    const sh = new THREE.Shape(s.outer.map(([x, y]) => new THREE.Vector2(x, y)));
    for (const h of s.holes) sh.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
    return sh;
  };
  const whiteOpt = { depth: 0.032, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.0055, bevelSegments: 3, curveSegments: 4 };
  const backOpt = { depth: 0.03, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.002, bevelSegments: 1, curveSegments: 4 };
  const partMesh = (p, offX, mirror = false) => {
    const g = new THREE.Group();
    if (p.back.length) {
      const geo = new THREE.ExtrudeGeometry(p.back.map(toShape), backOpt); geo.translate(-offX, 0, 0.004);
      g.add(new THREE.Mesh(geo, green));
    }
    const geo = new THREE.ExtrudeGeometry(p.white.map(toShape), whiteOpt); geo.translate(-offX, 0, 0.046);
    g.add(new THREE.Mesh(geo, pearl));
    if (mirror) { // tails show their pearl side when they fold past 90°
      const m = new THREE.Mesh(geo, pearl); m.scale.z = -1; m.position.z = 0.03; g.add(m);
    }
    return g;
  };
  siren.add(partMesh(data.parts.center, 0));
  for (const side of ['L', 'R']) {
    let parent = siren, prevH = 0;
    for (let i = 1; i <= 3; i++) {
      const p = data.parts[side + i];
      const pivot = new THREE.Group(); pivot.position.x = p.hinge - prevH;
      pivot.add(partMesh(p, p.hinge, true));
      parent.add(pivot); arms[side].push(pivot);
      parent = pivot; prevH = p.hinge;
    }
  }
}
const logoS = { x: 0, y: 0, z: -16, rx: 0, ry: 0, rz: 0, s: 1 };
const sirenS = { z: 0, y: 0, rx: 0, ry: 0, s: 1, curl: 0, open: 0, idle: 0 };
const coinS = { opacity: 1, z: 0, s: 1, dark: 0 };
const ringS = { opacity: 0, s: 1 };
const haloS = { opacity: 0, s: 3.4 };

// ---------- awareness ribbon ----------
const ribbonPts = [[0.56, -1.26, 0.02], [0.32, -0.78, 0.05], [0.0, -0.2, 0.09], [-0.3, 0.33, 0.03], [-0.39, 0.74, -0.05], [-0.23, 1.04, -0.11], [0, 1.12, -0.13],
  [0.23, 1.04, -0.11], [0.39, 0.74, -0.05], [0.3, 0.33, 0.0], [0.0, -0.2, -0.07], [-0.32, -0.78, -0.03], [-0.56, -1.26, 0.0]];
const ribbonCurve = new THREE.CatmullRomCurve3(ribbonPts.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
function ribbonGeometry(width = 0.25, N = 420) {
  const pos = [], idx = [], Z = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i <= N; i++) {
    const u = i / N, p = ribbonCurve.getPointAt(u), tg = ribbonCurve.getTangentAt(u);
    const side = new THREE.Vector3().crossVectors(tg, Z).normalize();
    // fold the band slightly around its spine so the satin catches light
    const twist = 0.35 * Math.sin(u * Math.PI * 2.0);
    const n = side.clone().applyAxisAngle(tg, twist);
    // V-notch the two tail ends
    const notch = (e) => Math.max(0, 1 - e / 0.035) * 0.09;
    const cut = notch(u * ribbonCurve.getLength()) + notch((1 - u) * ribbonCurve.getLength());
    const a = p.clone().addScaledVector(n, width / 2), b = p.clone().addScaledVector(n, -width / 2);
    a.addScaledVector(tg, u < 0.5 ? cut : -cut); b.addScaledVector(tg, u < 0.5 ? cut : -cut);
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  g.userData.N = N; return g;
}
const ribbon = new THREE.Mesh(ribbonGeometry(), satin); scene.add(ribbon);
const ribbonS = { draw: 0, x: 0, y: -0.1, z: 0, rx: 0, ry: -0.5, rz: 0, s: 0.85, opacity: 1 };
const sparkHead = sprite(softTex, 0xffd6e8); sparkHead.scale.setScalar(0.5); scene.add(sparkHead);

// ---------- photo / video cards ----------
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function drawCover(g, img, x, y, w, h, fx = 0.5, fy = 0.5) {
  const s = Math.max(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s;
  g.drawImage(img, x + (w - iw) * fx, y + (h - ih) * fy, iw, ih);
}
const cards = [];
class Card {
  constructor({ w, h, px = 760, focus = [0.5, 0.5], scrim = 0, border = 0.024, radius = 0.06 }) {
    Object.assign(this, { w, h, focus, scrim, border, radius });
    this.cv = document.createElement('canvas');
    this.cv.width = Math.round(px * Math.max(SCALE, 0.4)); this.cv.height = Math.round(this.cv.width * h / w);
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: true });
    this.group = new THREE.Group();
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.mat);
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.5, h * 1.42), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.6 }));
    this.shadow.position.set(0.02, -0.05, -0.012);
    this.group.add(this.shadow, this.mesh);
    this.group.visible = false; scene.add(this.group);
    this.s = { x: 0, y: -4, z: 0, rx: 0, ry: 0, rz: 0, s: 1, o: 0, orbit: 0, slot: 0, ribbon: 0 };
    cards.push(this);
  }
  paint(img) {
    const g = this.cv.getContext('2d'), cw = this.cv.width, ch = this.cv.height;
    const b = Math.round(cw * this.border), r = cw * this.radius;
    g.clearRect(0, 0, cw, ch);
    roundRect(g, 0, 0, cw, ch, r); g.fillStyle = '#fff6fa'; g.fill();
    g.save(); roundRect(g, b, b, cw - 2 * b, ch - 2 * b, r - b * 0.7); g.clip();
    drawCover(g, img, b, b, cw - 2 * b, ch - 2 * b, ...this.focus);
    if (this.scrim) {
      const gr = g.createLinearGradient(0, ch * 0.45, 0, ch);
      gr.addColorStop(0, 'rgba(40,0,20,0)'); gr.addColorStop(1, `rgba(40,0,20,${this.scrim})`);
      g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
    }
    const sh = g.createLinearGradient(0, 0, cw, ch); // glossy sheen
    sh.addColorStop(0, 'rgba(255,255,255,.16)'); sh.addColorStop(0.35, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,160,200,.08)');
    g.fillStyle = sh; g.fillRect(0, 0, cw, ch);
    g.restore();
    this.tex.needsUpdate = true;
  }
  apply() {
    const s = this.s, gr = this.group;
    gr.visible = s.o > 0.002;
    if (!gr.visible) return;
    let x = s.x, y = s.y, z = s.z, sc = s.s, rz = s.rz, ry = s.ry, rx = s.rx;
    if (s.orbit > 0) {
      const o = orbitPos(s.slot);
      x = lerp(x, o.x, s.orbit); y = lerp(y, o.y, s.orbit); z = lerp(z, o.z, s.orbit);
      sc = lerp(sc, o.s, s.orbit); ry = lerp(ry, o.ry, s.orbit); rz = lerp(rz, o.rz, s.orbit); rx = lerp(rx, 0, s.orbit);
    }
    gr.position.set(x, y, z); gr.rotation.set(rx, ry, rz); gr.scale.setScalar(sc);
    this.mat.opacity = s.o; this.shadow.material.opacity = 0.6 * s.o;
  }
}
let clock = 0;
const ORBIT = { r: 1.9, depth: 0.7, y: 0.1, tilt: 0.25, speed: 0.42, n: 8, zc: -1.4, s: 0.6 };
function orbitPos(slot) {
  const a = slot * (Math.PI * 2 / ORBIT.n) + clock * ORBIT.speed;
  return { x: ORBIT.r * Math.sin(a), y: ORBIT.y - ORBIT.tilt * Math.cos(a), z: ORBIT.zc + ORBIT.depth * Math.cos(a), s: ORBIT.s, ry: -0.5 * Math.sin(a), rz: 0.05 * Math.sin(a * 2) };
}

const videoCards = []; // {card, clip, t0, t1, from, speed}
function videoCard(opts, clip, t0, t1, from = 0, speed = 1) {
  const c = new Card(opts); videoCards.push({ card: c, clip, t0, t1, from, speed }); return c;
}

// ---------- particles ----------
function particles(n, spread, size, seed, colors) {
  const r = rng(seed), pos = [], sd = [], col = [];
  for (let i = 0; i < n; i++) {
    pos.push((r() - 0.5) * spread[0], (r() - 0.5) * spread[1], (r() - 0.5) * spread[2] + spread[3]);
    sd.push(r(), r(), r(), r());
    const c = new THREE.Color(colors[Math.floor(r() * colors.length)]); col.push(c.r, c.g, c.b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('seed', new THREE.Float32BufferAttribute(sd, 4));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSize: { value: size }, uPx: { value: H * SCALE }, uOpacity: { value: 1 }, uH: { value: spread[1] } },
    vertexShader: `attribute vec4 seed; attribute vec3 color; uniform float uTime, uSize, uPx, uH; varying float vA; varying vec3 vC;
      void main(){ vec3 p = position; float sp = .05 + seed.x * .14;
        p.y = mod(p.y + uTime * sp + uH * .5, uH) - uH * .5;
        p.x += sin(uTime * .45 + seed.y * 6.283) * .18; p.z += cos(uTime * .3 + seed.x * 6.283) * .1;
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (.35 + seed.z * 1.3) * uPx / (-mv.z);
        vA = (.25 + .75 * seed.w) * (.55 + .45 * sin(uTime * 1.6 + seed.y * 20.)); vC = color; }`,
    fragmentShader: `uniform float uOpacity; varying float vA; varying vec3 vC;
      void main(){ float r = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., r); gl_FragColor = vec4(vC, a * a * vA * uOpacity); }`,
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p); return p;
}
const dust = particles(260, [7, 9, 5, -0.5], 0.035, 7, [0xffc2dc, 0xff7ab5, 0xffffff, 0xffe0ec]);
const bokeh = particles(26, [9, 12, 3, -5], 0.75, 11, [0xff4f9a, 0xff8fc0, 0xb0124f]);
const partS = { opacity: 0.9, bokeh: 0.5 };

// sparkle bursts (deterministic, age-driven)
const bursts = [];
function burst(t0, at, color = 0xffd0e6, n = 70, power = 1) {
  const r = rng(Math.round(t0 * 1000)), pos = [], dir = [];
  for (let i = 0; i < n; i++) {
    pos.push(...at);
    const th = r() * Math.PI * 2, ph = (r() - 0.5) * 1.2, sp = (0.6 + r() * 1.4) * power;
    dir.push(Math.cos(th) * Math.cos(ph) * sp, Math.sin(th) * Math.cos(ph) * sp, Math.sin(ph) * sp * 0.6 + 0.2, r());
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('dir', new THREE.Float32BufferAttribute(dir, 4));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uAge: { value: -1 }, uPx: { value: H * SCALE }, uCol: { value: new THREE.Color(color) } },
    vertexShader: `attribute vec4 dir; uniform float uAge, uPx; varying float vA;
      void main(){ float a = max(uAge, 0.); vec3 p = position + dir.xyz * (1. - exp(-a * 3.2)) * .55 + vec3(0., -.18 * a * a, 0.);
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
        gl_PointSize = (.02 + .03 * dir.w) * uPx / (-mv.z);
        vA = uAge < 0. ? 0. : (1. - smoothstep(.2, 1.3, a)) * (.6 + .4 * sin(a * 30. + dir.w * 40.)); }`,
    fragmentShader: `uniform vec3 uCol; varying float vA; void main(){ float r = length(gl_PointCoord - .5); float a = smoothstep(.5, .0, r); gl_FragColor = vec4(uCol, a * a * vA); }`,
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p);
  bursts.push({ t0, p });
}

// ---------- DOM text ----------
function txt(html, cls, top, extra = {}) {
  const el = document.createElement('div');
  el.className = 't ' + cls; el.innerHTML = html; el.style.top = top + 'px';
  Object.assign(el.style, extra); stage.appendChild(el); return el;
}
const split = (el, type = 'words') => {
  const sp = SplitText.create(el, { type, wordsClass: 'w', charsClass: 'c' });
  if (el.classList.contains('grad')) (type.includes('chars') ? sp.chars : sp.words).forEach((e) => e.classList.add('leaf'));
  return sp;
};
function inWords(tl, el, t, { stagger = 0.075, dur = 0.6, y = 46 } = {}) {
  const parts = split(el).words;
  tl.fromTo(parts, { opacity: 0, y, filter: 'blur(18px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: dur, ease: 'power3.out', stagger }, t);
  return parts;
}
function inChars(tl, el, t, { stagger = 0.035, dur = 0.55 } = {}) {
  el.style.perspective = '900px';
  const parts = split(el, 'chars,words').chars;
  tl.fromTo(parts, { opacity: 0, yPercent: 70, rotationX: -95, scale: 0.9, filter: 'blur(8px)' },
    { opacity: 1, yPercent: 0, rotationX: 0, scale: 1, filter: 'blur(0px)', duration: dur, ease: 'back.out(1.6)', stagger, transformOrigin: '50% 100% -40px' }, t);
  return parts;
}
function punch(tl, el, t) {
  tl.fromTo(el, { opacity: 0, scale: 1.45, filter: 'blur(22px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out' }, t);
}
function outUp(tl, el, t, dur = 0.38) {
  tl.to(el, { opacity: 0, y: -36, filter: 'blur(14px)', duration: dur, ease: 'power2.in' }, t);
}

// ---------- timeline ----------
const tl = gsap.timeline({ paused: true });
const camS = { x: 0, y: 0, z: 6.6, lx: 0, ly: 0.19, lz: 0, yaw: 0, roll: 0, shake: 0 };
const fx = { flash: 0, fade: 0 };
const flashEl = document.getElementById('flash'), fadeEl = document.getElementById('fade');
const pin = { draw: 0 };

let photos = {};
async function loadPhotos() {
  const names = ['group_a', 'group_b', 'group_c', 'trio', 'cake_board', 'cakepops_a', 'cake_hd_a', 'cake_hd_b'];
  for (const n of names) photos[n] = await loadImg(`${A}images/${n}.jpg`);
}

function setColor(o, h) { const c = hex3(h); return { r: c.r, g: c.g, b: c.b }; }
function bgTo(t, top, bot, blob, amt, dur = 0.8) {
  tl.to(bg.top, { ...setColor(bg.top, top), duration: dur, ease: 'sine.inOut' }, t);
  tl.to(bg.bot, { ...setColor(bg.bot, bot), duration: dur, ease: 'sine.inOut' }, t);
  tl.to(bg.blob, { ...setColor(bg.blob, blob), duration: dur, ease: 'sine.inOut' }, t);
  tl.to(bg, { amt, duration: dur, ease: 'sine.inOut' }, t);
}

function buildTimeline() {
  // ===== S1 · Hook: a pink ribbon writes itself, "the world turns PINK" =====
  tl.to(ribbonS, { draw: 1, duration: 1.9, ease: 'power2.inOut' }, 0.1);
  tl.fromTo(ribbonS, { ry: -0.55 }, { ry: 0.3, duration: 3.2, ease: 'sine.inOut' }, 0);
  tl.fromTo(ribbonS, { s: 0.78 }, { s: 0.88, duration: 3.2, ease: 'sine.out' }, 0);
  const h1 = txt('Every October', 'cap', 300);
  const h2 = txt('the world turns', 'serif', 372);
  const h3 = txt('PINK', 'huge grad solo glow', 488);
  inWords(tl, h1, 0.35, { stagger: 0.1 });
  inWords(tl, h2, 1.0, { stagger: 0.12 });
  punch(tl, h3, 1.8);
  [h1, h2, h3].forEach((e, i) => outUp(tl, e, 3.25 + i * 0.07));
  burst(1.8, [0, 0.95, 0.1], 0xffc6df, 90, 1.2);
  // ribbon spins away into depth, the 3D logo spins in
  tl.to(ribbonS, { z: -7, ry: '+=3.4', s: 0.4, duration: 1.3, ease: 'power3.in' }, 3.2);
  tl.to(ribbonS, { opacity: 0, duration: 0.3 }, 4.2);
  tl.fromTo(logoS, { z: -16 }, { z: 0, duration: 1.6, ease: 'power2.in', immediateRender: false }, T.coinIn);
  tl.fromTo(logoS, { ry: Math.PI * 5, rx: 0.5 }, { ry: 0, rx: 0, duration: 1.6, ease: 'power2.out', immediateRender: false }, T.coinIn);
  tl.fromTo(logoS, { s: 1 }, { immediateRender: false, keyframes: [{ s: 1.07, duration: 0.08, ease: 'power2.out' }, { s: 1, duration: 0.45, ease: 'elastic.out(1, 0.45)' }] }, T.coinLand);
  tl.fromTo(lightS, { sweep: -6 }, { sweep: 6, duration: 1.1, ease: 'power2.inOut', immediateRender: false }, T.coinLand - 0.25);
  tl.to(camS, { shake: 1, duration: 0.05 }, T.coinLand - 0.02).to(camS, { shake: 0, duration: 0.45, ease: 'power2.out' }, T.coinLand + 0.03);
  bgTo(T.coinIn, 0x3d0c29, 0x0e0309, 0xa0185c, 0.85, 1.2);

  // ===== S2 · The Siren steps out of the circle =====
  tl.to(sirenS, { z: 0.75, duration: 1.4, ease: 'power3.inOut' }, T.lift);
  tl.to(coinS, { z: -0.5, s: 1.08, dark: 0.6, duration: 1.4, ease: 'power3.inOut' }, T.lift);
  tl.to(coinS, { opacity: 0, duration: 0.45, ease: 'power1.in' }, T.lift + 1.15);
  tl.fromTo(ringS, { opacity: 0, s: 1.0 }, { opacity: 0.95, s: 1.18, duration: 1.1, ease: 'power2.out', immediateRender: false }, T.lift + 1.15);
  tl.to(haloS, { opacity: 0.55, s: 4.2, duration: 1.6, ease: 'power2.out' }, T.lift + 0.4);
  tl.to(sirenS, { ry: -0.5, duration: 0.9, ease: 'power2.out' }, T.lift + 0.2)
    .to(sirenS, { ry: 0.32, duration: 1.3, ease: 'sine.inOut' }, T.lift + 1.1)
    .to(sirenS, { ry: 0, duration: 1.1, ease: 'sine.inOut' }, T.lift + 2.4);
  tl.to(sirenS, { open: 0.55, duration: 0.9, ease: 'power2.out' }, T.lift + 0.8).to(sirenS, { open: 0, duration: 0.9, ease: 'power2.inOut' }, T.lift + 2.6);
  tl.to(camS, { z: 6.25, duration: 4.8, ease: 'sine.inOut' }, T.coinLand);
  burst(T.lift + 0.5, [0, 0, 0.9], 0xffe0ee, 90, 1.4);
  const s1 = txt('This October, our Siren', 'serif', 290);
  const s2 = txt('stepped out of the circle', 'bold', 402, { fontSize: '50px', letterSpacing: '.1em' });
  inWords(tl, s1, T.lift + 0.3);
  inWords(tl, s2, T.lift + 0.75, { stagger: 0.09 });
  outUp(tl, s1, T.lift + 2.25); outUp(tl, s2, T.lift + 2.3);
  const s3 = txt('to embrace every woman', 'serif', 290);
  const s4 = txt('who fights', 'big grad glow', 392, { fontSize: '124px' });
  inWords(tl, s3, T.lift + 2.6);
  inChars(tl, s4, T.lift + 3.0);
  outUp(tl, s3, T.hug0 - 0.45); outUp(tl, s4, T.hug0 - 0.4);

  // ===== S3 · Four embraces, one per bar =====
  const hugPhotos = [['group_a', 0.86, 0.645, [0.5, 0.45]], ['trio', 0.6, 0.8, [0.5, 0.3]], ['group_b', 0.86, 0.645, [0.5, 0.4]], ['group_c', 0.86, 0.645, [0.5, 0.45]]];
  const words = ['Support', 'Fight', 'Survive', 'Hope'];
  const hugCards = hugPhotos.map(([n, w, h, f], i) => { const c = new Card({ w, h, focus: f }); c.paint(photos[n]); c.s.slot = i * 2; return c; });
  HUGS.forEach((t0, i) => hug(t0, hugCards[i], i, words[i]));
  tl.to(camS, { lz: 0.85, ly: 0.2, z: 0.85 + 5.3, y: 0.45, duration: 1.2, ease: 'power2.inOut' }, T.hug0 - 1.1);
  HUGS.forEach((t0, i) => tl.to(camS, { yaw: (i % 2 ? -1 : 1) * 0.38, duration: 1.35, ease: 'sine.inOut' }, t0 - 1.05));
  bgTo(T.hug0, 0x45102f, 0x12030b, 0xb81a66, 0.95, 2);

  // ===== S4 · Orbit gallery: together we are stronger =====
  const extra = [['cake_board', 0.5, 0.667, [0.5, 0.5]], ['cakepops_a', 0.5, 0.667, [0.5, 0.5]], ['cake_hd_a', 0.5, 0.667, [0.5, 0.55]], ['cake_hd_b', 0.53, 0.667, [0.5, 0.55]]];
  extra.forEach(([n, w, h, f], i) => {
    const c = new Card({ w, h, focus: f }); c.paint(photos[n]); c.s.slot = i * 2 + 1;
    const r = rng(40 + i);
    tl.fromTo(c.s, { x: (r() - 0.5) * 6, y: -3.5 - r(), z: 3, rz: (r() - 0.5) * 2, o: 0, orbit: 0, s: 0.6 },
      { x: 0, y: 0, z: 0.75, rz: 0, o: 1, orbit: 1, duration: 1.1, ease: 'power3.out' }, T.gallery - 0.3 + i * 0.12);
  });
  tl.to(ORBIT, { r: 1.8, depth: 2.2, zc: 0.75, y: -0.3, tilt: 0.42, s: 1.2, duration: 1.6, ease: 'power2.inOut' }, T.gallery - 0.6);
  tl.to(sirenS, { s: 0.85, duration: 1.6, ease: 'power2.inOut' }, T.gallery - 0.6);
  tl.to(sirenS, { open: 0.75, duration: 1.0, ease: 'power2.out' }, T.gallery).to(sirenS, { open: 0.25, duration: 1.5, ease: 'sine.inOut' }, T.gallery + 2.2);
  tl.to(camS, { z: 9.4, y: 1.9, ly: 0.55, lz: 0.6, yaw: 0, duration: 2.2, ease: 'power2.inOut' }, T.gallery - 0.4);
  tl.to(ringS, { s: 1.55, opacity: 0.55, duration: 2, ease: 'power2.inOut' }, T.gallery);
  const g1 = txt('together', 'script glow', 210);
  const g2 = txt('we are stronger', 'bold', 452, { fontSize: '50px', letterSpacing: '.3em' });
  inWords(tl, g1, T.gallery + 0.35, { dur: 0.9, y: 30 });
  inWords(tl, g2, T.gallery + 0.9, { stagger: 0.12 });
  outUp(tl, g1, T.video1 - 0.75); outUp(tl, g2, T.video1 - 0.7);
  // zoom-through flash into the moments
  tl.to(camS, { z: 3.2, y: 0.2, ly: 0.2, duration: 0.8, ease: 'power3.in' }, T.video1 - 0.8);
  tl.to(fx, { flash: 1, duration: 0.3, ease: 'power2.in' }, T.video1 - 0.3).to(fx, { flash: 0, duration: 0.45, ease: 'power2.out' }, T.video1);
  tl.set([sirenS], { z: -50 }, T.video1).set(ringS, { opacity: 0 }, T.video1).set(haloS, { opacity: 0 }, T.video1);
  cards.forEach((c) => tl.set(c.s, { o: 0 }, T.video1));
  tl.set(camS, { x: 0, y: 0, z: 6.6, ly: 0, lx: 0, lz: 0, yaw: 0 }, T.video1);

  // ===== S5a · Awareness starts with a conversation =====
  bgTo(T.video1 - 0.05, 0xff6aa8, 0xa8124c, 0xffc2dc, 0.6, 0.1);
  const vTalk = videoCard({ w: 1.8, h: 3.2, px: 900, scrim: 0.75, radius: 0.055, border: 0.018 }, 'talk', T.video1 - 0.1, T.collage + 0.6, 0.0, 1);
  tl.fromTo(vTalk.s, { x: 0, y: 0.05, z: 0, ry: 0.22, rx: 0.06, rz: 0.03, s: 0.92, o: 0 }, { o: 1, s: 1, duration: 0.5, ease: 'power3.out' }, T.video1 - 0.05);
  tl.to(vTalk.s, { ry: -0.14, rz: -0.02, y: -0.05, duration: 4.8, ease: 'sine.inOut' }, T.video1);
  tl.to(vTalk.s, { x: -3.2, ry: -1.1, rz: -0.25, z: 0.6, duration: 0.6, ease: 'power3.in' }, T.collage - 0.3);
  tl.set(vTalk.s, { o: 0 }, T.collage + 0.3);
  const v1 = txt('Awareness', 'big shadow', 1180, { fontSize: '128px' });
  const v2 = txt('starts with a conversation', 'serif shadow', 1330, { fontSize: '70px' });
  inChars(tl, v1, T.video1 + 0.35, { stagger: 0.04 });
  inWords(tl, v2, T.video1 + 0.95);
  outUp(tl, v1, T.collage - 0.45); outUp(tl, v2, T.collage - 0.42);

  // ===== S5b · Collage: one day, one colour, one cause =====
  const cA = videoCard({ w: 0.98, h: 1.74, px: 640 }, 'banner', T.collage - 0.2, T.hugVid, 7.6, 1);
  const cB = videoCard({ w: 0.86, h: 1.53, px: 600 }, 'cake', T.collage - 0.2, T.hugVid, 0, 0.7);
  const cC = new Card({ w: 0.66, h: 0.88, px: 520 }); cC.paint(photos.cakepops_a);
  const cD = new Card({ w: 0.66, h: 0.825, px: 520 }); cD.paint(photos.cake_hd_b);
  const lay = [[cA, -0.5, 0.06, 0.0, -0.06], [cB, 0.5, -0.36, 0.35, 0.05], [cC, 0.55, 1.12, -0.25, 0.07], [cD, -0.55, -1.48, 0.45, -0.06]];
  lay.forEach(([c, x, y, z, rz], i) => {
    const r = rng(90 + i), t0 = T.collage - 0.25 + i * BEAT;
    tl.fromTo(c.s, { x: x * 2.6, y: y - 2.2, z: z + 1.5, rz: rz + (r() - 0.5) * 1.4, ry: (r() - 0.5) * 1.2, o: 0, s: 1 },
      { x, y, z, rz, ry: 0, o: 1, duration: 0.75, ease: 'power3.out' }, t0);
    tl.to(c.s, { y: y + 0.12 + i * 0.03, ry: (i % 2 ? -0.12 : 0.12), duration: 4.0, ease: 'sine.inOut' }, t0 + 0.75);
    tl.to(c.s, { x: x * 3.5, y: y * 1.6, z: 2.5, rz: rz * 6, o: 0, duration: 0.55, ease: 'power3.in' }, T.hugVid - 0.55 + i * 0.03);
  });
  ['One day.', 'One colour.', 'One cause.'].forEach((s, i) => {
    const e = txt(s, 'big ' + (i === 2 ? 'glow' : 'shadow'), 255, { fontSize: '120px' });
    inChars(tl, e, T.collage + i * 1.2 + 0.1, { stagger: 0.03, dur: 0.45 });
    if (i < 2) outUp(tl, e, T.collage + (i + 1) * 1.2 - 0.12, 0.25); else outUp(tl, e, T.hugVid - 0.4);
  });
  tl.to(camS, { z: 6.3, duration: 4.8, ease: 'sine.inOut' }, T.collage);

  // ===== S5c · She holds the moment (video hug) =====
  bgTo(T.hugVid - 0.5, 0x45102f, 0x12030b, 0xb81a66, 0.95, 0.7);
  tl.set(camS, { z: 0.85 + 4.9, y: 0.2, ly: -0.1, lz: 0.85, yaw: 0 }, T.hugVid - 0.6);
  tl.to(camS, { yaw: 0.5, duration: 1.4, ease: 'sine.inOut' }, T.hugVid - 0.6);
  tl.to(camS, { yaw: 0, z: 0.85 + 5.2, y: 0.6, ly: 0.42, duration: 2.0, ease: 'sine.inOut' }, T.aware - 0.6);
  tl.fromTo(sirenS, { z: -6, ry: -0.6, curl: 0, open: 0.6 }, { z: 0.75, ry: 0, open: 0, duration: 0.9, ease: 'power3.out', immediateRender: false }, T.hugVid - 0.6);
  tl.fromTo(haloS, { opacity: 0 }, { opacity: 0.7, s: 4.2, duration: 0.8, immediateRender: false }, T.hugVid - 0.4);
  tl.fromTo(ringS, { opacity: 0, s: 0.6 }, { opacity: 0.85, s: 1.18, duration: 0.9, ease: 'power3.out', immediateRender: false }, T.hugVid - 0.4);
  const vHug = videoCard({ w: 0.8, h: 0.8, px: 600, focus: [0.5, 0.35] }, 'banner', T.hugVid - 0.4, T.aware + 0.2, 0.2, 1);
  vHug.s.slot = 0;
  hug(T.hugVid + 0.15, vHug, 4, 'Hand in hand', { leaveTo: 'up', words: true });

  // ===== S6 · Early detection saves lives (breakdown) =====
  bgTo(T.aware, 0x2c0819, 0x08020a, 0x7a1046, 0.75, 1.2);
  tl.to(sirenS, { curl: 0.28, duration: 1.2, ease: 'power2.out' }, T.aware + 0.2);
  tl.to(camS, { yaw: 0.22, duration: 4.2, ease: 'sine.inOut' }, T.aware + 0.4);
  tl.to(camS, { z: 0.85 + 4.5, y: 0.5, ly: 0.36, duration: 3.6, ease: 'sine.inOut' }, T.aware + 1.2);
  tl.to(ringS, { opacity: 0.4, duration: 1 }, T.aware);
  tl.set(ribbonS, { draw: 0, x: 0, y: -0.43, z: 0.98, rx: 0, ry: 0, rz: 0, s: 0.2, opacity: 1 }, T.aware);
  tl.to(ribbonS, { draw: 1, duration: 1.1, ease: 'power2.inOut' }, T.aware + 0.7);
  tl.to(ribbonS, { ry: 0.5, duration: 3.5, ease: 'sine.inOut' }, T.aware + 0.7);
  burst(T.aware + 1.8, [0, -0.35, 1.05], 0xffd0e6, 60, 0.6);
  const a1 = txt('Early detection', 'bold', 262, { fontSize: '70px', letterSpacing: '.1em' });
  const a2 = txt('saves lives', 'big grad glow', 352, { fontSize: '124px' });
  const a3 = txt('Check · Screen · Support each other', 'small', 520, { fontSize: '30px' });
  inWords(tl, a1, T.aware + 0.4, { stagger: 0.12 });
  inChars(tl, a2, T.aware + 0.95, { stagger: 0.045 });
  inWords(tl, a3, T.aware + 2.2, { stagger: 0.09 });
  [a1, a2, a3].forEach((e, i) => outUp(tl, e, T.finale - 0.45 + i * 0.04));

  // ===== S7 · Finale: every photo becomes the ribbon =====
  tl.to(fx, { flash: 0.85, duration: 0.18, ease: 'power2.in' }, T.finale - 0.18).to(fx, { flash: 0, duration: 0.6, ease: 'power2.out' }, T.finale);
  tl.set(ribbonS, { opacity: 0 }, T.finale);
  tl.set(sirenS, { curl: 0, open: 0 }, T.finale);
  bgTo(T.finale, 0x4a0f31, 0x13030c, 0xd0206e, 1.0, 0.6);
  // the Siren returns to her circle, now nested in the ribbon loop
  tl.set(sirenS, { z: 0, ry: 0 }, T.finale).set(coinS, { opacity: 1, z: 0, s: 1, dark: 0 }, T.finale).set(ringS, { opacity: 0 }, T.finale);
  tl.fromTo(logoS, { x: 0, y: 0.35, z: 4, s: 0.32, ry: Math.PI * 2 }, { y: 0.77, z: 0.05, s: 0.3, ry: 0, duration: 1.3, ease: 'expo.out', immediateRender: false }, T.finale);
  tl.set(haloS, { opacity: 0.6, s: 1.6 }, T.finale);
  tl.set(camS, { x: 0, y: 0, z: 8.9, lx: 0, ly: -0.05, lz: 0, yaw: 0 }, T.finale);
  tl.to(camS, { z: 8.4, duration: 7, ease: 'sine.out' }, T.finale);
  buildMosaic();
  const f1 = txt("Let's defeat", 'bold', 168, { fontSize: '66px', letterSpacing: '.12em' });
  const f2 = txt('breast cancer', 'big grad glow', 252, { fontSize: '102px' });
  const f3 = txt('together', 'script glow', 352, { fontSize: '150px' });
  inWords(tl, f1, T.text, { stagger: 0.12 });
  inChars(tl, f2, T.text + 0.45, { stagger: 0.035 });
  inWords(tl, f3, T.text + 1.15, { dur: 0.9, y: 20 });
  [f1, f2, f3].forEach((e, i) => outUp(tl, e, T.end - 0.45 + i * 0.05));

  // ===== S8 · End card =====
  tl.to(logoS, { y: 0.75, z: 0.6, s: 0.74, ry: Math.PI * 2, duration: 1.1, ease: 'power3.inOut' }, T.end - 0.3);
  tl.to(haloS, { opacity: 0.85, s: 3.2, duration: 1.2 }, T.end - 0.2);
  tl.to(ringS, { opacity: 0.7, s: 1.12, duration: 1.2, ease: 'power2.out' }, T.end + 0.3);
  tl.fromTo(lightS, { sweep: -6 }, { sweep: 6, duration: 1.2, ease: 'power2.inOut', immediateRender: false }, T.end + 0.7);
  bgTo(T.end - 0.2, 0x3a0c27, 0x0c0208, 0xa0185c, 0.85, 1.2);
  const e1 = txt('معاً ضد سرطان الثدي', 'ar glow', 1235);
  const e2 = txt('#PinkOctober', 'bold grad glow', 1385, { fontSize: '60px', letterSpacing: '.08em' });
  const e3 = txt('Starbucks · Pink October', 'cap', 1478, { fontSize: '28px' });
  inWords(tl, e1, T.end + 0.5, { stagger: 0.14 });
  punch(tl, e2, T.end + 1.3);
  inWords(tl, e3, T.end + 1.7, { stagger: 0.1 });
  burst(T.end + 0.75, [0, 0.62, 1.0], 0xffe3ef, 110, 1.5);
  tl.to(fx, { fade: 1, duration: 0.7, ease: 'power2.in' }, DURATION - 0.7);
}

// one embrace: card flies to her chest, tails curl around it, release
function hug(t0, card, i, word, opts = {}) {
  const side = i % 2 ? -1 : 1, r = rng(200 + i);
  const restY = -0.36, restZ = 0.97;
  tl.fromTo(card.s, { x: side * 2.4, y: -2.2, z: 2.4, rz: side * 0.7, ry: -side * 0.9, rx: 0.3, o: 0, s: 1, orbit: 0 },
    { x: 0, y: restY, z: restZ, rz: 0, ry: 0, rx: 0, o: 1, duration: 0.75, ease: 'power3.out' }, t0 - 0.6);
  tl.to(sirenS, { curl: 1, duration: 0.5, ease: 'back.out(1.3)' }, t0 - 0.02);
  tl.to(sirenS, { rx: 0.07, s: 1.025, duration: 0.45, ease: 'power2.out' }, t0).to(sirenS, { rx: 0, s: 1, duration: 0.5, ease: 'power2.inOut' }, t0 + 1.5);
  tl.to(sirenS, { curl: 0, duration: 0.42, ease: 'power2.inOut' }, t0 + 1.52);
  tl.to(card.s, { z: restZ + 0.04, s: 1.03, duration: 1.4, ease: 'sine.inOut' }, t0 + 0.15);
  if (opts.leaveTo === 'up') tl.to(card.s, { y: 2.6, z: 2.2, rz: 0.4, o: 0, duration: 0.6, ease: 'power3.in' }, t0 + 1.75);
  else tl.to(card.s, { orbit: 1, duration: 0.9, ease: 'power2.inOut' }, t0 + 1.72);
  tl.to(camS, { z: '-=0.35', duration: 0.6, ease: 'power2.out' }, t0).to(camS, { z: '+=0.35', duration: 0.8, ease: 'power2.inOut' }, t0 + 1.4);
  // heart pulse + sparkle
  const heart = sprite(heartTex, 0xffffff); heart.position.set(0, restY, restZ - 0.05); scene.add(heart);
  const hs = { o: 0, s: 0.6 };
  tl.fromTo(hs, { o: 0, s: 0.7 }, { keyframes: [{ o: 0.95, s: 1.3, duration: 0.25 }, { o: 0, s: 2.6, duration: 0.9, ease: 'power2.out' }] }, t0 + 0.2);
  heart.userData.s = hs; hearts.push(heart);
  burst(t0 + 0.25, [0, restY + 0.1, restZ + 0.1], 0xffd6ea, 70, 1.1);
  // word
  const nEl = txt(String(i + 1).padStart(2, '0') + ' —', 'num', 270);
  const wEl = txt(word, 'big grad glow', 330, opts.words ? { fontSize: '96px', top: '345px' } : {});
  inWords(tl, nEl, t0 - 0.05);
  inChars(tl, wEl, t0 + 0.05, { stagger: opts.words ? 0.03 : 0.045 });
  outUp(tl, nEl, t0 + 1.85, 0.3); outUp(tl, wEl, t0 + 1.9, 0.3);
}
const hearts = [];

// ribbon mosaic made of every photo and video still
const tiles = [];
function buildMosaic() {
  const srcs = ['group_a', 'trio', 'group_b', 'cake_hd_a', 'group_c', 'cakepops_a', 'cake_board', 'cake_hd_b'];
  const N = 30, sc = 1.2, size = 0.34;
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N, p = ribbonCurve.getPointAt(u), tg = ribbonCurve.getTangentAt(u);
    const c = new Card({ w: size, h: size, px: 240, border: 0.045, radius: 0.08, focus: [0.5, 0.42] });
    c.paint(photos[srcs[i % srcs.length]]);
    const r = rng(500 + i), t0 = T.finale + 0.05 + i * 0.042;
    const tx = p.x * sc, ty = p.y * sc - 0.36, tz = p.z * sc + (i % 2) * 0.01;
    const rz = Math.atan2(tg.y, tg.x) - Math.PI / 2;
    tl.fromTo(c.s, { x: (r() - 0.5) * 9, y: (r() - 0.5) * 12, z: 4 + r() * 3, rz: (r() - 0.5) * 6, ry: (r() - 0.5) * 3, o: 0, s: 1.6 },
      { x: tx, y: ty, z: tz, rz, ry: 0, o: 1, s: 1, duration: 0.95, ease: 'power3.out' }, t0);
    tl.to(c.s, { z: tz + 0.08 * Math.sin(i), duration: 3, ease: 'sine.inOut' }, t0 + 1);
    tl.to(c.s, { x: tx * 3, y: ty * 2.2, z: 5 + r() * 2, rz: rz + (r() - 0.5) * 3, o: 0, duration: 0.8, ease: 'power3.in' }, T.end - 0.4 + r() * 0.25);
    tiles.push(c);
  }
}

// ---------- per-frame state application ----------
const tmpV = new THREE.Vector3(), Y_AXIS = new THREE.Vector3(0, 1, 0);
function apply(t) {
  clock = t;
  // background & particles
  bgUniforms.uTime.value = t;
  bgUniforms.uTop.value.set(bg.top.r, bg.top.g, bg.top.b);
  bgUniforms.uBot.value.set(bg.bot.r, bg.bot.g, bg.bot.b);
  bgUniforms.uBlob.value.set(bg.blob.r, bg.blob.g, bg.blob.b);
  bgUniforms.uBlobAmt.value = bg.amt;
  dust.material.uniforms.uTime.value = t; dust.material.uniforms.uOpacity.value = partS.opacity;
  bokeh.material.uniforms.uTime.value = t; bokeh.material.uniforms.uOpacity.value = partS.bokeh;
  for (const b of bursts) b.p.material.uniforms.uAge.value = t - b.t0 < 0 || t - b.t0 > 1.6 ? -1 : t - b.t0;

  // ribbon
  ribbon.visible = ribbonS.opacity > 0.01 && ribbonS.draw > 0.002;
  const N = ribbon.geometry.userData.N;
  ribbon.geometry.setDrawRange(0, Math.floor(ribbonS.draw * N) * 6);
  ribbon.position.set(ribbonS.x, ribbonS.y, ribbonS.z); ribbon.rotation.set(ribbonS.rx, ribbonS.ry, ribbonS.rz); ribbon.scale.setScalar(ribbonS.s);
  satin.opacity = ribbonS.opacity;
  const head = ribbonCurve.getPointAt(Math.min(0.999, ribbonS.draw));
  ribbon.updateMatrixWorld(); sparkHead.position.copy(head).applyMatrix4(ribbon.matrixWorld);
  sparkHead.material.opacity = ribbon.visible && ribbonS.draw < 0.995 ? 0.95 * ribbonS.opacity : 0;
  sparkHead.scale.setScalar(0.55 * ribbonS.s / 0.85 * (0.85 + 0.15 * Math.sin(t * 40)));

  // logo / siren
  logo.position.set(logoS.x, logoS.y, logoS.z); logo.rotation.set(logoS.rx, logoS.ry, logoS.rz); logo.scale.setScalar(logoS.s);
  logo.visible = logoS.z > -15.5;
  const idle = sirenS.z > 0.2 ? 1 : 0;
  siren.position.set(0, sirenS.y + idle * 0.025 * Math.sin(t * 1.4), sirenS.z);
  siren.rotation.set(sirenS.rx, sirenS.ry + idle * 0.05 * Math.sin(t * 0.7), 0);
  siren.scale.setScalar(sirenS.s);
  siren.visible = sirenS.z > -20;
  const curlA = [0.85, 0.85, 0.85], openA = [-0.55, -0.25, -0.1];
  for (let i = 0; i < 3; i++) {
    const wave = idle * 0.04 * Math.sin(t * 2.2 - i * 0.8);
    const a = sirenS.curl * curlA[i] + sirenS.open * openA[i] + wave;
    arms.L[i].rotation.y = a; arms.R[i].rotation.y = -a;
  }
  coin.position.z = coinS.z; coin.scale.set(coinS.s, -coinS.s, coinS.s);
  coinMat.opacity = coinS.opacity; coin.visible = coinS.opacity > 0.01;
  coinMat.color.setHex(0x003d27).lerp(new THREE.Color(0x06241a), coinS.dark);
  ring.material.opacity = ringS.opacity * (0.85 + 0.15 * Math.sin(t * 2 * Math.PI / (BEAT * 2)));
  ring.scale.setScalar(ringS.s); ring.position.z = -0.2; ring.rotation.z = t * 0.2;
  halo.material.opacity = haloS.opacity; halo.scale.setScalar(haloS.s);
  key.position.set(lightS.sweep, 3, 5);

  // cards
  for (const c of cards) c.apply();
  for (const h of hearts) { h.material.opacity = h.userData.s.o; h.scale.setScalar(h.userData.s.s); }

  // camera
  const sh = camS.shake * 0.06;
  tmpV.set(camS.x - camS.lx, camS.y - camS.ly, camS.z - camS.lz).applyAxisAngle(Y_AXIS, camS.yaw);
  camera.position.set(camS.lx + tmpV.x + 0.04 * Math.sin(t * 0.37) + sh * Math.sin(t * 91), camS.ly + tmpV.y + 0.03 * Math.sin(t * 0.29) + sh * Math.cos(t * 77), camS.lz + tmpV.z);
  camera.lookAt(camS.lx, camS.ly, camS.lz);
  camera.rotateZ(camS.roll);

  flashEl.style.opacity = fx.flash; fadeEl.style.opacity = fx.fade;
}

// film grain (seeded per frame)
const grainCv = document.getElementById('grain'), grainG = grainCv.getContext('2d');
const grainImg = grainG.createImageData(grainCv.width, grainCv.height);
function grain(frame) {
  const r = rng(frame * 7919 + 13), d = grainImg.data;
  for (let i = 0; i < d.length; i += 4) { const v = r() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  grainG.putImageData(grainImg, 0, 0);
}

async function updateVideos(t) {
  const jobs = [];
  for (const v of videoCards) {
    if (t < v.t0 - 0.05 || t > v.t1 || v.card.s.o <= 0.002) continue;
    const n = FRAMES[v.clip];
    const idx = Math.min(n, Math.max(1, Math.floor((v.from + Math.max(0, t - v.t0) * v.speed) * FPS) + 1));
    if (v.last === idx) continue;
    jobs.push(loadImg(frameSrc(v.clip, idx)).then((img) => { v.card.paint(img); v.last = idx; }));
  }
  await Promise.all(jobs);
}

window.renderAt = async (t) => {
  tl.seek(t, false);
  apply(t);
  await updateVideos(t);
  grain(Math.round(t * FPS));
  renderer.clear();
  renderer.render(bgScene, bgCam);
  renderer.clearDepth();
  renderer.render(scene, camera);
  return true;
};

window.ready = (async () => {
  await document.fonts.ready;
  await Promise.all(['Montserrat', 'Playfair Display', 'Great Vibes', 'Cairo'].map((f) => document.fonts.load(`700 40px "${f}"`)));
  await document.fonts.load('italic 500 40px "Playfair Display"');
  await document.fonts.load('800 40px Cairo', 'معاً');
  await buildSiren();
  await loadPhotos();
  buildTimeline();
  await window.renderAt(0);
  return { duration: DURATION };
})();
