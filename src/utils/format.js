const trDate = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});
const trDateShort = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const trDateTime = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const trCurrency = new Intl.NumberFormat("tr-TR", {
  maximumFractionDigits: 0,
});

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = toDate(value);
  return date ? trDate.format(date) : "-";
}

function formatDateShort(value) {
  const date = toDate(value);
  return date ? trDateShort.format(date) : "-";
}

function formatDateTime(value) {
  const date = toDate(value);
  return date ? trDateTime.format(date) : "-";
}

function formatCurrency(value) {
  return trCurrency.format(Number(value || 0));
}

function toInputDate(value) {
  const date = toDate(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStatusBadge(status) {
  if (status === "confirmed") return { text: "Onayli", className: "badge-blue" };
  if (status === "checked_in") return { text: "Check-in", className: "badge-green" };
  if (status === "checked_out") return { text: "Check-out", className: "badge-gray" };
  if (status === "cancelled") return { text: "Iptal", className: "badge-red" };
  return { text: status || "-", className: "badge-gray" };
}

module.exports = {
  formatDate,
  formatDateShort,
  formatDateTime,
  formatCurrency,
  toInputDate,
  getStatusBadge,
};
