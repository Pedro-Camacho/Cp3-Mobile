export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString('pt-BR')} ${formatTime(timestamp)}`;
}

export function formatNumber(value: number, fractionDigits = 1): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}
