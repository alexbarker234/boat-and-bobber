import { Scene, WebGLRenderer } from "three";
import { RenderPixelatedPass } from "three/addons/postprocessing/RenderPixelatedPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { settings } from "./settings";
import "./styles/global.css";
import "./styles/mainMenu.css";
import "./styles/performanceCounter.css";
import "./styles/playerUI.css";
import { AssetLoader } from "./systems/assetLoader";
import { CameraController } from "./systems/cameraController";
import { GameLoop } from "./systems/gameLoop";
import { InputManager } from "./systems/inputManager";
import { MainMenu, PlayerSettings } from "./systems/mainMenu";
import { NetworkManager } from "./systems/multiplayer/networkManager";
import { PhysicsManager } from "./systems/physicsManager";
import { SceneManager } from "./systems/sceneManager";
import { FPSCounter } from "./ui/fpsCounter";
import "./utils/mathExtensions";

export class Main {
  private static instance: Main;
  private cameraController!: CameraController;
  private renderer!: WebGLRenderer;
  private composer!: EffectComposer;
  private pixelPass!: RenderPixelatedPass;
  private sceneManager!: SceneManager;
  private inputManager!: InputManager;
  private mainMenu!: MainMenu;
  private gameInitialized = false;
  private networkManager!: NetworkManager;
  private gameLoop!: GameLoop;
  private fpsCounter!: FPSCounter;

  private constructor() {}

  public static getInstance(): Main {
    if (!Main.instance) {
      Main.instance = new Main();
    }
    return Main.instance;
  }

  public getNetworkManager() {
    return this.networkManager;
  }

  private handleWindowResize() {
    const onWindowResize = () => {
      if (this.gameInitialized) {
        this.cameraController.handleResize();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener("resize", onWindowResize);
  }

  private handleCleanup() {
    window.addEventListener("beforeunload", () => {
      if (this.gameLoop) {
        this.gameLoop.stop();
      }
      if (this.fpsCounter) {
        this.fpsCounter.destroy();
      }
      if (this.inputManager) {
        this.inputManager.destroy();
      }
      if (this.mainMenu) {
        this.mainMenu.destroy();
      }
    });
  }

  private async load() {
    await AssetLoader.getInstance().loadAssets();
  }

  private async initGame(playerSettings: PlayerSettings) {
    this.inputManager = InputManager.getInstance();

    const scene = new Scene();
    // init physics before creating objects
    await PhysicsManager.initialize(scene);
    this.sceneManager = new SceneManager(scene);

    this.renderer = new WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.cameraController = new CameraController(this.renderer);
    const camera = this.cameraController.getCamera();

    // post-processing
    this.composer = new EffectComposer(this.renderer);
    this.pixelPass = new RenderPixelatedPass(4, scene, camera);
    this.composer.addPass(this.pixelPass);

    if (settings.debug) {
      this.fpsCounter = new FPSCounter();
    }

    this.gameInitialized = true;

    // game loop with update and render callbacks
    this.gameLoop = new GameLoop(
      (deltaTime: number, currentTime: number) => this.update(deltaTime, currentTime),
      () => this.render()
    );

    this.gameLoop.start();

    this.networkManager = new NetworkManager(scene, camera, this.renderer);
    await this.networkManager.connect();

    // todo move this somewhere better
    if (this.sceneManager.boat) {
      this.sceneManager.boat.setColor(playerSettings.boatColor);
      this.sceneManager.boat.setPlayerName(playerSettings.name);
    }
  }

  private update(deltaTime: number, currentTime: number) {
    PhysicsManager.getInstance().update();
    this.sceneManager.updateSceneEntities();
    this.networkManager.update(deltaTime);
    this.cameraController.update(this.sceneManager.boat);

    if (this.fpsCounter) {
      this.fpsCounter.update(this.gameLoop.getCurrentFPS(), this.gameLoop.getCurrentTPS());
    }
  }

  private render() {
    this.networkManager.updateUI();
    this.composer.render();
  }

  public async init() {
    this.handleWindowResize();
    this.handleCleanup();
    this.load();

    this.mainMenu = new MainMenu((playerSettings: PlayerSettings) => {
      this.initGame(playerSettings);
    });

    this.mainMenu.show();
  }
}

Main.getInstance().init();
