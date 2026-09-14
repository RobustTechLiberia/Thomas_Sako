const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const s = String(value);
  const normalized = s.includes(" ") && !s.includes("T") ? s.replace(" ", "T") : s;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const fmtDate = (value) => {
  const d = toDate(value);
  return d ? d.toLocaleDateString() : "—";
};

export const fmtDateTime = (value) => {
  const d = toDate(value);
  return d ? d.toLocaleString() : "—";
};

export default { fmtDate, fmtDateTime };