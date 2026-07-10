const router = require('express').Router()
const { getPeriodoActivo, getStatusPublico, getAnios, getPeriodos, updatePeriodo, getImportStatus } = require('../controllers/settings.controller')
const { authMiddleware } = require('../middlewares/auth.middleware')
const { roleGuard } = require('../middlewares/roles.middleware')

// Ruta pública — no requiere autenticación, payload mínimo (abierto + mes)
router.get('/status-publico', getStatusPublico)

router.get('/periodo-activo', authMiddleware, getPeriodoActivo)
router.get('/anios', authMiddleware, getAnios)
router.get('/import-status', authMiddleware, getImportStatus)

// Rutas de administración de periodos para perfil 1 y 5
router.get('/periodos', authMiddleware, roleGuard(1, 5), getPeriodos)
router.put('/periodos', authMiddleware, roleGuard(1, 5), updatePeriodo)

module.exports = router
