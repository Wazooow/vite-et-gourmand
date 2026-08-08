const nodemailer = require("nodemailer");

let transporterPromise;

// En dev, si aucun MAIL_HOST n'est configuré dans .env, on utilise un compte
// de test Ethereal (créé automatiquement) : les emails ne partent pas
// vraiment, mais chaque envoi donne une URL de prévisualisation en console.
function getTransporter() {
  if (transporterPromise) return transporterPromise;

  if (process.env.MAIL_HOST) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      })
    );
  } else {
    console.log(
      "Aucun MAIL_HOST configuré : utilisation d'un compte de test Ethereal (emails non réellement envoyés)."
    );
    transporterPromise = nodemailer.createTestAccount().then((account) =>
      nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      })
    );
  }
  return transporterPromise;
}

async function sendMail({ to, subject, html }) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || '"Vite & Gourmand" <no-reply@vite-et-gourmand.fr>',
    to,
    subject,
    html,
  });
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) console.log("Aperçu email :", previewUrl);
  return info;
}

module.exports = { sendMail };
