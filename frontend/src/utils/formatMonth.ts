const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatMonth(yyyyMm: string): string {
  const [yearStr, monthStr] = yyyyMm.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || month < 1 || month > 12) return yyyyMm;
  return `${MONTHS[month - 1]} ${year}`;
}

export function formatMonthRange(from: string, to: string): string {
  if (from === to) return formatMonth(from);

  const [fromYear, fromMonth] = from.split('-').map(Number);
  const [toYear, toMonth] = to.split('-').map(Number);

  if (fromYear === toYear) {
    return `${MONTHS[fromMonth - 1]} – ${MONTHS[toMonth - 1]} ${toYear}`;
  }

  return `${formatMonth(from)} – ${formatMonth(to)}`;
}
