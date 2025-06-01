import { Scene, WebGLRenderer } from "three";
import { RenderPixelatedPass } from "three/addons/postprocessing/RenderPixelatedPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import "./styles/global.css";
import "./styles/mainMenu.css";
import { AssetLoader } from "./systems/assetLoader";
import { CameraController } from "./systems/cameraController";
import { InputManager } from "./systems/inputManager";
import { MainMenu, PlayerSettings } from "./systems/mainMenu";
import { PhysicsManager } from "./systems/physicsManager";
import { SceneManager } from "./systems/sceneManager";
import "./utils/mathExtensions";

let cameraController: CameraController;
let renderer: WebGLRenderer;
let composer: EffectComposer;
let pixelPass: RenderPixelatedPass;
let sceneManager: SceneManager;
let inputManager: InputManager;
let mainMenu: MainMenu;
let gameInitialized = false;

function handleWindowResize() {
  function onWindowResize() {
    if (gameInitialized) {
      cameraController.handleResize();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  window.addEventListener("resize", onWindowResize);
}

function handleCleanup() {
  window.addEventListener("beforeunload", () => {
    if (inputManager) {
      inputManager.destroy();
    }
    if (mainMenu) {
      mainMenu.destroy();
    }
  });
}

async function load() {
  await AssetLoader.getInstance().loadAssets();
}

async function initGame(playerSettings: PlayerSettings) {
  inputManager = InputManager.getInstance();

  const scene = new Scene();
  // init physics before creating objects
  await PhysicsManager.initialize(scene);
  sceneManager = new SceneManager(scene);

  // todo move this somewhere better
  if (sceneManager.boat) {
    sceneManager.boat.setColor(playerSettings.boatColor);
    sceneManager.boat.setPlayerName(playerSettings.name);
  }

  renderer = new WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  cameraController = new CameraController(renderer);
  const camera = cameraController.getCamera();

  // post-processing
  composer = new EffectComposer(renderer);
  pixelPass = new RenderPixelatedPass(4, scene, camera);
  composer.addPass(pixelPass);

  gameInitialized = true;

  function animate() {
    requestAnimationFrame(animate);

    PhysicsManager.getInstance().update();

    sceneManager.updateSceneEntities();

    cameraController.update(sceneManager.boat);

    composer.render();
  }

  animate();
}

async function init() {
  handleWindowResize();
  handleCleanup();
  load();

  mainMenu = new MainMenu((playerSettings: PlayerSettings) => {
    initGame(playerSettings);
  });

  mainMenu.show();
}

init();
