import express from "express";
import { addAgent, getAgents } from "../controllers/agentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/", protect, addAgent);
router.get("/", protect, getAgents);
export default router;
