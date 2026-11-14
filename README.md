Operación Extracción: Sobrevive al apocalipsis

Videojuego 3D de disparos en primera persona (FPS) hecho con **Three.js**, HTML5 y JavaScript.
Proyecto de la Evaluación T3 de Computación Gráfica y Visual, UPN.

Eres uno de los últimos sobrevivientes. Debes atravesar una ciudad infestada de zombis, administrar tu munición y llegar a la **zona de extracción** (columna de luz verde) antes de que un zombi te atrape.

.............Autor.............
- Nombre: Yamila Rubí Barrantes Rodríguez
- Código: N00422226
- Curso: Computación Gráfica y Visual
- Docente: GIANCARLO DANIEL CALDERON PEREDA

.............Cómo ejecutar el proyecto.............

El juego carga modelos, texturas y sonidos desde archivos, así que **no funciona abriendo `index.html` con doble clic**. Necesita un servidor local:

**Opción A: Visual Studio Code**
1. Instalar la extensión **Live Server**.
2. Abrir la carpeta del proyecto en VS Code.
3. Clic derecho en `index.html` y elegir **Open with Live Server**.

Opción B: Python (desde una terminal dentro de la carpeta del proyecto)
```
python -m http.server 5500
```
Luego abrir `http://localhost:5500` en el navegador.

No necesita internet: Three.js (r180) viene incluido en la carpeta `libs/`.
Probado en navegadores basados en Chromium.

.............Controles.............

| Control         |         Acción                           |
| Clic en el menú | Comenzar y capturar el mouse             |
| W / A / S / D   | Avanzar / izquierda / retroceder / derecha |
| Mouse           | Orientar la cámara                       |
| Clic izquierdo  | Disparar (un disparo por clic)           |
| 1               | Seleccionar el rifle Mosin Nagant        |
| 2               | Seleccionar la pistola                   |
| Esc             | Pausar (suelta el mouse)                 |

Mantener presionado el clic no dispara en automático.

.............Créditos de recursos externos.............

Los recursos de terceros se usan solo con fines educativos y no comerciales.

Modelos 3D (Sketchfab)

| Uso | Modelo | Autor | Licencia | Enlace |
|---|---|---|---|---|
| Arma 1 | Mosin Nagant 1891 | KusogakiVirus | CC BY-NC 4.0 (no comercial) | https://sketchfab.com/3d-models/mosin-nagant-1891-ca5c87e67a594751a74604eecaf2a335 |
| Arma 2 | Tokyo Marui Strike Warrior .45 | KusogakiVirus | CC BY 4.0 | https://sketchfab.com/3d-models/tokyo-marui-strike-warrior-45-7056d7a4a04146c3b1a6086c25db5503 |
| Zombis | Polyart Zombies with Animations Free Pack | Denys Almaral | Free Standard (Sketchfab) | https://sketchfab.com/3d-models/polyart-zombies-with-animations-free-pack-d9bcfdd88f5348549bc947226af7c314 |
| Helicóptero | Bell Huey helicopter | Duane's Mind | CC Attribution (CC BY) | https://sketchfab.com/3d-models/bell-huey-helicopter-755d8518a06e41b19752c1b54c0da588 |

Modificaciones hechas a los modelos: conversión de glTF a GLB, texturas de las armas reducidas a 1024 px, eliminación de piezas sueltas que venían en el modelo (cargadores y municiones de exhibición), y separación del pack de zombis en un archivo por zombi con su animación.

.............Efectos de sonido (YouTube).............

| Uso | Título del video | Canal | Enlace |
|---|---|---|---|
| Rifle (`sonido_escopeta.mp3`) | Sonido de escopeta USAS-12 | juegos30 | https://youtu.be/gyoBsVT6r-o|
| Pistola (`sonido_pistola.mp3`) | Efectos de Sonido, Disparos de Escopeta, Pistola y Revolver | Zonia Cantor | https://youtu.be/_4HY1tYbgq0 |
| Sin balas (`sonido_sinbalas.mp3`) | Sonido de Pistola sin Balas Clic - Efecto de Sonido | Sonidos Chingones FX | https://youtu.be/4bnr6vWHL14 |
| Recoger balas (`sonido_recogerbalas.mp3`) | Sonido de Recolectar Objetos // Videojuegos Efecto de Sonido | World Ambient Sounds | https://youtu.be/4PzPQi-b6lI |
| Zombi (`sonido_zombie.mp3`) | Zombie Sonido Efecto - Zombie Sound Effect | Sonidos | https://youtu.be/h21yB21MfxE |
| Misión completada (`sonido_levelcompletado.mp3`) | Geometry Dash Level Complete Sound Effect | Petabyte Apocalypse | https://youtu.be/bfbFE4Ld848 |
| Game Over (`sonido_gameover.mp3`) | Sonido de Juego Finalizado (Game Over) // Videojuegos Efecto de Sonido | World Ambient Sounds | https://youtu.be/P2MAdCE52h8 |

El sonido de misión completada proviene del videojuego Geometry Dash (RobTop Games) y se usa solo con fines educativos. (por ahora xd)

.............Texturas.............
| Archivo | Fuente / autor | Licencia |
|---|---|---|
| `suelo.jpg` | "Pared de cemento estropeada", lachetas (Magnific) — https://www.magnific.com/es/foto-gratis/pared-cemento-estropeada_1051036.htm | Licencia gratuita de Magnific |
| `textura_edificio1.jpg` | "Fotografía de un edificio de ladrillo con ventanas", Brett Sayles (Pexels) — https://www.pexels.com/es-es/foto/fotografia-de-un-edificio-de-ladrillo-con-ventanas-11556594/ | Licencia de Pexels |
| `textura_edificio2.jpg` | "Fachada de un edificio histórico de ladrillo en Varsovia", Kamil Trzykowski (Pexels) — https://www.pexels.com/es-es/foto/fachada-de-un-edificio-historico-de-ladrillo-en-varsovia-37646037/ | Licencia de Pexels |
| `textura_contenedor.jpg` | "Desprendimiento de pintura en la superficie metálica envejecida", Magnific — https://www.magnific.com/es/foto-gratis/desprendimiento-pintura-superficie-metalica-envejecida_6398821.htm | Licencia gratuita de Magnific |
| `textura_barril.jpg` | "Superficie de metal oxidado con pintura", Magnific — https://www.magnific.com/es/foto-gratis/superficie-metal-oxidado-pintura_6415059.htm | Licencia gratuita de Magnific |

Texturas del suelo, edificios y contenedor reducidas de resolución para mejorar el rendimiento.
Texturas reducidas a 1024 px para mejorar el rendimiento. En textura_edificio2.jpg se retocó un grafiti de la foto original.”

.............Librerías.............

- [Three.js](https://threejs.org/) r180, licencia MIT.
