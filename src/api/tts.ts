import { Router } from "express";

import { TTSController } from "@/controllers/tts.controller";

const router = Router();
const ttsController = new TTSController();

/**
 * POST /api/tts/bytes
 * Генерация аудио через Text-to-Speech
 */
router.post("/", ttsController.generateBytes);
export default router;
