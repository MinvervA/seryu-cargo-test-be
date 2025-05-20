import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const { sallaryRoute } = require("./routes");

app.use("/v1/salary/driver", sallaryRoute);

export default app;
