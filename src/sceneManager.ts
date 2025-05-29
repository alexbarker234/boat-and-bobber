import { AmbientLight, DirectionalLight, Fog, Scene, Vector3 } from "three";
import { Boat } from "./boat";
import { DebugCube } from "./debugCube";
import { Entity } from "./objects/entity";
import { Rock } from "./objects/rock";
import { settings } from "./settings";
import { Water } from "./water";

export class SceneManager {
  public static instance: SceneManager;

  private scene: Scene;

  public boat!: Boat;
  private entities: Entity[] = [];

  constructor(scene: Scene) {
    this.scene = scene;

    this.setupSceneSettings();
    this.setupSceneObjects();
  }

  private setupSceneSettings() {
    this.scene.background = settings.fogColor;
    this.scene.fog = new Fog(settings.fogColor, settings.fogNear, settings.fogFar);
  }

  private setupSceneObjects() {
    // Create the debug cube
    const debugCube = new DebugCube();
    this.scene.add(debugCube.getMesh());
    this.entities.push(debugCube);
    // Lights
    this.scene.add(new AmbientLight(0xffffff, 2));
    // The Sun
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
    this.scene.add(sun);

    this.spawnRocks();

    const water = new Water();
    this.scene.add(water);

    this.boat = new Boat(this.scene);
    const boatMesh = this.boat.getMesh();
    this.scene.add(boatMesh);
    this.entities.push(this.boat);
  }

  public updateSceneEntities() {
    for (const entity of this.entities) {
      entity.update();
    }
  }

  private spawnRocks() {
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
        this.scene.add(rockMesh);
        rocks.push(rock);
        this.entities.push(rock);
      }
    }
  }
}
