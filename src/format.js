const UNITS = ["B", "KB", "MB", "GB", "TB"];

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes === 0) return "0 B";
  const exponent = Math.min(Math.floor(Math.log2(bytes) / 10), UNITS.length - 1);
  const value = bytes / 1024 ** exponent;
  const precision = value >= 100 || exponent === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${UNITS[exponent]}`;
}

const colorsEnabled = process.stdout.isTTY && !process.env.NO_COLOR;

function wrap(code) {
  return (text) => (colorsEnabled ? `\u001b[${code}m${text}\u001b[0m` : text);
}

export const color = {
  red: wrap(31),
  green: wrap(32),
  yellow: wrap(33),
  cyan: wrap(36),
  bold: wrap(1),
  dim: wrap(2),
};
