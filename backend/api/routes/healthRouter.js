const {Router} = require("express");
const checkDb = require("../middlewares/checkDb");
const healthController = require("../controllers/healthController");

const healthRouter = Router();

healthRouter.get("/", checkDb, healthController);

module.exports = healthRouter;