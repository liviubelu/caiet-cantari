export const CATEGORIES = [
  { value: "Laudă",         color: "#f59e0b", light: "#fffbeb" },
  { value: "Cină",          color: "#3b82f6", light: "#eff6ff" },
  { value: "Paști",         color: "#10b981", light: "#ecfdf5" },
  { value: "Crăciun",       color: "#ef4444", light: "#fef2f2" },
  { value: "Botez",         color: "#a855f7", light: "#faf5ff" },
  { value: "Nuntă",         color: "#ec4899", light: "#fdf2f8" },
  { value: "Înmormântare",  color: "#6b7280", light: "#f9fafb" },
]

export function getCategoryColor(category: string | null | undefined) {
  const cat = CATEGORIES.find((c) => c.value === category)
  return cat ?? CATEGORIES[CATEGORIES.length - 1]
}
