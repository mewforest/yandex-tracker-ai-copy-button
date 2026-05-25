export function pluralMediaRu(count: number): string {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n1 === 1 && n !== 11) return "медиафайл";
  if (n1 >= 2 && n1 <= 4 && (n < 12 || n > 14)) return "медиафайла";
  return "медиафайлов";
}

export function copySuccessLabel(mediaCount: number): string {
  if (mediaCount <= 0) return "Скопировано ТЗ";
  return `Скопировано ТЗ и ${mediaCount} ${pluralMediaRu(mediaCount)}`;
}
