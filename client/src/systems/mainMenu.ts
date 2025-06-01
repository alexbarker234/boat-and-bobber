import { Color, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPixelatedPass } from "three/examples/jsm/postprocessing/RenderPixelatedPass.js";
import { Water } from "../water";
export interface PlayerSettings {
  name: string;
  boatColor: Color;
}

export class MainMenu {
  private menuElement!: HTMLElement;
  private nameInput!: HTMLInputElement;
  private colorPicker!: HTMLInputElement;
  private onStartSingleplayer: (settings: PlayerSettings) => void;
  private playerSettings: PlayerSettings;

  // 3D Scene elements
  private scene!: Scene;
  private camera!: PerspectiveCamera;
  private renderer!: WebGLRenderer;
  private animationId!: number;
  private composer!: EffectComposer;

  constructor(onStartSingleplayer: (settings: PlayerSettings) => void) {
    this.onStartSingleplayer = onStartSingleplayer;
    this.playerSettings = {
      name: "Player",
      boatColor: new Color(0x4a90e2)
    };
    this.createBackground3D();
    this.createMenuHTML();
    this.setupEventListeners();
  }

  private createBackground3D() {
    // Create scene
    this.scene = new Scene();
    this.scene.background = new Color(0x87ceeb); // Sky blue

    // create camera
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, 0);

    // create renderer
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.style.position = "fixed";
    this.renderer.domElement.style.top = "0";
    this.renderer.domElement.style.left = "0";
    this.renderer.domElement.style.zIndex = "-1";
    document.body.appendChild(this.renderer.domElement);

    // post-processing
    this.composer = new EffectComposer(this.renderer);
    const pixelPass = new RenderPixelatedPass(4, this.scene, this.camera);
    this.composer.addPass(pixelPass);

    const water = new Water();
    this.scene.add(water);

    // Handle window resize
    window.addEventListener("resize", () => this.onWindowResize());

    // Start animation
    this.animate();
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);

    // Slowly rotate camera around the scene
    const time = Date.now() * 0.00005;
    this.camera.position.x = Math.cos(time) * 8;
    this.camera.position.z = Math.sin(time) * 8;
    this.camera.lookAt(0, 0, 0);

    this.composer.render();
  };

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private createMenuHTML() {
    this.menuElement = document.createElement("div");
    this.menuElement.className = "main-menu";
    // holy moly i need to not do this in strings somehow
    this.menuElement.innerHTML = `
      <div class="menu-container">
        <h1 class="game-title">Boat & Bobber</h1>
        
        <div class="player-settings">
          <div class="setting-group">
            <label for="player-name">Player Name:</label>
            <input type="text" id="player-name" class="name-input" value="${this.playerSettings.name}" maxlength="20" placeholder="Enter your name" />
          </div>
          
          <div class="setting-group">
            <label for="boat-color">Boat Color:</label>
            <input type="color" id="boat-color" class="color-picker" value="#4a90e2" />
          </div>
        </div>

        <div class="menu-buttons">
          <button class="menu-btn primary" id="singleplayer-btn">Singleplayer</button>
          <button class="menu-btn disabled" id="multiplayer-btn" disabled>Multiplayer</button>
          <button class="menu-btn disabled" id="options-btn" disabled>Options</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.menuElement);
  }

  private setupEventListeners() {
    this.nameInput = this.menuElement.querySelector("#player-name") as HTMLInputElement;
    this.colorPicker = this.menuElement.querySelector("#boat-color") as HTMLInputElement;
    const singleplayerBtn = this.menuElement.querySelector("#singleplayer-btn") as HTMLButtonElement;

    // Name input handler
    this.nameInput.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      this.playerSettings.name = target.value.trim() || "Player";
    });

    // Color picker handler
    this.colorPicker.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const colorValue = target.value;
      this.playerSettings.boatColor = new Color(colorValue);
    });

    // Singleplayer button handler
    singleplayerBtn.addEventListener("click", () => {
      this.startSingleplayer();
    });

    // Enter key to start game
    // TODO move this to input manager
    this.nameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.startSingleplayer();
      }
    });
  }

  private startSingleplayer() {
    // Validate name
    if (!this.playerSettings.name.trim()) {
      this.playerSettings.name = "Player";
      this.nameInput.value = "Player";
    }

    this.hide();
    this.onStartSingleplayer(this.playerSettings);
  }

  public show() {
    this.menuElement.style.display = "flex";
    this.nameInput.focus();
  }

  public hide() {
    this.menuElement.style.display = "none";
  }

  public destroy() {
    // Stop animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Clean up 3D scene
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }

    // Clean up menu HTML
    if (this.menuElement && this.menuElement.parentNode) {
      this.menuElement.parentNode.removeChild(this.menuElement);
    }

    // Remove resize listener
    window.removeEventListener("resize", this.onWindowResize);
  }

  public getPlayerSettings(): PlayerSettings {
    return { ...this.playerSettings };
  }
}
