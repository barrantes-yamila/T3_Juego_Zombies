//1:Configuración y escena
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';   // para clonar modelos con esqueleto (zombis)

// ---------- CONFIGURACIÓN (todo lo ajustable va aquí arriba) ----------
const PLAYER_HEIGHT = 1.7;   // altura de los ojos (m)
const WALK_SPEED = 6;        // m/s
const CITY_SCALE = 15;       // la ciudad original mide ~5.5 m; la agrandamos a ~83 m

// ---------- ESCENA, CÁMARA Y RENDERER ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1f2b);
scene.fog = new THREE.Fog(0x1a1f2b, 5, 45);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 300);
camera.position.set(0, PLAYER_HEIGHT, 115);   // inicio en el extremo SUR; la extracción estará al norte
scene.add(camera);   // las armas serán hijas de la cámara

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// ---------- LUCES ----------
scene.add(new THREE.HemisphereLight(0x8899bb, 0x222233, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 0.6);
sun.position.set(20, 40, 10);
scene.add(sun);
// ---------- COLISIONES: LISTA DE OBJETOS SÓLIDOS ----------
const colisionadores = [];        // cajas invisibles (Box3) de todo lo que no se puede atravesar
const RADIO_JUGADOR = 0.45;       // "grosor" del jugador
const LIMITE_X = 55;              // límites del mapa (muros invisibles)
const LIMITE_Z_NORTE = -135;
const LIMITE_Z_SUR = 130;

const objetosSolidos = [];        // los mismos objetos, para que las paredes bloqueen los disparos

function registrarColision(objeto) {
  colisionadores.push(new THREE.Box3().setFromObject(objeto));
  objetosSolidos.push(objeto);
}

// CIUDAD: SUELO Y EDIFICIOS

const textureLoader = new THREE.TextureLoader();

// Cargar texturas
const texturaSuelo = textureLoader.load('./suelo.jpg');
const texturaEdificio1 = textureLoader.load('./textura_edificio1.jpg');
const texturaEdificio2 = textureLoader.load('./textura_edificio2.jpg');

// Texturas de obstáculos
const texturaBarril = textureLoader.load('./textura_barril.jpg');
texturaBarril.colorSpace = THREE.SRGBColorSpace;
texturaBarril.wrapS = THREE.MirroredRepeatWrapping;   // se repite "en espejo" para que no se note la costura
texturaBarril.repeat.set(4, 1);                       // 4 repeticiones alrededor del barril

const texturaContenedor = textureLoader.load('./textura_contenedor.jpg');
texturaContenedor.colorSpace = THREE.SRGBColorSpace;

// Los extremos del contenedor son más angostos: cargamos la misma imagen otra vez
// y mostramos solo un pedazo (repeat 0.4). El navegador la reutiliza, no pesa más.
const texturaContenedorExtremo = textureLoader.load('./textura_contenedor.jpg');
texturaContenedorExtremo.colorSpace = THREE.SRGBColorSpace;
texturaContenedorExtremo.repeat.set(0.4, 1);

// Repetición de textura
texturaSuelo.wrapS = THREE.RepeatWrapping;
texturaSuelo.wrapT = THREE.RepeatWrapping;
texturaSuelo.repeat.set(18, 28);

// Suelo
const suelo = new THREE.Mesh(
  new THREE.PlaneGeometry(180, 280),
  new THREE.MeshStandardMaterial({
    map: texturaSuelo,
    roughness: 1
  })
);

suelo.rotation.x = -Math.PI / 2;
suelo.position.y = 0;
scene.add(suelo);

// Calle central
const calle = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 270),
  new THREE.MeshStandardMaterial({
    color: 0x383838,
    roughness: 1
  })
);

// INTERSECCIÓN DE LA CIUDAD

const calleLateral = new THREE.Mesh(
  new THREE.PlaneGeometry(90, 10),
  new THREE.MeshStandardMaterial({
    color: 0x383838,
    roughness: 1
  })
);

calleLateral.rotation.x = -Math.PI / 2;
calleLateral.position.set(0, 0.025, -75);

scene.add(calleLateral);

const calleLateral2 = calleLateral.clone();   // calle lateral del lado espejo (sur)
calleLateral2.position.z = 75;
scene.add(calleLateral2);


calle.rotation.x = -Math.PI / 2;
calle.position.set(0, 0.02, 0);
scene.add(calle);

// Función para crear edificios
function crearEdificio(x, z, ancho, alto, fondo, textura) {

  const edificio = new THREE.Mesh(
    new THREE.BoxGeometry(ancho, alto, fondo),
    new THREE.MeshStandardMaterial({
      map: textura,
      roughness: 0.9
    })
  );

  edificio.position.set(x, alto / 2, z);
  edificio.castShadow = true;
  edificio.receiveShadow = true;

  scene.add(edificio);
  registrarColision(edificio);   // ahora los edificios son sólidos
}

// Lista de edificios: [x, z, ancho, alto, fondo, textura]   (textura 1 = edificio1, 2 = edificio2)
const EDIFICIOS = [
  // Primera zona, lado izquierdo
  [-17, -10, 12, 12, 14, 1],
  [-19, -30, 14, 18, 12, 2],
  [-16, -50, 12, 10, 15, 1],
  [-30, -20, 10, 15, 12, 2],
  [-30, -45, 10, 13, 12, 1],
  // Primera zona, lado derecho
  [17, -10, 12, 15, 14, 2],
  [19, -30, 14, 12, 12, 1],
  [16, -50, 12, 17, 15, 2],
  [30, -20, 10, 12, 12, 1],
  [30, -45, 10, 16, 12, 2],
  // Segunda zona, lado izquierdo
  [-18, -95, 14, 16, 14, 1],
  [-18, -120, 12, 20, 14, 2],
  [-42, -95, 12, 13, 14, 2],
  [-42, -120, 14, 17, 12, 1],
  // Segunda zona, lado derecho
  [18, -95, 14, 19, 14, 2],
  [18, -120, 12, 14, 14, 1],
  [42, -95, 12, 15, 14, 1],
  [42, -120, 14, 18, 12, 2]
];

const TEXTURAS_EDIFICIO = { 1: texturaEdificio1, 2: texturaEdificio2 };

for (const [x, z, ancho, alto, fondo, tipo] of EDIFICIOS) {
  // Mitad norte: tal cual
  crearEdificio(x, z, ancho, alto, fondo, TEXTURAS_EDIFICIO[tipo]);
  // Mitad sur (ESPEJO): el mapa girado 180° (-x, -z) y con la textura contraria (3 - tipo)
  crearEdificio(-x, -z, ancho, alto, fondo, TEXTURAS_EDIFICIO[3 - tipo]);
}

console.log('Ciudad construida correctamente');



// ---------- OBSTÁCULOS ----------
function crearAuto(x, z, giro, color) {
  const auto = new THREE.Group();
  const pintura = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.3 });
  const cristal = new THREE.MeshStandardMaterial({ color: 0x111418, roughness: 0.2 });
  const llanta = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 1 });

  const carroceria = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.8, 1.9), pintura);
  carroceria.position.y = 0.7;
  const cabina = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 1.7), cristal);
  cabina.position.set(-0.2, 1.4, 0);
  auto.add(carroceria, cabina);

  for (const dx of [-1.3, 1.3]) {
    for (const dz of [-0.95, 0.95]) {
      const rueda = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12), llanta);
      rueda.rotation.x = Math.PI / 2;
      rueda.position.set(dx, 0.35, dz);
      auto.add(rueda);
    }
  }

  auto.position.set(x, 0, z);
  auto.rotation.y = giro;
  scene.add(auto);
  registrarColision(auto);
}

function crearContenedor(x, z, giro, tinte = 0xffffff) {
  // tinte: 0xffffff deja la textura tal cual; otro color la "pinta" (azul × naranja = gris oscuro, etc.)
  const lado = new THREE.MeshStandardMaterial({ map: texturaContenedor, color: tinte, roughness: 0.7, metalness: 0.3 });
  const extremo = new THREE.MeshStandardMaterial({ map: texturaContenedorExtremo, color: tinte, roughness: 0.7, metalness: 0.3 });
  const techo = new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.8, metalness: 0.4 });

  // Una BoxGeometry tiene 6 caras, en este orden: +x, -x, +y (techo), -y (suelo), +z, -z
  const cont = new THREE.Mesh(
    new THREE.BoxGeometry(6, 2.6, 2.4),
    [extremo, extremo, techo, techo, lado, lado]
  );
  cont.position.set(x, 1.3, z);
  cont.rotation.y = giro;
  scene.add(cont);
  registrarColision(cont);
}

function crearBarricada(x, z, giro) {
  const barricada = new THREE.Mesh(
    new THREE.BoxGeometry(3, 1.3, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x6b4f2a, roughness: 1 })
  );
  barricada.position.set(x, 0.65, z);
  barricada.rotation.y = giro;
  scene.add(barricada);
  registrarColision(barricada);
}

function crearBarril(x, z) {
  const barril = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 1.1, 16),
    new THREE.MeshStandardMaterial({ map: texturaBarril, roughness: 0.6, metalness: 0.2 })
  );
  barril.position.set(x, 0.55, z);
  scene.add(barril);
  registrarColision(barril);
  barril.rotation.y = Math.random() * Math.PI * 2;   // giro al azar (después de la colisión) para que no se vean todos iguales
}

// Se colocan dos veces: lado norte (s = 1) y lado espejo/sur (s = -1)
function colocarObstaculos(s) {
  // Calle principal: zigzag para obligar a esquivar (la calle va de x = -6 a x = 6)
  crearAuto(-3 * s, -14 * s, Math.PI / 2 + 0.1, 0x7a2b22);
  crearBarricada(3 * s, -26 * s, 0);
  crearContenedor(-3 * s, -40 * s, Math.PI / 2);
  crearAuto(3 * s, -55 * s, Math.PI / 2 - 0.2, 0x3b4a3b);
  crearBarril(-3 * s, -62 * s); crearBarril(-3.9 * s, -62.6 * s); crearBarril(-2.4 * s, -62.8 * s);
  crearBarricada(-3.2 * s, -66 * s, 0);
  crearBarricada(3.2 * s, -66 * s, 0);      // queda un hueco de 3 m en el centro

  // Calle lateral (la que cruza en z = -75 / z = +75)
  crearAuto(-20 * s, -75 * s, 0, 0x555555);
  crearContenedor(22 * s, -75 * s, 0, 0xd9b48a);
  crearBarricada(-35 * s, -75 * s, Math.PI / 2);

  // Zona final
  crearAuto(-3 * s, -90 * s, Math.PI / 2, 0x2b3a55);
  crearContenedor(3 * s, -105 * s, Math.PI / 2, 0xe8a0a0);
  crearBarricada(0, -118 * s, 0);
}
colocarObstaculos(1);
colocarObstaculos(-1);

// ---------- FAROLAS (postes de luz) ----------
const farolas = [];   // guardamos sus luces para poder hacer parpadear alguna

function crearFarola(x, z, haciaLaCalle, conLuz = true) {
  // haciaLaCalle: -1 = el brazo apunta hacia -X, +1 = hacia +X
  const grupo = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.6, metalness: 0.7 });

  const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6, 10), metal);
  poste.position.y = 3;

  const brazo = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 0.1), metal);
  brazo.position.set(0.65 * haciaLaCalle, 6, 0);

  const foco = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0xffddaa, emissive: 0xffaa55, emissiveIntensity: 2 })
  );
  foco.position.set(1.3 * haciaLaCalle, 5.9, 0);

  grupo.add(poste, brazo, foco);

  // SpotLight: ilumina en forma de cono HACIA EL SUELO (no hacia los edificios).
  // conLuz = false → la farola se ve (foco brillante) pero no gasta una luz real.
  if (conLuz) {
    const luz = new THREE.SpotLight(0xffaa55, 150, 20, Math.PI / 4, 0.6, 2);
    luz.position.copy(foco.position);
    luz.target.position.set(foco.position.x, 0, 0);
    grupo.add(luz, luz.target);
    farolas.push(luz);
  }

  grupo.position.set(x, 0, z);
  scene.add(grupo);
}

// Una a cada lado de la calle, alternadas (la calle va de x = -6 a x = 6)
crearFarola(-7, -20, 1);
crearFarola(7, -45, -1);
crearFarola(-7, -70, 1);
crearFarola(7, -100, -1);

// Lado espejo (sur): solo algunas con luz real, para no saturar el rendimiento
crearFarola(7, 20, -1, false);
crearFarola(-7, 45, 1);
crearFarola(7, 70, -1, false);
crearFarola(-7, 100, 1);

// ---------- BLOQUE 2: SISTEMA DE ARMAS ----------

const loaderArmas = new GLTFLoader();

const armas = {
  1: null,
  2: null
};

let armaSeleccionada = 1;

// Posición del arma respecto a la cámara
function prepararArma(modelo, grupo, largoObjetivo) {

  // Corregir orientación del modelo
  modelo.rotation.y = Math.PI / 2;

  // Calculamos el tamaño del modelo
  const caja = new THREE.Box3().setFromObject(modelo);
  const centro = caja.getCenter(new THREE.Vector3());
  const tamano = caja.getSize(new THREE.Vector3());

  // Ajustamos el tamaño automáticamente
  const maximo = Math.max(tamano.x, tamano.y, tamano.z);
  const escala = largoObjetivo / maximo;

  modelo.scale.setScalar(escala);

  // Centramos el modelo
  modelo.position.sub(centro.multiplyScalar(escala));

  modelo.traverse(objeto => {
    if (objeto.isMesh) {
      objeto.castShadow = true;
    }
  });

  grupo.add(modelo);
}

// Creamos los grupos que acompañarán a la cámara
const grupoRifle = new THREE.Group();
const grupoPistola = new THREE.Group();

grupoRifle.position.set(0.35, -0.28, -0.7);
grupoPistola.position.set(0.22, -0.2, -0.45);

camera.add(grupoRifle);
camera.add(grupoPistola);

// Cargar rifle
loaderArmas.load(
  './models/arma_mosin.glb',
  (gltf) => {
    prepararArma(gltf.scene, grupoRifle, 1.8);
    armas[1] = grupoRifle;
    grupoRifle.visible = true;
    console.log('Rifle cargado');
  },
  undefined,
  (error) => console.error('Error cargando rifle:', error)
);

// Cargar pistola
loaderArmas.load(
  './models/arma_pistola.glb',
  (gltf) => {
    prepararArma(gltf.scene, grupoPistola, 0.3);
    armas[2] = grupoPistola;
    grupoPistola.visible = false;
    console.log('Pistola cargada');
  },
  undefined,
  (error) => console.error('Error cargando pistola:', error)
);

// Cambiar de arma
function cambiarArma(numero) {

  armaSeleccionada = numero;

  grupoRifle.visible = numero === 1;
  grupoPistola.visible = numero === 2;

  console.log('Arma seleccionada:', numero);
  actualizarHUD();   // refresca el contador de balas del arma elegida
}


//2: Controles, movimiento y bucle 
const controls = new PointerLockControls(camera, document.body);
const menu = document.querySelector('#menu');
menu.addEventListener('click', () => controls.lock());
controls.addEventListener('lock',   () => { menu.style.display = 'none'; });
controls.addEventListener('unlock', () => { if (estado === 'jugando') menu.style.display = 'grid'; });   // en Game Over no mostramos el menú

const keys = new Set();
window.addEventListener('keydown', (e) => keys.add(e.code));

// Selección de armas con teclado
window.addEventListener('keydown', (e) => {

  if (e.code === 'Digit1' || e.code === 'Numpad1') {
    cambiarArma(1);
  }

  if (e.code === 'Digit2' || e.code === 'Numpad2') {
    cambiarArma(2);
  }

});

window.addEventListener('keyup',   (e) => keys.delete(e.code));

// ---------- BLOQUE 3: MUNICIÓN (cada arma con su contador) ----------
const municion = { 1: 5, 2: 8 };        // 1 = rifle Mosin (5 balas), 2 = pistola (8 balas)
const RECARGA_CAJA = { 1: 5, 2: 8 };    // balas que da cada caja a cada arma
const nombreArma = { 1: 'RIFLE MOSIN', 2: 'PISTOLA' };

// ---------- SONIDOS ----------
const sonidos = {
  disparo: {
    1: new Audio('./sonidos/sonido_escopeta.mp3'),   // sonido del arma 1 (rifle)
    2: new Audio('./sonidos/sonido_pistola.mp3')     // sonido del arma 2 (pistola)
  },
  sinBalas: new Audio('./sonidos/sonido_sinbalas.mp3'),
  recoger: new Audio('./sonidos/sonido_recogerbalas.mp3'),
  gameOver: new Audio('./sonidos/sonido_gameover.mp3'),         // lo usaremos con el Game Over
  victoria: new Audio('./sonidos/sonido_levelcompletado.mp3'),  // lo usaremos al llegar a la extracción
  zombie: new Audio('./sonidos/sonido_zombie.mp3')              // lo usaremos con los zombis
};

// Reproduce una COPIA del sonido: así el mismo sonido puede sonar varias veces a la vez
// (por ejemplo, disparos seguidos) sin cortarse a sí mismo.
function reproducir(audio, volumen = 1) {
  const copia = audio.cloneNode();
  copia.volume = volumen;
  copia.play().catch(() => {});   // si el navegador lo bloquea, simplemente no suena
}

// Contador en pantalla (abajo a la derecha)
const hudMunicion = document.createElement('div');
hudMunicion.style.cssText =
  'position:fixed; right:24px; bottom:24px; z-index:2; pointer-events:none; text-align:right;' +
  'color:#fff; font:bold 26px Arial; text-shadow:0 0 6px #000;';
document.body.appendChild(hudMunicion);

function actualizarHUD() {
  const n = municion[armaSeleccionada];
  hudMunicion.innerHTML =
    `${nombreArma[armaSeleccionada]}<br>` +
    `<span style="color:${n === 0 ? '#ff5252' : '#ffd54f'}">${n}</span> balas`;
}
actualizarHUD();

// Mensajes cortos en pantalla ("SIN MUNICIÓN", "+5 / +8 balas")
const hudAviso = document.createElement('div');
hudAviso.style.cssText =
  'position:fixed; top:18%; width:100%; text-align:center; z-index:2; pointer-events:none;' +
  'font:bold 24px Arial; text-shadow:0 0 6px #000; opacity:0; transition:opacity .25s;';
document.body.appendChild(hudAviso);

let avisoTimer;
function mostrarAviso(texto, color) {
  hudAviso.textContent = texto;
  hudAviso.style.color = color;
  hudAviso.style.opacity = 1;
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => { hudAviso.style.opacity = 0; }, 1500);
}

// Marcador de impacto (una ✕ roja en la mira)
const hitMarker = document.createElement('div');
hitMarker.textContent = '✕';
hitMarker.style.cssText =
  'position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); z-index:2; pointer-events:none;' +
  'color:#ff5252; font:bold 36px Arial; text-shadow:0 0 6px #000; opacity:0; transition:opacity .1s;';
document.body.appendChild(hitMarker);
let hitTimer;
function mostrarHitMarker(color = '#ff5252') {
  hitMarker.style.color = color;
  hitMarker.style.opacity = 1;
  clearTimeout(hitTimer);
  hitTimer = setTimeout(() => { hitMarker.style.opacity = 0; }, 120);
}

const raycaster = new THREE.Raycaster();
const centroPantalla = new THREE.Vector2(0, 0);   // la mira está en el centro

// Disparo: consume 1 bala; sin balas NO dispara
function disparar() {
  if (municion[armaSeleccionada] <= 0) {
    reproducir(sonidos.sinBalas);
    mostrarAviso('SIN MUNICIÓN', '#ff5252');
    return;
  }
  municion[armaSeleccionada]--;
  reproducir(sonidos.disparo[armaSeleccionada], 0.8);
  actualizarHUD();

  // RF07: lanzamos un "rayo" desde la mira. Si lo PRIMERO que toca es un zombi, es un impacto válido.
  // Si antes toca una pared, un auto, etc., la bala no llega al zombi.
  raycaster.setFromCamera(centroPantalla, camera);
  raycaster.far = 100;
  const impactos = raycaster.intersectObjects([...objetosSolidos, ...hitboxes], true);
  if (impactos.length > 0) {
    const zombi = impactos[0].object.userData.zombi;
    if (zombi) danarZombi(zombi, impactos[0].object.userData.cabeza === true);   // ¿le dimos en la cabeza?
  }
}

// 'mousedown' se dispara UNA sola vez por clic: mantener presionado NO dispara en automático
window.addEventListener('mousedown', (e) => {
  if (e.button === 0 && controls.isLocked && estado === 'jugando') disparar();
});

// ---------- CAJAS DE MUNICIÓN (única forma de recuperar balas) ----------
const cajas = [];

function crearCajaMunicion(x, z) {
  const caja = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.4, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x4b5d2a, emissive: 0x335500, emissiveIntensity: 0.6 })
  );
  caja.position.set(x, 0.7, z);

  // columna de luz amarilla para ubicarla de lejos
  const rayo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 6, 8, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.3, fog: false })
  );
  rayo.position.set(x, 3, z);

  scene.add(caja, rayo);
  cajas.push({ caja, rayo });
}

crearCajaMunicion(4, -6);        // cerca del inicio
crearCajaMunicion(-16, -39.5);   // callejón oeste
crearCajaMunicion(17, -39.5);    // callejón este
crearCajaMunicion(-41, -30);     // detrás de los edificios (oeste)
crearCajaMunicion(-30, -75);     // calle lateral, lado oeste
crearCajaMunicion(32, -75);      // calle lateral, lado este
crearCajaMunicion(30.5, -95);    // entre edificios (segunda zona)
crearCajaMunicion(-30, -108);    // rincón de la segunda zona

// Más cajas (hay más zombis)
crearCajaMunicion(5, 90);
crearCajaMunicion(-5, 50);
crearCajaMunicion(5, -30);
crearCajaMunicion(-5, -100);

// Lado espejo (sur)
crearCajaMunicion(-4, 6);
crearCajaMunicion(-17, 39.5);
crearCajaMunicion(41, 30);
crearCajaMunicion(-32, 75);
crearCajaMunicion(30, 108);

function actualizarCajas(tiempo) {
  for (let i = cajas.length - 1; i >= 0; i--) {
    const c = cajas[i];
    c.caja.rotation.y = tiempo * 1.5;   // giran

    const dx = camera.position.x - c.caja.position.x;
    const dz = camera.position.z - c.caja.position.z;
    if (Math.hypot(dx, dz) < 1.4) {     // el jugador la toca → se recoge
      scene.remove(c.caja, c.rayo);
      cajas.splice(i, 1);
      reproducir(sonidos.recoger);
      municion[1] += RECARGA_CAJA[1];
      municion[2] += RECARGA_CAJA[2];
      actualizarHUD();
      mostrarAviso(`+${RECARGA_CAJA[1]} rifle / +${RECARGA_CAJA[2]} pistola`, '#ffd54f');
    }
  }
}

// ¿La posición (x, z) está dentro de algo sólido o fuera del mapa?
function chocaConAlgo(x, z, radio = RADIO_JUGADOR) {   // 'radio' permite usarla también con los zombis
  if (x < -LIMITE_X || x > LIMITE_X || z < LIMITE_Z_NORTE || z > LIMITE_Z_SUR) return true;
  for (const caja of colisionadores) {
    if (x > caja.min.x - radio && x < caja.max.x + radio &&
        z > caja.min.z - radio && z < caja.max.z + radio) return true;
  }
  return false;
}

function updatePlayer(delta) {
  if (!controls.isLocked || estado !== 'jugando') return;
  const step = WALK_SPEED * delta;
  const antesX = camera.position.x;
  const antesZ = camera.position.z;

  if (keys.has('KeyW')) controls.moveForward(step);
  if (keys.has('KeyS')) controls.moveForward(-step);
  if (keys.has('KeyA')) controls.moveRight(-step);
  if (keys.has('KeyD')) controls.moveRight(step);
  camera.position.y = PLAYER_HEIGHT;

  // Si el movimiento nos metió en algo sólido, deshacemos solo el eje que chocó
  // (así el jugador "se desliza" por la pared en vez de quedarse pegado)
  if (chocaConAlgo(camera.position.x, camera.position.z)) {
    const nuevoX = camera.position.x;
    const nuevoZ = camera.position.z;
    if (!chocaConAlgo(nuevoX, antesZ)) {            // el que chocó fue Z
      camera.position.z = antesZ;
    } else if (!chocaConAlgo(antesX, nuevoZ)) {     // el que chocó fue X
      camera.position.x = antesX;
    } else {                                        // chocaron los dos
      camera.position.x = antesX;
      camera.position.z = antesZ;
    }
  }
}
// ---------- BLOQUE 4: ZOMBIS ----------
const ALTURA_ZOMBI = 1.8;        // altura final de cada zombi (m)
const VIDA_ZOMBI = 2;            // RF07: dos puntos de resistencia
const DISTANCIA_ATRAPAR = 0.9;   // si un zombi llega a esta distancia, te atrapa (Game Over)
const RADIO_ZOMBI = 0.35;        // "grosor" del zombi para chocar con paredes

// modelo = archivo de /models · rango = distancia a la que se activa · velocidad en m/s
const ZOMBIS = [
  // Mitad sur (tu zona de inicio es z = 115)
  { x: 3,    z: 100,  modelo: 'zombie_m_a', rango: 12, velocidad: 2.4 },
  { x: -4,   z: 88,   modelo: 'zombie_f_a', rango: 12, velocidad: 2.6 },
  { x: 3.5,  z: 75,   modelo: 'zombie_m_b', rango: 14, velocidad: 2.7 },
  { x: -3,   z: 60,   modelo: 'zombie_f_b', rango: 14, velocidad: 2.8 },
  { x: 3,    z: 48,   modelo: 'zombie_m_c', rango: 14, velocidad: 3.0 },
  { x: -3,   z: 32,   modelo: 'zombie_f_c', rango: 14, velocidad: 3.0 },
  { x: -30,  z: 73,   modelo: 'zombie_f_d', rango: 12, velocidad: 2.6 },   // vigila una caja
  { x: -4,   z: 12,   modelo: 'zombie_m_d', rango: 16, velocidad: 3.4 },
  // Mitad norte
  { x: 3,    z: -8,   modelo: 'zombie_f_d', rango: 14, velocidad: 3.0 },
  { x: -3,   z: -22,  modelo: 'zombie_m_e', rango: 14, velocidad: 3.0 },
  { x: -14,  z: -39.5, modelo: 'zombie_f_e', rango: 10, velocidad: 2.6 },  // vigila un callejón
  { x: 3,    z: -48,  modelo: 'zombie_m_a', rango: 14, velocidad: 3.2 },
  { x: -4,   z: -58,  modelo: 'zombie_f_a', rango: 16, velocidad: 3.2 },
  { x: 0,    z: -72,  modelo: 'zombie_m_b', rango: 16, velocidad: 3.6 },
  { x: -32,  z: -76,  modelo: 'zombie_f_b', rango: 12, velocidad: 3.0 },
  { x: 4,    z: -95,  modelo: 'zombie_m_c', rango: 16, velocidad: 3.8 },
  { x: -3,   z: -110, modelo: 'zombie_f_c', rango: 18, velocidad: 4.0 },
  { x: 3,    z: -122, modelo: 'zombie_m_d', rango: 18, velocidad: 4.0 }
];

// Hordas: grupos de 2 a 4 zombis juntos. Se agregan a la lista ZOMBIS.
const POSICIONES_HORDA = [[0, 0], [1.6, 1.2], [-1.6, 1.2], [0, 2.4]];   // cómo se reparten alrededor del centro
function horda(x, z, modelos, rango = 14, velocidad = 3) {
  modelos.forEach((modelo, i) => {
    ZOMBIS.push({
      x: x + POSICIONES_HORDA[i][0], z: z + POSICIONES_HORDA[i][1],
      modelo, rango, velocidad: velocidad + i * 0.15
    });
  });
}
// Mitad sur
horda(0, 82, ['zombie_m_e', 'zombie_f_e'], 14, 2.8);
horda(1.5, 52, ['zombie_f_a', 'zombie_m_b', 'zombie_f_c'], 14, 3.0);
horda(0, 20, ['zombie_m_d', 'zombie_f_d', 'zombie_m_a'], 16, 3.2);
horda(12, 75, ['zombie_f_a', 'zombie_m_c'], 12, 3.0);     // calle lateral
// Mitad norte
horda(0, -14, ['zombie_m_b', 'zombie_f_b'], 14, 3.2);
horda(1, -34, ['zombie_f_c', 'zombie_m_e', 'zombie_f_d'], 14, 3.3);
horda(0, -82, ['zombie_m_a', 'zombie_f_a', 'zombie_m_b'], 16, 3.5);
horda(-10, -74, ['zombie_f_e', 'zombie_m_c'], 12, 3.4);   // calle lateral
horda(-2, -100, ['zombie_f_b', 'zombie_m_d', 'zombie_f_c', 'zombie_m_e'], 18, 3.8);   // la más peligrosa

let estado = 'jugando';          // 'jugando' | 'gameover' | 'victoria'
const zombis = [];               // todos los zombis
const hitboxes = [];             // cajas de impacto de los zombis VIVOS (las usará el disparo)
const prototipos = {};           // un modelo cargado por cada archivo (después se clona)
const loaderZombis = new GLTFLoader();

// Mide el modelo para dejarlo con la altura correcta y con los pies en el suelo
function prepararPrototipo(gltf) {
  const caja = new THREE.Box3().setFromObject(gltf.scene);
  const tamano = caja.getSize(new THREE.Vector3());
  const centro = caja.getCenter(new THREE.Vector3());
  return {
    escena: gltf.scene,
    clip: gltf.animations[0],
    escala: ALTURA_ZOMBI / tamano.y,
    desplazamiento: new THREE.Vector3(-centro.x, -caja.min.y, -centro.z)
  };
}

function crearZombi(datos) {
  const proto = prototipos[datos.modelo];
  const modelo = SkeletonUtils.clone(proto.escena);      // copia con su propio esqueleto
  modelo.position.copy(proto.desplazamiento);
  modelo.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });

  const escalador = new THREE.Group();                   // aplica la escala
  escalador.scale.setScalar(proto.escala);
  escalador.add(modelo);

  const cuerpo = new THREE.Group();                      // se inclina al morir
  cuerpo.add(escalador);

  const raiz = new THREE.Group();                        // posición + giro hacia el jugador
  raiz.add(cuerpo);
  raiz.position.set(datos.x, 0, datos.z);
  raiz.rotation.y = Math.random() * Math.PI * 2;
  scene.add(raiz);

  // Cajas de impacto invisibles (RF07): una para el cuerpo y otra más chica para la CABEZA
  const matInvisible = new THREE.MeshBasicMaterial({ visible: false });
  const hitboxCuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.8), matInvisible);
  hitboxCuerpo.position.y = 0.7;                       // de 0 a 1.4 m
  const hitboxCabeza = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), matInvisible);
  hitboxCabeza.position.y = 1.6;                       // de 1.4 a 1.8 m
  hitboxCabeza.userData.cabeza = true;
  raiz.add(hitboxCuerpo, hitboxCabeza);

  // Animación de carrera (el modelo trae una sola)
  const mixer = new THREE.AnimationMixer(modelo);
  const accion = mixer.clipAction(proto.clip);
  accion.play();
  accion.time = Math.random() * proto.clip.duration;     // para que no estén todos sincronizados
  mixer.update(0);
  accion.timeScale = datos.velocidad / 2.5;

  const zombi = {
    raiz, cuerpo, mixer,
    hitboxes: [hitboxCuerpo, hitboxCabeza],
    aturdido: 0,                   // segundos que le quedan aturdido (por un crítico)
    estado: 'inactivo',            // 'inactivo' → 'activo' → 'muerto'
    vida: VIDA_ZOMBI,
    rango: datos.rango,            // RF05: distancia de activación
    velocidad: datos.velocidad,
    caida: 0
  };
  hitboxCuerpo.userData.zombi = zombi;   // así el disparo sabe a qué zombi pertenece la caja
  hitboxCabeza.userData.zombi = zombi;
  hitboxes.push(hitboxCuerpo, hitboxCabeza);
  zombis.push(zombi);
}

async function cargarZombis() {
  const archivos = [...new Set(ZOMBIS.map((z) => z.modelo))];   // cada archivo una sola vez
  const gltfs = await Promise.all(archivos.map((a) => loaderZombis.loadAsync(`./models/${a}.glb`)));
  archivos.forEach((a, i) => { prototipos[a] = prepararPrototipo(gltfs[i]); });
  ZOMBIS.forEach(crearZombi);
}
cargarZombis().catch((e) => console.error('Error cargando zombis:', e));

let eliminados = 0;

const CHANCE_CRITICO = 0.3;      // probabilidad de crítico al dar en la cabeza
const TIEMPO_ATURDIDO = 2;       // segundos que el crítico deja al zombi aturdido

function danarZombi(zombi, enLaCabeza) {
  if (zombi.estado === 'muerto') return;
  zombi.vida--;                                          // cada impacto válido resta 1 punto (siempre 1, también en la cabeza)
  if (zombi.estado === 'inactivo') activarZombi(zombi);  // un disparo también lo despierta

  if (enLaCabeza && zombi.vida > 0) {
    // Tiro a la cabeza: marcador dorado; con suerte es CRÍTICO y el zombi queda aturdido un rato
    mostrarHitMarker('#ffd54f');
    if (Math.random() < CHANCE_CRITICO) {
      zombi.aturdido = TIEMPO_ATURDIDO;
      mostrarAviso('¡CRÍTICO! Zombi aturdido', '#ffd54f');
    } else {
      mostrarAviso('¡Tiro a la cabeza!', '#ffd54f');
    }
  } else {
    mostrarHitMarker();
  }
  if (zombi.vida <= 0) matarZombi(zombi);                // muere exactamente al 2.º impacto
}

function matarZombi(zombi) {
  zombi.estado = 'muerto';                               // deja de perseguir y de atacar
  for (const caja of zombi.hitboxes) hitboxes.splice(hitboxes.indexOf(caja), 1);   // sus cajas ya no reciben disparos
  eliminados++;
  mostrarAviso(`Zombi eliminado (${eliminados}/${zombis.length})`, '#8bc34a');
}

function activarZombi(zombi) {
  zombi.estado = 'activo';
  if (sonidos.zombie.paused) {                 // un gruñido a la vez, para que no se solapen
    sonidos.zombie.volume = 0.5;
    sonidos.zombie.play().catch(() => {});
  }
}

// Mueve al zombi; si choca en un eje, sigue por el otro (se desliza por las paredes)
function moverZombi(zombi, dx, dz) {
  const p = zombi.raiz.position;
  if (!chocaConAlgo(p.x + dx, p.z, RADIO_ZOMBI)) p.x += dx;
  if (!chocaConAlgo(p.x, p.z + dz, RADIO_ZOMBI)) p.z += dz;
}

const haciaJugador = new THREE.Vector3();
function actualizarZombis(delta) {
  for (const zombi of zombis) {
    // Muerto: solo cae hacia atrás. Ya no persigue ni ataca.
    if (zombi.estado === 'muerto') {
      if (zombi.caida < 1) {
        zombi.caida = Math.min(1, zombi.caida + delta * 2.5);
        zombi.cuerpo.rotation.x = -zombi.caida * Math.PI / 2;
      }
      continue;
    }

    haciaJugador.set(camera.position.x - zombi.raiz.position.x, 0, camera.position.z - zombi.raiz.position.z);
    const distancia = haciaJugador.length();

    // RF05: inactivo (quieto) hasta que el jugador entra en su rango de detección
    if (zombi.estado === 'inactivo') {
      if (distancia < zombi.rango) activarZombi(zombi);
      else continue;
    }

    // Aturdido (por un crítico): se queda quieto un rato, sin moverse ni atacar
    if (zombi.aturdido > 0) {
      zombi.aturdido -= delta;
      continue;
    }

    // Activo: corre hacia el jugador
    zombi.mixer.update(delta);
    zombi.raiz.rotation.y = Math.atan2(haciaJugador.x, haciaJugador.z);   // el modelo mira hacia +Z

    if (distancia < DISTANCIA_ATRAPAR) {   // RF09: te alcanzó
      gameOver();
      return;
    }
    haciaJugador.normalize().multiplyScalar(zombi.velocidad * delta);
    moverZombi(zombi, haciaJugador.x, haciaJugador.z);
  }
}

// ---------- GAME OVER ----------
const pantallaFinal = document.createElement('div');
pantallaFinal.style.cssText =
  'position:fixed; inset:0; display:none; place-items:center; text-align:center; z-index:5;' +
  'background:#000b; color:#fff; font-family:Arial,sans-serif; cursor:pointer;';
pantallaFinal.innerHTML =
  '<div><p id="finSub" style="font-size:20px; letter-spacing:8px; color:#ffd54f; margin:0 0 10px"></p>' +
  '<h1 id="finTitulo" style="font-size:64px; margin:0 0 12px"></h1>' +
  '<p id="finTexto" style="font-size:22px"></p><p>Haz clic para reiniciar</p></div>';
pantallaFinal.addEventListener('click', () => location.reload());   // reiniciar (mejora voluntaria)
document.body.appendChild(pantallaFinal);

function gameOver() {
  if (estado !== 'jugando') return;
  estado = 'gameover';                 // detiene la partida: ya nada se actualiza
  controls.unlock();                   // suelta el mouse
  sonidos.zombie.pause();
  reproducir(sonidos.gameOver);
  document.querySelector('#finSub').textContent = '';
  document.querySelector('#finTitulo').textContent = 'GAME OVER';
  document.querySelector('#finTitulo').style.color = '#ff5252';
  document.querySelector('#finTexto').textContent = 'Un zombi te atrapó';
  pantallaFinal.style.display = 'grid';
}

// ---------- BLOQUE 5: ZONA DE EXTRACCIÓN, HELICÓPTERO Y VICTORIA ----------
const INICIO = new THREE.Vector3(0, 0, 115);          // donde empiezas
const EXTRACCION = new THREE.Vector3(0, 0, -128);     // zona de extracción (extremo norte)
const RADIO_EXTRACCION = 4;

// Marcador de zona: un círculo en el suelo + una columna de luz
function crearMarcadorZona(centro, radio, color) {
  const circulo = new THREE.Mesh(
    new THREE.CylinderGeometry(radio, radio, 0.1, 40),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 })
  );
  circulo.position.set(centro.x, 0.06, centro.z);
  const columna = new THREE.Mesh(
    new THREE.CylinderGeometry(radio * 0.25, radio * 0.25, 40, 16, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, fog: false })
  );
  columna.position.set(centro.x, 20, centro.z);
  scene.add(circulo, columna);
}
crearMarcadorZona(INICIO, 3, 0x2196f3);                        // inicio (azul)
crearMarcadorZona(EXTRACCION, RADIO_EXTRACCION, 0x4caf50);     // extracción (verde)

// Indicador de distancia (arriba a la izquierda)
const hudObjetivo = document.createElement('div');
hudObjetivo.style.cssText =
  'position:fixed; top:14px; left:16px; z-index:2; pointer-events:none; color:#fff;' +
  'font:16px Arial; line-height:1.5; text-shadow:0 0 6px #000;';
document.body.appendChild(hudObjetivo);

function actualizarObjetivo() {
  const d = Math.hypot(camera.position.x - EXTRACCION.x, camera.position.z - EXTRACCION.z);
  hudObjetivo.innerHTML =
    `🎯 Zona de extracción: <b>${Math.max(0, d - RADIO_EXTRACCION).toFixed(0)} m</b><br>` +
    `☠ Zombis eliminados: <b>${eliminados}/${zombis.length}</b>`;
}

// --- Helicóptero (se carga al inicio; si el archivo no existe, la victoria funciona igual) ---
let helicoptero = null;        // grupo con el modelo
let mixerHeli = null;          // animación de las hélices (si el modelo la trae)

new GLTFLoader().loadAsync('./models/helicoptero.glb').then((gltf) => {
  const caja = new THREE.Box3().setFromObject(gltf.scene);
  const tamano = caja.getSize(new THREE.Vector3());
  const centro = caja.getCenter(new THREE.Vector3());
  gltf.scene.position.sub(centro);                                       // centrado en el origen

  helicoptero = new THREE.Group();
  helicoptero.add(gltf.scene);
  helicoptero.scale.setScalar(12 / Math.max(tamano.x, tamano.z));        // ~12 m de largo
  helicoptero.visible = false;
  helicoptero.add(new THREE.PointLight(0xffffff, 40, 60));               // luz propia para que se vea en la oscuridad
  scene.add(helicoptero);

  if (gltf.animations.length > 0) {                                      // hélices girando
    mixerHeli = new THREE.AnimationMixer(gltf.scene);
    gltf.animations.forEach((clip) => mixerHeli.clipAction(clip).play());
  }
}).catch((e) => console.error('No se pudo cargar el helicóptero:', e));

// Pantalla que se va oscureciendo
const fundido = document.createElement('div');
fundido.style.cssText =
  'position:fixed; inset:0; background:#000; opacity:0; z-index:4; pointer-events:none; transition:opacity 3s linear;';
document.body.appendChild(fundido);

// --- Animación de victoria ---
let tVictoria = 0;
let pitchInicial = 0, yawInicial = 0;
let textoMostrado = false;
const euler = new THREE.Euler(0, 0, 0, 'YXZ');

function comprobarExtraccion() {
  const d = Math.hypot(camera.position.x - EXTRACCION.x, camera.position.z - EXTRACCION.z);
  if (d < RADIO_EXTRACCION) iniciarVictoria();
}

function iniciarVictoria() {
  if (estado !== 'jugando') return;
  estado = 'victoria';                    // detiene el juego: zombis y jugador ya no se mueven
  controls.unlock();                      // suelta el mouse (así no gira la cámara mientras dura la animación)
  sonidos.zombie.pause();
  reproducir(sonidos.victoria);
  grupoRifle.visible = false;             // escondemos las armas y el contador
  grupoPistola.visible = false;
  hudMunicion.style.display = 'none';
  hudObjetivo.style.display = 'none';

  euler.setFromQuaternion(camera.quaternion);   // guardamos hacia dónde mira
  pitchInicial = euler.x;
  yawInicial = euler.y;

  if (helicoptero) {
    helicoptero.position.set(EXTRACCION.x, 45, EXTRACCION.z);
    helicoptero.visible = true;
  }
}

function actualizarVictoria(delta) {
  tVictoria += delta;

  // 1) La cámara va mirando hacia arriba (suavizado), durante 3 s
  const k = Math.min(tVictoria / 3, 1);
  const suave = k * k * (3 - 2 * k);
  euler.set(pitchInicial + (1.2 - pitchInicial) * suave, yawInicial, 0, 'YXZ');
  camera.quaternion.setFromEuler(euler);

  // 2) El helicóptero baja desde arriba y se mece un poco
  if (helicoptero) {
    const b = Math.min(tVictoria / 4, 1);
    helicoptero.position.y = 45 - 31 * (1 - (1 - b) * (1 - b));          // de 45 m a 14 m
    helicoptero.rotation.y += delta * 0.3;
    helicoptero.rotation.z = Math.sin(tVictoria * 2) * 0.03;
  }
  if (mixerHeli) mixerHeli.update(delta);

  // 3) A los 2 s empieza el fundido a negro (dura 3 s)
  if (tVictoria > 2) fundido.style.opacity = 1;

  // 4) Cuando ya está oscuro, aparece el mensaje de victoria
  if (tVictoria > 5.2 && !textoMostrado) {
    textoMostrado = true;
    document.querySelector('#finSub').textContent = 'NIVEL COMPLETO';
    document.querySelector('#finTitulo').textContent = '¡MISIÓN COMPLETADA!';
    document.querySelector('#finTitulo').style.color = '#8bc34a';
    document.querySelector('#finTexto').textContent = 'Has llegado a la zona de extracción';
    pantallaFinal.style.display = 'grid';
  }
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  updatePlayer(delta);
  actualizarCajas(clock.elapsedTime);
  if (estado === 'jugando' && controls.isLocked) {   // pausa el juego si sueltas el mouse
    actualizarZombis(delta);
    comprobarExtraccion();
    actualizarObjetivo();
  }
  if (estado === 'victoria') actualizarVictoria(delta);
  farolas[1].intensity = Math.random() < 0.08 ? 0 : 110 + Math.random() * 40;   // la 2.ª parpadea
  renderer.render(scene, camera);
}
animate();   // al FINAL: ahora controls, keys y updatePlayer ya existen

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});