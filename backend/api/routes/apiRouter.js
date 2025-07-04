const {Router} = require("express");
const checkDb = require("../middlewares/checkDb");
const averageSpeed = require("../controllers/averageSpeedController")

const apiRouter = Router();

apiRouter.get("/average-speed", checkDb, averageSpeed);

module.exports = apiRouter;