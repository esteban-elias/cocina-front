export function formatPrice(value?: number | null): string {
  if (value == null || Number.isNaN(value)) {
    return '$-';
  }

  const formatted = value.toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return `$${formatted}`;
}
