const sendSuccess = (res, data, message = 'OK', status = 200) =>
  res.status(status).json({ success: true, message, data })

const sendError = (res, message = 'Error interno', status = 500) =>
  res.status(status).json({ success: false, message, data: null })

module.exports = { sendSuccess, sendError }
