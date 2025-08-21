function requireRole(role) {
  return function (req, res, next) {
    if (!req.session || !req.session.user) {
      return res.redirect(`/${role}/login`);
    }
    if (role && req.session.user.role !== role) {
      return res.status(403).send('No autorizado');
    }
    next();
  };
}

module.exports = { requireRole };

