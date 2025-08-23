// routes/voice.routes.ts

import type { Router as RouterType } from "express";

import { Router } from "express";

import { VoiceController } from "@/controllers/voice.controller";

const router: RouterType = Router();
const voiceController = new VoiceController();
/**
 * @swagger
 * tags:
 *   name: Voices
 *   description: API для работы с голосами
 */

/**
 * @swagger
 * /voices:
 *   get:
 *     summary: Получить список голосов
 *     tags: [Voices]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *           example: Bearer your_token_here
 *         description: Токен авторизации
 *       - in: header
 *         name: Cartesia-Version
 *         required: true
 *         schema:
 *           type: string
 *           example: 2025-04-16
 *         description: Версия API
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Количество голосов на странице
 *       - in: query
 *         name: starting_after
 *         schema:
 *           type: string
 *         description: ID голоса для пагинации (начать после)
 *       - in: query
 *         name: ending_before
 *         schema:
 *           type: string
 *         description: ID голоса для пагинации (закончить до)
 *       - in: query
 *         name: is_owner
 *         schema:
 *           type: boolean
 *           example: true
 *         description: Фильтр по владельцу
 *       - in: query
 *         name: is_starred
 *         schema:
 *           type: boolean
 *           example: false
 *         description: Фильтр по избранным голосам
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, neutral]
 *         description: Пол голоса
 *       - in: query
 *         name: expand[]
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [settings, metadata, history]  # примеры значений ExpandField
 *         description: Дополнительные поля для расширения информации
 *     responses:
 *       200:
 *         description: Список голосов успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1"
 *                       name:
 *                         type: string
 *                         example: "Voice 1"
 *                       language:
 *                         type: string
 *                         example: "en-US"
 *       400:
 *         description: Ошибка валидации заголовков или query параметров
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get("/", voiceController.getVoices);

router.get("/:id", voiceController.getVoiceById);

export default router;
