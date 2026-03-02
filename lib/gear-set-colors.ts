export const GEAR_SET_COLORS = [
  "#f59e0b",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
]

export function getGearSetColorByIndex(index: number): string {
  if (index < 0) return "#888"
  return GEAR_SET_COLORS[index % GEAR_SET_COLORS.length]
}
