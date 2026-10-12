const STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5]

/** Next preset zoom factor, like the browser's 100% / 110% / 125% ladder. */
export function nextZoom(current: number, action: 'in' | 'out' | 'reset'): number {
  if (action === 'reset') return 1
  let nearest = 0
  STEPS.forEach((s, i) => {
    if (Math.abs(s - current) < Math.abs(STEPS[nearest] - current)) nearest = i
  })
  const next = nearest + (action === 'in' ? 1 : -1)
  return STEPS[Math.max(0, Math.min(STEPS.length - 1, next))]
}
