// routes/voice.routes.ts

import type { Router as RouterType } from "express";

import { Router } from "express";

import { VoiceController } from "@/controllers/voice.controller";

const router: RouterType = Router();
const voiceController = new VoiceController();

router.get("/", voiceController.getVoices);

router.get("/:id", voiceController.getVoiceById);

export default router;
