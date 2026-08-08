export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomDelayMs(minMs: number, maxMs: number): number {
  return Math.round(randomBetween(minMs, maxMs));
}

export function randomArcPath(width: number, height: number): string {
  const startX = randomBetween(0, width * 0.4);
  const startY = randomBetween(0, height * 0.5);
  const controlX = randomBetween(width * 0.3, width * 0.7);
  const controlY = randomBetween(0, height * 0.3);
  const endX = randomBetween(width * 0.6, width);
  const endY = randomBetween(height * 0.4, height);
  return `M ${startX.toFixed(0)} ${startY.toFixed(0)} Q ${controlX.toFixed(0)} ${controlY.toFixed(0)} ${endX.toFixed(0)} ${endY.toFixed(0)}`;
}

export function randomGlistenPosition(): { top: number; left: number } {
  return { top: randomBetween(5, 90), left: randomBetween(5, 90) };
}
