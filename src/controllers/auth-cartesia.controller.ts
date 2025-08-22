// controllers/auth-cartesia.controller.ts

import type { NextFunction, Request, Response } from "express";

import type { GenerateTokenRequest, TokenPermissions } from "@/interfaces/auth-cartesia.types";

import { AuthValidationError } from "@/interfaces/auth-cartesia.types";
import { AuthCartesiaService } from "@/services/auth-cartesia.service";

export class AuthCartesiaController {
  private authService: AuthCartesiaService;

  constructor() {
    this.authService = new AuthCartesiaService();
  }

  /**
   * Извлечение токена авторизации из заголовков
   */
  private extractAuthToken(req: Request): string {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthValidationError("Authorization header is required");
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new AuthValidationError("Authorization header must start with \"Bearer \"");
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    if (!token) {
      throw new AuthValidationError("Authorization token is required");
    }

    return token;
  }

  /**
   * Валидация версии API
   */
  private validateApiVersion(req: Request): void {
    const version = req.headers["cartesia-version"];

    if (!version) {
      throw new AuthValidationError("Cartesia-Version header is required");
    }

    if (version !== "2025-04-16") {
      throw new AuthValidationError("Invalid Cartesia-Version. Expected: 2025-04-16");
    }
  }

  /**
   * Валидация и парсинг тела запроса
   */
  private parseAndValidateRequestBody(req: Request): GenerateTokenRequest {
    const { permissions, expires_in } = req.body;
    if (!permissions) {
      throw new AuthValidationError("permissions field is required in request body");
    }

    if (expires_in === undefined) {
      throw new AuthValidationError("expires_in field is required in request body");
    }

    // Парсинг expires_in
    const expiresIn = Number.parseInt(expires_in, 10);
    if (Number.isNaN(expiresIn)) {
      throw new AuthValidationError("expires_in must be a valid integer");
    }

    // Парсинг permissions
    const parsedPermissions: TokenPermissions = {};
    if (permissions.tts !== undefined) {
      if (typeof permissions.tts !== "boolean") {
        throw new AuthValidationError("permissions.tts must be a boolean");
      }
      parsedPermissions.tts = permissions.tts;
    }

    if (permissions.stt !== undefined) {
      if (typeof permissions.stt !== "boolean") {
        throw new AuthValidationError("permissions.stt must be a boolean");
      }
      parsedPermissions.stt = permissions.stt;
    }

    return {
      permissions: parsedPermissions,
      expires_in: expiresIn,
    };
  }

  /**
   * POST /auth/access-token - Генерация нового токена доступа
   */
  public generateAccessToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Валидация заголовков
      this.validateApiVersion(req);
      const authToken = this.extractAuthToken(req);

      // Валидация и парсинг тела запроса
      const tokenRequest = this.parseAndValidateRequestBody(req);

      // Генерация токена через сервис
      const tokenResponse = await this.authService.generateAccessToken(authToken, tokenRequest);

      // Логирование успешной генерации токена (без самого токена в целях безопасности)
      console.log("Access token generated successfully", {
        permissions: tokenResponse.permissions,
        expires_in: tokenResponse.expires_in,
        expires_at: tokenResponse.expires_at,
        timestamp: new Date().toISOString(),
      });

      // Возврат ответа
      res.status(201).json({
        success: true,
        data: tokenResponse,
      });
    }
    catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/access-token/tts - Быстрое создание токена для TTS
   */
  public generateTTSToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Валидация заголовков
      this.validateApiVersion(req);
      const authToken = this.extractAuthToken(req);

      // Получение expires_in из тела запроса (опционально)
      const expiresIn = req.body?.expires_in || 3600;

      if (!Number.isInteger(expiresIn) || expiresIn <= 0 || expiresIn > 3600) {
        throw new AuthValidationError("expires_in must be a positive integer not exceeding 3600 seconds");
      }

      // Создание запроса для TTS токена
      const tokenRequest = this.authService.createTTSOnlyTokenRequest(expiresIn);

      // Генерация токена
      const tokenResponse = await this.authService.generateAccessToken(authToken, tokenRequest);

      res.status(201).json({
        success: true,
        data: tokenResponse,
      });
    }
    catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/access-token/stt - Быстрое создание токена для STT
   */
  public generateSTTToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Валидация заголовков
      this.validateApiVersion(req);
      const authToken = this.extractAuthToken(req);

      // Получение expires_in из тела запроса (опционально)
      const expiresIn = req.body?.expires_in || 3600;

      if (!Number.isInteger(expiresIn) || expiresIn <= 0 || expiresIn > 3600) {
        throw new AuthValidationError("expires_in must be a positive integer not exceeding 3600 seconds");
      }

      // Создание запроса для STT токена
      const tokenRequest = this.authService.createSTTOnlyTokenRequest(expiresIn);

      // Генерация токена
      const tokenResponse = await this.authService.generateAccessToken(authToken, tokenRequest);

      res.status(201).json({
        success: true,
        data: tokenResponse,
      });
    }
    catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/access-token/full - Быстрое создание токена с полными правами
   */
  public generateFullPermissionsToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Валидация заголовков
      this.validateApiVersion(req);
      const authToken = this.extractAuthToken(req);

      // Получение expires_in из тела запроса (опционально)
      const expiresIn = req.body?.expires_in || 3600;

      if (!Number.isInteger(expiresIn) || expiresIn <= 0 || expiresIn > 3600) {
        throw new AuthValidationError("expires_in must be a positive integer not exceeding 3600 seconds");
      }

      // Создание запроса для токена с полными правами
      const tokenRequest = this.authService.createFullPermissionsTokenRequest(expiresIn);

      // Генерация токена
      const tokenResponse = await this.authService.generateAccessToken(authToken, tokenRequest);

      res.status(201).json({
        success: true,
        data: tokenResponse,
      });
    }
    catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/validate-token - Валидация токена доступа
   */
  public validateAccessToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { access_token, expires_at } = req.body;

      if (!access_token) {
        throw new AuthValidationError("access_token is required in request body");
      }

      // Проверка формата токена
      const isValidFormat = this.authService.validateAccessTokenFormat(access_token);

      if (!isValidFormat) {
        res.status(400).json({
          success: false,
          valid: false,
          reason: "Invalid token format",
        });
      }

      // Проверка истечения токена (если предоставлен expires_at)
      let isExpired = false;
      if (expires_at) {
        isExpired = this.authService.isTokenExpired(expires_at);
      }

      // Извлечение разрешений (если возможно)
      const permissions = this.authService.extractTokenPermissions(access_token);

      res.status(200).json({
        success: true,
        valid: !isExpired,
        is_expired: isExpired,
        permissions,
        checked_at: new Date().toISOString(),
      });
    }
    catch (error) {
      next(error);
    }
  };
}
