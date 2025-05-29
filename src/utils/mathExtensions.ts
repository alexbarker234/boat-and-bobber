declare global {
  interface Math {
    randBetween(min: number, max: number): number;
  }
}

Math.randBetween = function (min: number, max: number): number {
  return Math.random() * (max - min) + min;
};
