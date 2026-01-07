const bcrypt = require("bcrypt");
const { db } = require("./db");

function requireAuth(req, res, next) {
  if (req.session?.user) return next();
  return res.redirect("/login");
}

async function handleLogin(req, res) {
  const { username, password } = req.body;
  const user = db.prepare(`SELECT * FROM admin_users WHERE username=?`).get(username);

  if (!user) return res.render("login", { error: "Username / password salah" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.render("login", { error: "Username / password salah" });

  req.session.user = { id: user.id, username: user.username };
  res.redirect("/");
}

function handleLogout(req, res) {
  req.session.destroy(() => res.redirect("/login"));
}

module.exports = { requireAuth, handleLogin, handleLogout };