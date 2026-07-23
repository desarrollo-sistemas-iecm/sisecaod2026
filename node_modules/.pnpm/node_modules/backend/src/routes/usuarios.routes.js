const router = require('express').Router()
const { body, param } = require('express-validator')
const { authMiddleware } = require('../middlewares/auth.middleware')
const { roleGuard } = require('../middlewares/roles.middleware')
const { validateMiddleware } = require('../middlewares/validate.middleware')
const { getAll, create, update, remove, desconectar } = require('../controllers/usuarios.controller')

const userValidators = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('usuario').trim().notEmpty().withMessage('El usuario es requerido'),
  body('perfil').isInt({ min: 1, max: 5 }).withMessage('Perfil inválido'),
]

router.use(authMiddleware)
router.use(roleGuard(5))

router.get('/', getAll)

router.post('/',
  userValidators,
  body('contrasena').trim().notEmpty().withMessage('La contraseña es requerida'),
  validateMiddleware,
  create
)

router.put('/:id',
  param('id').isInt(),
  userValidators,
  validateMiddleware,
  update
)

router.put('/:id/desconectar',
  param('id').isInt(),
  validateMiddleware,
  desconectar
)

router.delete('/:id',
  param('id').isInt(),
  validateMiddleware,
  remove
)

module.exports = router
