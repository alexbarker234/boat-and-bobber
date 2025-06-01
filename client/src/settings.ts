import { Color } from "three";

export const settings = {
  fogNear: 1.0,
  fogFar: 50.0,
  fogColor: new Color(0xb0eaf2),
  cameraNear: 0.1,
  cameraFar: 1000.0,
  debug: import.meta.env.VITE_DEBUG === "true"
};
