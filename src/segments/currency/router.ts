import express from "express";
import {updateCurrency} from "./controller";
import {middleware} from "../../middleware";

const router = express.Router();

router.post("/update-currency", middleware, updateCurrency);

export default router;