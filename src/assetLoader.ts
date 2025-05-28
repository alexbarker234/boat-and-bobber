import { BufferGeometry } from "three";
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
    const loader = new STLLoader();

    const assetList = [
      { name: "benchy", path: "./assets/Benchy.stl" }
      // Add more assets here as needed
    ];

    try {
      const loadPromises = assetList.map(async (asset) => {
        const geometry = await this.loadSTL(loader, asset.path);
        this.assets.set(asset.name, geometry);
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

  public getAsset(name: string): BufferGeometry | undefined {
    return this.assets.get(name);
  }

  public isLoaded(name: string): boolean {
    return this.assets.has(name);
  }
}
