// src/whatsapp.js
require("dotenv").config();

const API_URL = process.env.FONNTE_API_URL || "https://api.fonnte.com";
const TOKEN = process.env.FONNTE_TOKEN || "";
const TZ_OFFSET = process.env.TZ_OFFSET || "+07:00";

function assertToken() {
  if (!TOKEN) throw new Error("FONNTE_TOKEN kosong. Isi dulu di file .env");
}

function toUnixSecondsJakarta(dateStr, timeStr) {
  const iso = `${dateStr}T${timeStr}:00${TZ_OFFSET}`;
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) throw new Error(`Tanggal/jam invalid: ${iso}`);
  return Math.floor(ms / 1000);
}

async function fonnteSend(payload) {
  assertToken();

  const res = await fetch(`${API_URL}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: TOKEN
    },
    body: JSON.stringify(payload)
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status === false) {
    throw new Error(`Fonnte send gagal: ${JSON.stringify(json)}`);
  }
  return json;
}

async function sendNow(target, message) {
  return fonnteSend({ target, message });
}

async function scheduleSend(target, message, dateStr, timeStr) {
  const schedule = toUnixSecondsJakarta(dateStr, timeStr);
  return fonnteSend({ target, message, schedule });
}

async function cancelMessage(messageId) {
  assertToken();
  const form = new URLSearchParams();
  form.set("id", String(messageId));

  const res = await fetch(`${API_URL}/delete-message`, {
    method: "POST",
    headers: { Authorization: TOKEN },
    body: form
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status === false) {
    throw new Error(`Fonnte delete-message gagal: ${JSON.stringify(json)}`);
  }
  return json;
}

async function rescheduleMessage(messageId, newDateStr, newTimeStr) {
  assertToken();
  const schedule = toUnixSecondsJakarta(newDateStr, newTimeStr);

  const form = new URLSearchParams();
  form.set("id", String(messageId));
  form.set("schedule", String(schedule));
  form.set("byschedule", "false");

  const res = await fetch(`${API_URL}/reset-message`, {
    method: "POST",
    headers: { Authorization: TOKEN },
    body: form
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status === false) {
    throw new Error(`Fonnte reset-message gagal: ${JSON.stringify(json)}`);
  }
  return json;
}

/**
 * Wrapper biar scheduler.js kamu tetap jalan.
 * Karena Fonnte tidak punya "template Meta", kita buat pesan teks dari variables.
 */
async function sendWhatsAppTemplate({ to, templateName, lang, variables }) {
  const provider = (process.env.WHATSAPP_PROVIDER || "fonnte").toLowerCase();

  // kalau kamu mau mode mock:
  if (provider === "mock") {
    console.log("MOCK WA:", { to, templateName, lang, variables });
    return { status: true, mock: true };
  }

  // ubah variables jadi message
  const safeVars = Array.isArray(variables) ? variables : [];
  const message =
    `🔔 Pengingat Imunisasi (${safeVars[6] || "-"})\n` +
    `Orang Tua: ${safeVars[0] || "-"}\n` +
    `Balita: ${safeVars[1] || "-"}\n` +
    `Imunisasi: ${safeVars[2] || "-"}\n` +
    `Jadwal: ${safeVars[3] || "-"}\n` +
    `Lokasi: ${safeVars[4] || "-"}\n` +
    `Kontak Posyandu: ${safeVars[5] || "-"}\n\n` +
    `Mohon datang tepat waktu ya. Terima kasih 🙏`;

  return sendNow(to, message);
}

module.exports = {
  sendNow,
  scheduleSend,
  cancelMessage,
  rescheduleMessage,
  sendWhatsAppTemplate,
  toUnixSecondsJakarta
};
