require("dotenv").config();
const { sendNow } = require("./whatsapp");

(async () => {
  try {
    // GANTI dengan nomor WA kamu sendiri (format 62)
    const target = "6289662835715";
    const message = "Tes koneksi Fonnte dari sistem Posyandu ✅";

    const res = await sendNow(target, message);
    console.log("✅ SUCCESS:", res);
    process.exit(0);
  } catch (err) {
    console.error("❌ FAILED:", err?.message || err);
    process.exit(1);
  }
})();
