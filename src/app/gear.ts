/** A 10-tooth gear outline around 0, 0, radius 44, drawn once (the end and loading screens). */
export const gearPath = (() => {
  const teeth = 10;
  const points: string[] = [];
  for (let i = 0; i < teeth * 4; i += 1) {
    const angle = (i / (teeth * 4)) * Math.PI * 2;
    const radius = i % 4 < 2 ? 44 : 34;
    points.push(
      `${(Math.cos(angle) * radius).toFixed(2)} ${(Math.sin(angle) * radius).toFixed(2)}`,
    );
  }
  return `M ${points.join(' L ')} Z`;
})();
