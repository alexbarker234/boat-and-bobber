import { Vector3 } from "three";

export interface Fish {
  id: string;
  position: Vector3;
  type: "common" | "rare" | "legendary";
  biteChance: number;
  escapeTime: number; // Time in seconds before fish escapes if not caught
}

const fishTypes: Array<{ type: Fish["type"]; chance: number; biteChance: number; escapeTime: number }> = [
  { type: "common", chance: 0.7, biteChance: 0.8, escapeTime: 10 },
  { type: "rare", chance: 0.25, biteChance: 0.5, escapeTime: 8 },
  { type: "legendary", chance: 0.05, biteChance: 0.2, escapeTime: 5 }
];

export class FishManager {
  constructor() {}

  public checkForBite(): Fish {
    // First determine what type of fish we'll catch
    const rand = Math.random();
    let cumulativeChance = 0;
    let selectedType = fishTypes[0];

    for (const fishType of fishTypes) {
      cumulativeChance += fishType.chance;
      if (rand <= cumulativeChance) {
        selectedType = fishType;
        break;
      }
    }

    // If it's not rare or legendary, make it common
    if (selectedType.type !== "rare" && selectedType.type !== "legendary") {
      selectedType = fishTypes[0];
    }

    const fish: Fish = {
      id: Math.random().toString(36).substr(2, 9),
      position: new Vector3(0, 0, 0),
      type: selectedType.type,
      biteChance: selectedType.biteChance,
      escapeTime: selectedType.escapeTime
    };

    return fish;
  }
}
