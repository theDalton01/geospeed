const { Router } = require("express");
const libspeedProxy = require("../controllers/proxyController");

const libspeedRouter = Router();

libspeedRouter.all("/", libspeedProxy);

module.exports = libspeedRouter;