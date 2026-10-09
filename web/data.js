export function planar2R(theta1, theta2) {
  if (![theta1, theta2].every(Number.isFinite)) throw new TypeError('Angles must be finite');
  const a = theta1 * Math.PI / 180;
  const b = (theta1 + theta2) * Math.PI / 180;
  return {
    elbow: [Math.cos(a), Math.sin(a)],
    tip: [Math.cos(a) + Math.cos(b), Math.sin(a) + Math.sin(b)]
  };
}
