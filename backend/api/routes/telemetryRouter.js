const { Router } = require("express");
const multer = require('multer');
const telemetryController = require("../controllers/telemetryController");
const checkDb = require("../middlewares/checkDb");

const router = Router();
const upload = multer();

// telemetry route
router.post("/", checkDb, upload.none(), telemetryController);

module.exports = router;