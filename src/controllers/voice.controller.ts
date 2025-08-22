// controllers/voice.controller.ts

import type { NextFunction, Request, Response } from "express";

import type { ListVoicesQuery } from "@/interfaces/voice.types";

import { ExpandField, Gender, VoiceValidationError } from "@/interfaces/voice.types";
import { VoiceService } from "@/services/voice.service";

export class VoiceController {
  private voiceService: VoiceService;

  constructor() {
    this.voiceService = new VoiceService();
  }

  /**
   * Извлечение токена авторизации из заголовков
   */
  private extractAuthToken(req: Request): string {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new VoiceValidationError("Authorization header is required");
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new VoiceValidationError("Authorization header must start with \"Bearer \"");
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    if (!token) {
      throw new VoiceValidationError("Authorization token is required");
    }

    return token;
  }

  /**
   * Валидация версии API
   */
  private validateApiVersion(req: Request): void {
    const version = req.headers["cartesia-version"];

    if (!version) {
      throw new VoiceValidationError("Cartesia-Version header is required");
    }

    if (version !== "2025-04-16") {
      throw new VoiceValidationError("Invalid Cartesia-Version. Expected: 2025-04-16");
    }
  }

  /**
   * Парсинг и валидация query параметров
   */
  private parseQueryParams(req: Request): ListVoicesQuery {
    const query: ListVoicesQuery = {};

    // Парсинг limit
    if (req.query.limit) {
      const limit = Number.parseInt(req.query.limit as string, 10);
      if (Number.isNaN(limit)) {
        throw new VoiceValidationError("Limit must be a valid integer");
      }
      query.limit = limit;
    }

    // Парсинг строковых параметров
    if (req.query.starting_after) {
      query.starting_after = req.query.starting_after as string;
    }

    if (req.query.ending_before) {
      query.ending_before = req.query.ending_before as string;
    }

    // Парсинг boolean параметров
    if (req.query.is_owner !== undefined) {
      query.is_owner = req.query.is_owner === "true";
    }

    if (req.query.is_starred !== undefined) {
      query.is_starred = req.query.is_starred === "true";
    }

    // Парсинг gender
    if (req.query.gender) {
      const gender = req.query.gender as string;
      if (Object.values(Gender).includes(gender as Gender)) {
        query.gender = gender as Gender;
      }
      else {
        throw new VoiceValidationError(`Invalid gender: ${gender}`);
      }
    }

    // Парсинг expand array
    if (req.query["expand[]"]) {
      const expandParam = req.query["expand[]"];
      const expandFields = Array.isArray(expandParam) ? expandParam : [expandParam];

      query.expand = expandFields.map((field) => {
        const fieldStr = field as string;
        if (Object.values(ExpandField).includes(fieldStr as ExpandField)) {
          return fieldStr as ExpandField;
        }
        else {
          throw new VoiceValidationError(`Invalid expand field: ${fieldStr}`);
        }
      });
    }

    return query;
  }

  /**
   * GET /voices - Получение списка голосов
   */
  public getVoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Валидация заголовков
      this.validateApiVersion(req);
      const token = this.extractAuthToken(req);

      // Парсинг query параметров
      const queryParams = this.parseQueryParams(req);

      // Попытка получить из кэша (если реализовано)
      let cachedResult = null;
      try {
        cachedResult = await this.voiceService.getCachedVoices(queryParams);
      }
      catch (error) {
        console.warn("Failed to fetch from cache:", error);
      }

      let result;
      if (cachedResult) {
        result = cachedResult;
      }
      else {
        // Получение данных из Cartesia API
        result = await this.voiceService.getVoices(token, queryParams);

        // Кэширование результата (если реализовано)
        try {
          await this.voiceService.cacheVoices(result.data);
        }
        catch (error) {
          console.warn("Failed to cache voices:", error);
        }
      }

      // Возврат результата
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  };

  /**
   * GET /voices/:id - Получение конкретного голоса по ID
   */
  public getVoiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Валидация заголовков
      this.validateApiVersion(req);
      const token = this.extractAuthToken(req);

      // Получение ID из параметров маршрута
      const voiceId = req.params.id;
      if (!voiceId) {
        throw new VoiceValidationError("Voice ID is required");
      }

      // Получение голоса
      const voice = await this.voiceService.getVoiceById(token, voiceId);

      res.status(200).json(voice);
    }
    catch (error) {
      next(error);
    }
  };
}
