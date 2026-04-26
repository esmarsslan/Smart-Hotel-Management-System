function ensureAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  return next();
}

function injectAuth(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  return next();
}

function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.session.user) {
      return res.redirect("/login");
    }
    const userRole = req.session.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).render("error", {
        layout: "layout",
        pageTitle: "Yetkisiz Erisim",
        pageSub: "",
        flash: null,
        statusCode: 403,
        message: "Bu islemi yapmaya yetkiniz yok.",
        allowedRoles,
        userRole,
      });
    }
    return next();
  };
}

module.exports = { ensureAuth, injectAuth, requireRole };
