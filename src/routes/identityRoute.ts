import { Router } from "express";
import { identifyHandler } from "../controllers/identityController";

const router = Router();

router.post("/", identifyHandler);

export default router;
