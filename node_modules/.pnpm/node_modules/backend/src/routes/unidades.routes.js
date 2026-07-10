const router = require('express').Router()
const { body, param } = require('express-validator')
const { authMiddleware }    = require('../middlewares/auth.middleware')
const { roleGuard }         = require('../middlewares/roles.middleware')
const { validateMiddleware } = require('../middlewares/validate.middleware')
const { getAll, getActivas, create, update } = require('../controllers/unidades.controller')

// Todos los endpoints de unidades son exclusivos de perfil 5 (superadmin)
// Perfil 4 NO necesita consultar el catálogo — su unidad ya está asignada en BD
router.use(authMiddleware)
router.use(roleGuard(5))

router.get('/',        getAll)
router.get('/activas', getActivas)

router.post('/',
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('clave').trim().notEmpty().isLength({ min: 1, max: 2 }).withMessage('La clave debe tener máximo 2 caracteres (ej. SA, OT)'),
  validateMiddleware,
  create
)

router.put('/:id',
  param('id').isInt().withMessage('ID inválido'),
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('clave').trim().notEmpty().isLength({ min: 1, max: 2 }).withMessage('La clave debe tener máximo 2 caracteres (ej. SA, OT)'),
  body('status').isInt({ min: 0, max: 1 }).withMessage('Status inválido'),
  validateMiddleware,
  update
)

module.exports = router
