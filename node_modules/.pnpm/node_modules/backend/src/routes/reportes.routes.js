const router = require('express').Router()
const { query: qParam } = require('express-validator')
const { authMiddleware } = require('../middlewares/auth.middleware')
const { roleGuard } = require('../middlewares/roles.middleware')
const { validateMiddleware } = require('../middlewares/validate.middleware')
const { 
  getCentral, getDistrito, getPendientes, getAvance, getHistorico,
  getAvanceDistritos, getAvanceActividades, getAvanceGrafica,
  getAvanceDistritosExcel, getAvanceActividadesExcel, getACapturar,
  descargarHistorico
} = require('../controllers/reportes.controller')

const reporteValidators = [
  qParam('mes').optional().isInt({ min: 1, max: 12 }).withMessage('Mes inválido'),
  qParam('anio').optional().isInt({ min: 2019 }).withMessage('Año inválido'),
]

router.get('/central',    authMiddleware, roleGuard(1, 4, 5), reporteValidators, validateMiddleware, getCentral)
router.get('/distrito',   authMiddleware, reporteValidators, validateMiddleware, getDistrito)
router.get('/pendientes', authMiddleware, reporteValidators, validateMiddleware, getPendientes)
router.get('/a-capturar', authMiddleware, roleGuard(1, 2, 3, 5), reporteValidators, validateMiddleware, getACapturar)
router.get('/avance',     authMiddleware, reporteValidators, validateMiddleware, getAvance)
router.get('/avance-distritos',   authMiddleware, roleGuard(1, 4, 5), getAvanceDistritos)
router.get('/avance-actividades', authMiddleware, roleGuard(1, 4, 5), getAvanceActividades)
router.get('/avance-grafica',     authMiddleware, roleGuard(1, 4, 5), getAvanceGrafica)
router.get('/avance-distritos-excel',   authMiddleware, roleGuard(1, 4, 5), getAvanceDistritosExcel)
router.get('/avance-actividades-excel', authMiddleware, roleGuard(1, 4, 5), getAvanceActividadesExcel)
router.get('/historico',  authMiddleware, validateMiddleware, getHistorico)
router.get('/descargar-historico/:anio', authMiddleware, descargarHistorico)

module.exports = router

