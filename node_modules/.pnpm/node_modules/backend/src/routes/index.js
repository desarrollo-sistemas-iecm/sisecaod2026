const router = require('express').Router()

router.use('/auth',        require('./auth.routes'))
router.use('/settings',    require('./settings.routes'))
router.use('/catalogo',    require('./catalogo.routes'))
router.use('/seguimiento', require('./seguimiento.routes'))
router.use('/reportes',    require('./reportes.routes'))
router.use('/usuarios',    require('./usuarios.routes'))
router.use('/unidades',    require('./unidades.routes'))


module.exports = router
