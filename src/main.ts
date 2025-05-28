import { AmbientLight, DirectionalLight, Fog, Scene, Vector2, Vector3, WebGLRenderer } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { AssetLoader } from "./assetLoader";
import { Boat } from "./boat";
import { CameraController } from "./cameraController";
import { DebugCube } from "./debugCube";
import { Rock } from "./objects/rock";
import RenderPixelatedPass from "./Passes/renderPixelatePass";
import { PhysicsManager } from "./physics/physicsManager";
import { settings } from "./settings";
import { Water } from "./water";

let screenResolution = new Vector2(window.innerWidth, window.innerHeight);
let renderResolution = screenResolution.clone().divideScalar(3);

let boat: Boat;
let cameraController: CameraController;
let debugCube: DebugCube;

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

  // Create rocks
  const rockCount = 10;
  const rocks: Rock[] = [];
  for (let i = 0; i < rockCount; i++) {
    const size = Math.random() < 0.5 ? "large" : "medium";
    const x = (Math.random() - 0.5) * 20;
    const z = (Math.random() - 0.5) * 20;
    const position = new Vector3(x, 0, z);
    const rock = new Rock(size, position);
    const rockMesh = rock.getMesh();
    if (rockMesh) {
      scene.add(rockMesh);
      rocks.push(rock);
    }
  }

  const water = new Water();
  scene.add(water);

  boat = new Boat();
  const boatMesh = boat.getMesh();
  if (boatMesh) {
    scene.add(boatMesh);
  }

  const renderer = new WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Setup post-processing
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPixelatedPass(renderResolution, scene, camera));

  // Handle window resize
  function onWindowResize() {
    cameraController.handleResize();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);

    // Update screen resolution
    screenResolution.set(window.innerWidth, window.innerHeight);
    renderResolution = screenResolution.clone().divideScalar(3);
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
