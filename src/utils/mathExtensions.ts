declare global {
  interface Math {
    randBetween(min: number, max: number): number;
    clamp(value: number, min: number, max: number): number;
    degreesToRadians(degrees: number): number;
  }
}

Math.randBetween = function (min: number, max: number): number {
  return Math.random() * (max - min) + min;
};

Math.clamp = function (value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
};

Math.degreesToRadians = function (degrees: number): number {
  return degrees * (Math.PI / 180);
};
