import { AmbientLight, DirectionalLight, Fog, Scene, Vector3, WebGLRenderer } from "three";
import { RenderPixelatedPass } from "three/addons/postprocessing/RenderPixelatedPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { AssetLoader } from "./assetLoader";
import { Boat } from "./boat";
import { CameraController } from "./cameraController";
import { DebugCube } from "./debugCube";
import { Rock } from "./objects/rock";
import { PhysicsManager } from "./physics/physicsManager";
import { settings } from "./settings";
import "./styles/global.css";
import "./utils/mathExtensions";
import { Water } from "./water";

let boat: Boat;
let cameraController: CameraController;
let debugCube: DebugCube;

// does this even make sense to do
function getPixelSize() {
  const basePixels = 1024 * 576;
  const basePixelSize = 6;
  const currentPixels = window.innerWidth * window.innerHeight;

  // Scale pixel size based on screen width
  const scale = currentPixels / basePixels;
  return Math.clamp(Math.round(basePixelSize * scale), 3, 6);
}

function spawnRocks(scene: Scene) {
  const rockCount = 10;
  const rocks: Rock[] = [];
  const minDistanceFromOrigin = 2.0;
  const minDistanceBetweenRocks = 3.0;
  const placedPositions: Vector3[] = [];

  for (let i = 0; i < rockCount; i++) {
    const size = Math.random() < 0.5 ? "large" : "medium";
    let position: Vector3;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      const x = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 20;
      position = new Vector3(x, 0, z);
      attempts++;
    } while (
      attempts < maxAttempts &&
      (position.length() < minDistanceFromOrigin ||
        placedPositions.some((placed) => position.distanceTo(placed) < minDistanceBetweenRocks))
    );

    // emergency exit!
    if (attempts >= maxAttempts) {
      continue;
    }

    placedPositions.push(position.clone());
    const rock = new Rock(size, position);
    const rockMesh = rock.getMesh();
    if (rockMesh) {
      scene.add(rockMesh);
      rocks.push(rock);
    }
  }
}

async function init() {
  // Load all assets first
  await AssetLoader.getInstance().loadAssets();

  const scene = new Scene();

  // Initialize physics before creating objects
  await PhysicsManager.initialize(scene);

  scene.background = settings.fogColor;
  scene.fog = new Fog(settings.fogColor, settings.fogNear, settings.fogFar);

  cameraController = new CameraController();
  const camera = cameraController.getCamera();

  // Create the debug cube
  debugCube = new DebugCube();
  scene.add(debugCube.getMesh());

  // Lights
  scene.add(new AmbientLight(0xffffff, 2));
  // The Sun
  {
    const sun = new DirectionalLight(0xfff4e6, 1.2);
    sun.position.set(50, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    scene.add(sun);
  }

  spawnRocks(scene);

  const water = new Water();
  scene.add(water);

  boat = new Boat(scene);
  const boatMesh = boat.getMesh();
  if (boatMesh) {
    scene.add(boatMesh);
  }

  const renderer = new WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Setup post-processing
  const composer = new EffectComposer(renderer);
  const pixelPass = new RenderPixelatedPass(getPixelSize(), scene, camera);
  composer.addPass(pixelPass);

  // Handle window resize
  function onWindowResize() {
    cameraController.handleResize();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);

    pixelPass.setPixelSize(getPixelSize());
  }

  window.addEventListener("resize", onWindowResize);

  // Update the animation loop
  function animate() {
    requestAnimationFrame(animate);

    // Update physics world
    PhysicsManager.getInstance().update();

    // Update debug cube
    debugCube.update();

    // Update boat and camera
    boat.update();
    cameraController.update(boat);

    composer.render();
  }

  animate();
}

init();
