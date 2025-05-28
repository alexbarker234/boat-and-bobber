import { AmbientLight, DirectionalLight, Fog, Scene, Vector2, WebGLRenderer } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { AssetLoader } from "./assetLoader";
import { Boat } from "./boat";
import { CameraController } from "./cameraController";
import { DebugCube } from "./debugCube";
import RenderPixelatedPass from "./Passes/renderPixelatePass";
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
  scene.background = settings.fogColor;
  scene.fog = new Fog(settings.fogColor, settings.fogNear, settings.fogFar);

  cameraController = new CameraController();
  const camera = cameraController.getCamera();

  // Create the debug cube
  debugCube = new DebugCube();
  scene.add(debugCube.getMesh());

  // Lights
  scene.add(new AmbientLight(0xffffff, 2));
  {
    const directionalLight = new DirectionalLight(0xfffc9c, 0.5);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    // directionalLight.shadow.radius = 0
    directionalLight.shadow.mapSize.set(2048, 2048);
    scene.add(directionalLight);
  }
  {
    const directionalLight = new DirectionalLight(0x00fffc, 0.9);
    directionalLight.position.set(1, 0.25, 0);
    scene.add(directionalLight);
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
