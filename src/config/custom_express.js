const express = require("express")
const bodyParser = require("body-parser")
const cors = require('cors')

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())

const miscRoutes = require("../routes/misc")
app.use(miscRoutes)

const errorHandler = require("../middlewares/error_handler")
app.use(errorHandler)

module.exports = app