function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/auth/connexion");
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect("/auth/connexion");
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).render("erreur", {
        title: "Accès refusé",
        message: "Tu n'as pas les droits pour accéder à cette page.",
      });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
