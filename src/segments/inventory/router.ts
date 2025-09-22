import express from "express";
import {middleware} from "../../middleware";
import {updateInventory} from "./controller";

const router = express.Router();

router.post("/update-inventory", middleware, updateInventory);

export default router;