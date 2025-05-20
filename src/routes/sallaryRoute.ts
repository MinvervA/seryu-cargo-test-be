import express from "express";

const router = express.Router();
const { sallaryController } = require("../controllers");

router.get("/list", sallaryController.getDriverSalaries);

module.exports = router;
