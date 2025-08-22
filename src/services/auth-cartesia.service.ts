// services/auth-cartesia.service.ts

import type { AxiosResponse } from "axios";

import axios from "axios";

import type { GenerateTokenRequest, GenerateTokenResponse, TokenPermissions } from "@/interfaces/auth-cartesia.types";

import { AuthValidationError, CartesiaAuthError } from "@/interfaces/auth-cartesia.types";

export class AuthCartesiaService {
  private readonly baseURL: string;
  private readonly apiVersion: string;

  constructor() {
    // eslint-disable-next-line node/no-process-env
    this.baseURL = process.env.CARTESIA_API_URL || "https://api.cartesia.ai";
    // eslint-disable-next-line node/no-process-env
    this.apiVersion = process.env.CARTESIA_API_VERSION || "2025-04-16";
  }

  /**
   * Валидация запроса на генерацию токена
   */
  private validateGenerateTokenRequest(request: GenerateTokenRequest): void {
    // Проверка expires_in
    if (!Number.isInteger(request.expires_in) || request.expires_in <= 0) {
      throw new AuthValidationError("expires_in must be a positive integer");
    }

    if (request.expires_in > 3600) {
      throw new AuthValidationError("expires_in cannot exceed 3600 seconds (1 hour)");
    }

    // Проверка permissions
    if (!request.permissions || typeof request.permissions !== "object") {
      throw new AuthValidationError("permissions object is required");
    }

    const { tts, stt } = request.permissions;

    // Проверка, что хотя бы одно разрешение указано
    if ((tts === undefined || tts === null) && (stt === undefined || stt === null)) {
      throw new AuthValidationError("At least one permission (tts or stt) must be specified");
    }

    // Проверка типов разрешений
    if (tts === undefined || tts === null) {
      throw new AuthValidationError("permissions.tts must be a boolean");
    }

    if (stt === undefined || stt === null) {
      throw new AuthValidationError("permissions.stt must be a boolean");
    }

    // Проверка, что хотя бы одно разрешение установлено в true
    if (!tts && !stt) {
      throw new AuthValidationError("At least one permission must be set to true");
    }
  }

  /**
   * Генерация нового токена доступа
   */
  public async generateAccessToken(
    authToken: string,
    request: GenerateTokenRequest,
  ): Promise<GenerateTokenResponse> {
    try {
      // Валидация входных данных
      this.validateGenerateTokenRequest(request);

      const url = `${this.baseURL}/access-token`;

      // Заголовки запроса
      const headers = {
        "Authorization": `Bearer ${authToken}`,
        "Cartesia-Version": this.apiVersion,
        "Content-Type": "application/json",
      };

      // Выполнение запроса
      const response: AxiosResponse<GenerateTokenResponse> = await axios.post(
        url,
        request,
        { headers },
      );

      // Добавляем вычисленное время истечения токена
      return {
        ...response.data,
        expires_at: new Date(Date.now() + request.expires_in * 1000).toISOString(),
      };
    }
    catch (error) {
      if (error instanceof AuthValidationError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500;
        let message = error.response?.data?.message || error.message || "Unknown error occurred";

        // Обработка специфичных ошибок авторизации
        switch (statusCode) {
          case 401:
            message = "Invalid or expired auth token";
            break;
          case 403:
            message = "Insufficient permissions to generate access token";
            break;
          case 429:
            message = "Too many token generation requests";
            break;
        }

        throw new CartesiaAuthError(`Cartesia Auth API error: ${message}`, statusCode);
      }

      throw new CartesiaAuthError("Unknown error occurred while generating access token");
    }
  }

  /**
   * Валидация токена доступа (проверка формата)
   */
  public validateAccessTokenFormat(token: string): boolean {
    // Базовая проверка формата токена
    if (!token) {
      return false;
    }

    // Проверка, что токен не пустой и имеет разумную длину
    return !(token.length < 10 || token.length > 500);
  }

  /**
   * Извлечение информации о разрешениях из токена (заглушка)
   * В реальной реализации может потребоваться декодирование JWT
   */
  public extractTokenPermissions(token: string): TokenPermissions | null {
    // TODO: Реализовать извлечение разрешений из токена
    // Это может включать декодирование JWT или запрос к API для валидации
    console.log(`Extracting permissions from token: ${token.substring(0, 10)}...`);
    return null;
  }

  /**
   * Проверка истечения токена (заглушка)
   */
  public isTokenExpired(expiresAt: string): boolean {
    try {
      const expirationTime = new Date(expiresAt).getTime();
      const currentTime = Date.now();
      return currentTime >= expirationTime;
    }
    catch (error) {
      console.error("Error parsing token expiration time:", error);
      return true; // Считаем токен истекшим при ошибке парсинга
    }
  }

  /**
   * Создание токена с максимальными разрешениями (helper метод)
   */
  public createFullPermissionsTokenRequest(expiresIn: number = 3600): GenerateTokenRequest {
    return {
      permissions: {
        tts: true,
        stt: true,
      },
      expires_in: Math.min(expiresIn, 3600), // Ограничиваем максимумом
    };
  }

  /**
   * Создание токена только для TTS (helper метод)
   */
  public createTTSOnlyTokenRequest(expiresIn: number = 3600): GenerateTokenRequest {
    return {
      permissions: {
        tts: true,
        stt: false,
      },
      expires_in: Math.min(expiresIn, 3600),
    };
  }

  /**
   * Создание токена только для STT (helper метод)
   */
  public createSTTOnlyTokenRequest(expiresIn: number = 3600): GenerateTokenRequest {
    return {
      permissions: {
        tts: false,
        stt: true,
      },
      expires_in: Math.min(expiresIn, 3600),
    };
  }
}
