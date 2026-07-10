const roleGuard = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No autenticado', data: null })
  }
  if (!roles.includes(req.user.perfil)) {
    return res.status(403).json({ success: false, message: 'Acceso denegado: perfil sin permisos', data: null })
  }
  next()
}

module.exports = { roleGuard }
