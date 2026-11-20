export function monthRange(year: number, month: number) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

export function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Senin 00:00 UTC dari minggu yang memuat `date`. */
export function weekRange(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Minggu
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() + diff);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function monthName(month: number) {
  return MONTHS_ID[month - 1] ?? String(month);
}

export function formatDateID(date: Date) {
  return `${date.getUTCDate()} ${monthName(date.getUTCMonth() + 1)} ${date.getUTCFullYear()}`;
}

export function formatShortDateID(date: Date) {
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
}
