const router = require("express").Router()

const Controller = require("../controllers/controller")

const controller = new Controller()
router.post("/test", controller.test)

module.exports = router