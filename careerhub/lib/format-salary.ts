const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatSalaryRange(min: number | null, max: number | null) {
  if (min === null && max === null) return "Salary not listed";
  if (min !== null && max !== null) {
    return `${inrFormatter.format(min)}–${inrFormatter.format(max)} / year`;
  }
  const amount = min ?? max;
  return amount === null
    ? "Salary not listed"
    : `${inrFormatter.format(amount)}+ / year`;
}
