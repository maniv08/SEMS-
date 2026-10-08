export function formatEnergy(value) {
  if (value == null) return '0.00 kWh';
  return \`\${Number(value).toFixed(2)} kWh\`;
}

export function formatMoney(value) {
  if (value == null) return '₹0.00';
  return \`₹\${Number(value).toFixed(2)}\`;
}
