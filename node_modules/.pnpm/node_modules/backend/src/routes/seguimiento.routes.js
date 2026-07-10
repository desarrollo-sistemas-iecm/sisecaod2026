const router = require('express').Router()
const { body } = require('express-validator')
const { authMiddleware } = require('../middlewares/auth.middleware')
const { roleGuard } = require('../middlewares/roles.middleware')
const { validateMiddleware } = require('../middlewares/validate.middleware')
const { getAll, getById, save } = require('../controllers/seguimiento.controller')

const saveValidators = [
  body('idActividad').isInt({ min: 1 }).withMessage('idActividad inválido'),
  body('realizo').isIn(['SI', 'NO']).withMessage('realizo debe ser SI o NO'),
  body('observacion').if((value, { req }) => req.body.realizo === 'NO')
    .trim().notEmpty().withMessage('La observación/justificación es requerida cuando no se realiza la actividad'),
  body('tipoDocumento').if((value, { req }) => req.body.realizo === 'SI')
    .trim().notEmpty().withMessage('El tipo de documento es requerido cuando se realizó la actividad'),
  body('numeroDocumento').if((value, { req }) => req.body.realizo === 'SI')
    .trim().notEmpty().withMessage('El número de documento es requerido cuando se realizó la actividad'),
  body('fechaCumplimiento').if((value, { req }) => req.body.realizo === 'SI')
    .trim().notEmpty().withMessage('La fecha de cumplimiento es requerida cuando se realizó la actividad'),
]

router.get('/',             authMiddleware, roleGuard(3, 5), getAll)
router.get('/:idActividad', authMiddleware, roleGuard(3, 5), getById)
router.post('/',            authMiddleware, roleGuard(3, 5), saveValidators, validateMiddleware, save)

module.exports = router
