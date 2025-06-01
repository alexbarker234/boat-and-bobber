import { Color } from "three";
import { PlayerSettings } from "./mainMenu";

interface SaveData {
  playerName: string;
  boatColor: string;
  version: number;
}

export class SaveManager {
  private static instance: SaveManager;
  private readonly SAVE_KEY = "boatAndBobber_playerSettings";
  private readonly SAVE_VERSION = 1;

  private constructor() {}

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  public savePlayerSettings(settings: PlayerSettings): void {
    try {
      const saveData: SaveData = {
        playerName: settings.name,
        boatColor: `#${settings.boatColor.getHexString()}`,
        version: this.SAVE_VERSION
      };

      localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));
      console.log("Player settings saved successfully");
    } catch (error) {
      console.error("Failed to save player settings:", error);
    }
  }

  public loadPlayerSettings(): PlayerSettings | null {
    try {
      const savedData = localStorage.getItem(this.SAVE_KEY);
      if (!savedData) {
        console.log("No saved player settings found");
        return null;
      }

      const saveData: SaveData = JSON.parse(savedData);

      // Check version compatibility
      if (saveData.version !== this.SAVE_VERSION) {
        console.log("Save data version mismatch, using defaults");
        return null;
      }

      const playerSettings: PlayerSettings = {
        name: saveData.playerName || "Player",
        boatColor: new Color(saveData.boatColor || "#4a90e2")
      };

      console.log("Player settings loaded successfully");
      return playerSettings;
    } catch (error) {
      console.error("Failed to load player settings:", error);
      return null;
    }
  }

  public clearPlayerSettings(): void {
    try {
      localStorage.removeItem(this.SAVE_KEY);
      console.log("Player settings cleared");
    } catch (error) {
      console.error("Failed to clear player settings:", error);
    }
  }

  public hasPlayerSettings(): boolean {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  }

  // Utility method to get default settings
  public getDefaultPlayerSettings(): PlayerSettings {
    return {
      name: "Player",
      boatColor: new Color(0x4a90e2)
    };
  }
}
