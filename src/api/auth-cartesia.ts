// routes/auth.routes.ts

import { Router } from "express";

import { AuthCartesiaController } from "@/controllers/auth-cartesia.controller";

const router: Router = Router();
const authController = new AuthCartesiaController();

/**
 * @route POST /auth/access-token
 * @description Генерация нового токена доступа с кастомными разрешениями
 * @access Private (требует Authorization token)
 * @headers
 *   - Authorization: Bearer <auth_token>
 *   - Cartesia-Version: 2025-04-16
 * @body
 *   - permissions: { tts?: boolean, stt?: boolean }
 *   - expires_in: number (1-3600 seconds)
 * @returns
 *   - access_token: string
 *   - token_type: string
 *   - expires_in: number
 *   - expires_at: string (ISO timestamp)
 *   - permissions: object
 */
router.post("/access-token", authController.generateAccessToken);

/**
 * @route POST /auth/access-token/tts
 * @description Быстрое создание токена только для TTS
 * @access Private (требует Authorization token)
 * @headers
 *   - Authorization: Bearer <auth_token>
 *   - Cartesia-Version: 2025-04-16
 * @body
 *   - expires_in?: number (1-3600 seconds, default: 3600)
 */
router.post("/access-token/tts", authController.generateTTSToken);

/**
 * @route POST /auth/access-token/stt
 * @description Быстрое создание токена только для STT
 * @access Private (требует Authorization token)
 * @headers
 *   - Authorization: Bearer <auth_token>
 *   - Cartesia-Version: 2025-04-16
 * @body
 *   - expires_in?: number (1-3600 seconds, default: 3600)
 */
router.post("/access-token/stt", authController.generateSTTToken);

/**
 * @route POST /auth/access-token/full
 * @description Быстрое создание токена с полными правами (TTS + STT)
 * @access Private (требует Authorization token)
 * @headers
 *   - Authorization: Bearer <auth_token>
 *   - Cartesia-Version: 2025-04-16
 * @body
 *   - expires_in?: number (1-3600 seconds, default: 3600)
 */
router.post("/access-token/full", authController.generateFullPermissionsToken);

/**
 * @route POST /auth/validate-token
 * @description Валидация токена доступа
 * @access Public
 * @body
 *   - access_token: string
 *   - expires_at?: string (ISO timestamp)
 * @returns
 *   - valid: boolean
 *   - is_expired: boolean
 *   - permissions: object | null
 *   - checked_at: string (ISO timestamp)
 */
router.post("/validate-token", authController.validateAccessToken);

export default router;
