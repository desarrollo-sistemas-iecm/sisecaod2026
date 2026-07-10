const router = require('express').Router()
const { body, param } = require('express-validator')
const multer = require('multer')
const path = require('path')
const { authMiddleware } = require('../middlewares/auth.middleware')
const { roleGuard } = require('../middlewares/roles.middleware')
const { validateMiddleware } = require('../middlewares/validate.middleware')
const {
  getAll, getById, create, update, remove, getResponsables, importar, importarDesfase
} = require('../controllers/catalogo.controller')

// ... (configuración de multer y validators se mantienen iguales)
// Reemplazando directamente las rutas de abajo para no duplicar código
const fs = require('fs')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/actividades')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const d = new Date()
    const pad = (num) => String(num).padStart(2, '0')
    const dateStr = `${pad(d.getDate())}_${pad(d.getMonth() + 1)}_${d.getFullYear()}`
    const timeStr = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
    cb(null, `${dateStr}_${timeStr}${path.extname(file.originalname)}`)
  }
})
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.xls', '.xlsx']
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()))
  },
  limits: { fileSize: 10 * 1024 * 1024 }
})

const createValidators = [
  body('clave').trim().notEmpty().withMessage('La clave es requerida'),
  body('actividad').trim().notEmpty().withMessage('La actividad es requerida'),
  body('tipoActividad').notEmpty().withMessage('El tipo de actividad es requerido'),
  body('responsable').trim().notEmpty().withMessage('El responsable es requerido'),
  body('soporte').trim().notEmpty().withMessage('El soporte de cumplimiento es requerido'),
  body('numero').trim().notEmpty().withMessage('El número es requerido'),
  body('mes').isInt({ min: 1, max: 12 }).withMessage('El mes debe ser entre 1 y 12'),
  body('periodoinicia').notEmpty().withMessage('La fecha de inicio es requerida'),
  body('periodofin').notEmpty().withMessage('La fecha de fin es requerida'),
]

router.get('/responsables', authMiddleware, getResponsables)
router.get('/',    authMiddleware, getAll)
router.get('/:id', authMiddleware, param('id').isInt(), validateMiddleware, getById)
router.post('/',   authMiddleware, roleGuard(1, 4), createValidators, validateMiddleware, create)
router.put('/:id', authMiddleware, roleGuard(1, 4), param('id').isInt(), validateMiddleware, update)
router.delete('/:id', authMiddleware, roleGuard(1), param('id').isInt(), validateMiddleware, remove)
router.post('/importar', authMiddleware, roleGuard(1, 5), upload.single('excel'), importar)
router.post('/importar-desfase', authMiddleware, roleGuard(5), upload.single('excel'), importarDesfase)

module.exports = router
