const enDate = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});
const enDateShort = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const enDateTime = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const enCurrency = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = toDate(value);
  return date ? enDate.format(date) : "-";
}

function formatDateShort(value) {
  const date = toDate(value);
  return date ? enDateShort.format(date) : "-";
}

function formatDateTime(value) {
  const date = toDate(value);
  return date ? enDateTime.format(date) : "-";
}

function formatCurrency(value) {
  return enCurrency.format(Number(value || 0));
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
  if (status === "confirmed") return { text: "Confirmed", className: "badge-blue" };
  if (status === "checked_in") return { text: "Check-in", className: "badge-green" };
  if (status === "checked_out") return { text: "Check-out", className: "badge-gray" };
  if (status === "cancelled") return { text: "Cancelled", className: "badge-red" };
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
