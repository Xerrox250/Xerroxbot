function parseDuration(str) {
  if (!str) return null;
  const match = String(str).toLowerCase().match(/^(\d{1,4})(s|m|h|d)$/);
  if (!match) return null;
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return parseInt(match[1], 10) * units[match[2]];
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (d) parts.push(`${d}j`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(' ');
}

function isValidId(id) {
  return /\d{17,20}/.test(String(id));
}

module.exports = { parseDuration, formatUptime, isValidId };