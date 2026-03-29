export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const approach = (current: number, target: number, delta: number): number => {
  if (current < target) {
    return Math.min(current + delta, target);
  }

  return Math.max(current - delta, target);
};
