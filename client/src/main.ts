import { Scene, WebGLRenderer } from "three";
import { RenderPixelatedPass } from "three/addons/postprocessing/RenderPixelatedPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import "./styles/global.css";
import { AssetLoader } from "./systems/assetLoader";
import { CameraController } from "./systems/cameraController";
import { PhysicsManager } from "./systems/physicsManager";
import { SceneManager } from "./systems/sceneManager";
import "./utils/mathExtensions";

let cameraController: CameraController;
let renderer: WebGLRenderer;
let composer: EffectComposer;
let pixelPass: RenderPixelatedPass;
let sceneManager: SceneManager;

// does this even make sense to do
function getPixelSize() {
  const basePixels = 1024 * 576;
  const basePixelSize = 6;
  const currentPixels = window.innerWidth * window.innerHeight;

  // Scale pixel size based on screen width
  const scale = currentPixels / basePixels;
  return Math.clamp(Math.round(basePixelSize * scale), 3, 6);
}

function handleWindowResize() {
  function onWindowResize() {
    cameraController.handleResize();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);

    pixelPass.setPixelSize(getPixelSize());
  }

  window.addEventListener("resize", onWindowResize);
}

async function init() {
  // load all assets first
  await AssetLoader.getInstance().loadAssets();

  const scene = new Scene();
  // init physics before creating objects
  await PhysicsManager.initialize(scene);
  sceneManager = new SceneManager(scene);

  renderer = new WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  cameraController = new CameraController(renderer);
  const camera = cameraController.getCamera();

  // post-processing
  composer = new EffectComposer(renderer);
  pixelPass = new RenderPixelatedPass(getPixelSize(), scene, camera);
  composer.addPass(pixelPass);

  handleWindowResize();

  function animate() {
    requestAnimationFrame(animate);

    PhysicsManager.getInstance().update();

    sceneManager.updateSceneEntities();

    cameraController.update(sceneManager.boat);

    composer.render();
  }

  animate();
}

init();
