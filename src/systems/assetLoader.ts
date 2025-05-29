import { BufferGeometry, Mesh } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

export class AssetLoader {
  private static instance: AssetLoader;
  private assets: Map<string, BufferGeometry>;
  private loading: boolean;
  private loadPromise: Promise<void> | null;

  private constructor() {
    this.assets = new Map();
    this.loading = false;
    this.loadPromise = null;
  }

  public static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  public async loadAssets(): Promise<void> {
    if (this.loading) {
      return this.loadPromise!;
    }

    this.loading = true;
    this.loadPromise = this.loadAllAssets();
    return this.loadPromise;
  }

  private async loadAllAssets(): Promise<void> {
    const stlLoader = new STLLoader();
    const fbxLoader = new FBXLoader();

    const assetList = [
      { name: "benchy", path: "./assets/Benchy.stl", scale: 0.02, type: "stl" },
      { name: "rocks", path: "./assets/Rocks.fbx", scale: 0.02, type: "fbx" }
    ];

    try {
      const loadPromises = assetList.map(async (asset) => {
        if (asset.type === "stl") {
          const geometry = await this.loadSTL(stlLoader, asset.path);
          this.assets.set(asset.name, geometry);
        } else if (asset.type === "fbx") {
          await this.loadFBX(fbxLoader, asset.path);
        } else {
          throw new Error(`Unsupported asset type: ${asset.type}`);
        }
      });

      await Promise.all(loadPromises);
      this.loading = false;
    } catch (error) {
      console.error("Error loading assets:", error);
      this.loading = false;
      throw error;
    }
  }

  private loadSTL(loader: STLLoader, path: string): Promise<BufferGeometry> {
    return new Promise((resolve, reject) => {
      loader.load(
        path,
        (geometry) => resolve(geometry),
        undefined,
        (error) => reject(error)
      );
    });
  }

  private loadFBX(loader: FBXLoader, path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      loader.load(
        path,
        (fbx) => {
          console.log("FBX loaded:", fbx);

          // Extract geometries from all child meshes
          fbx.traverse((child) => {
            if (child.type === "Mesh") {
              const mesh = child as Mesh;
              if (mesh.geometry && mesh.name) {
                console.log(`Found mesh: ${mesh.name}`);
                this.assets.set(mesh.name, mesh.geometry);
              }
            }
          });

          resolve();
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  public getAsset(name: string): BufferGeometry | undefined {
    return this.assets.get(name);
  }

  public isLoaded(name: string): boolean {
    return this.assets.has(name);
  }
}
