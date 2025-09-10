// src/controllers/tts.controller.ts

import type { Request, Response } from "express";

import type { TTSErrorResponse, TTSRequest } from "@/interfaces/tts.types";

import { TTSService } from "@/services/tts.service";

export class TTSController {
  private ttsService: TTSService;

  constructor() {
    this.ttsService = new TTSService();
  }

  /**
   * Генерация аудио (TTS)
   * POST /api/tts/bytes
   */
  generateBytes = async (req: Request, res: Response): Promise<void> => {
    try {
      const ttsRequest = this.validateAndNormalizeRequest(req.body);
      const token = req.headers.authorization;
      console.log({ token });

      const result = await this.ttsService.generateAudio(ttsRequest, token!);

      // Установка заголовков ответа
      res.set({
        "Content-Type": result.contentType,
        "Content-Length": result.audioBuffer.length.toString(),
        ...(result.cartesiaFileId && {
          "X-Cartesia-File-ID": result.cartesiaFileId,
        }),
      });

      // Отправка бинарного контента
      res.status(200).end(result.audioBuffer);
    }
    catch (error) {
      this.handleControllerError(res, error as Error);
    }
  };

  /**
   * Валидация и нормализация входящего запроса
   */
  private validateAndNormalizeRequest(body: any): TTSRequest {
    // Применяем дефолты согласно спецификации
    const defaults = {
      model_id: "sonic-2",
      speed: "normal" as const,
      save: true,
      language: "ru" as const,
      output_format: {
        container: "mp3" as const,
        bit_rate: 128000,
        sample_rate: 44100,
      },
    };

    const request: TTSRequest = {
      model_id: body.model_id || defaults.model_id,
      transcript: body.transcript,
      voice: body.voice,
      output_format: {
        container: body.output_format?.container || defaults.output_format.container,
        sample_rate: body.output_format?.sample_rate || defaults.output_format.sample_rate,
        ...(body.output_format?.bit_rate !== undefined && {
          bit_rate: body.output_format.bit_rate,
        }),
      },
      language: body.language || defaults.language,
      speed: body.speed || defaults.speed,
      save: body.save !== undefined ? body.save : defaults.save,
      ...(body.pronunciation_dict_ids && {
        pronunciation_dict_ids: body.pronunciation_dict_ids,
      }),
    };

    // Добавляем bit_rate для mp3, если не указан
    if (request.output_format.container === "mp3" && !request.output_format.bit_rate) {
      request.output_format.bit_rate = defaults.output_format.bit_rate;
    }

    // Базовая валидация
    this.validateRequestFields(request);

    return request;
  }

  /**
   * Валидация полей запроса
   */
  private validateRequestFields(request: TTSRequest): void {
    const errors: string[] = [];

    // Обязательные поля
    if (!request.transcript) {
      errors.push("transcript is required and must be a string");
    }
    else if (request.transcript.trim().length === 0) {
      errors.push("transcript cannot be empty");
    }

    if (!request.voice || !request.voice.id || !request.voice.mode) {
      errors.push("voice.id and voice.mode are required");
    }
    else if (request.voice.mode !== "id") {
      errors.push("voice.mode must be \"id\"");
    }

    // Валидация языка
    const supportedLanguages = [
      "en",
      "fr",
      "de",
      "es",
      "pt",
      "zh",
      "ja",
      "hi",
      "it",
      "ko",
      "nl",
      "pl",
      "ru",
      "sv",
      "tr",
    ];
    if (!supportedLanguages.includes(request.language)) {
      errors.push(`language must be one of: ${supportedLanguages.join(", ")}`);
    }

    // Валидация скорости
    const supportedSpeeds = ["slow", "normal", "fast"];
    if (!supportedSpeeds.includes(request.speed)) {
      errors.push(`speed must be one of: ${supportedSpeeds.join(", ")}`);
    }

    // Валидация формата вывода
    const supportedContainers = ["mp3", "wav", "raw"];
    if (!supportedContainers.includes(request.output_format.container)) {
      errors.push(`output_format.container must be one of: ${supportedContainers.join(", ")}`);
    }

    if (request.output_format.container === "mp3" && !request.output_format.bit_rate) {
      errors.push("output_format.bit_rate is required for mp3 format");
    }

    if (!request.output_format.sample_rate) {
      errors.push("output_format.sample_rate is required and must be a number");
    }

    if (errors.length > 0) {
      // eslint-disable-next-line unicorn/error-message
      const error = new Error(errors.join("; "));
      (error as any).code = "VALIDATION_ERROR";
      (error as any).status = 400;
      throw error;
    }
  }

  /**
   * Обработка ошибок контроллера
   */
  private handleControllerError(res: Response, error: Error): void {
    const errorAny = error as any;
    let status = 500;
    let code = "INTERNAL_ERROR";
    let message = "Internal server error";

    if (errorAny.code === "VALIDATION_ERROR") {
      status = 400;
      code = "VALIDATION_ERROR";
      message = error.message;
    }
    else if (errorAny.code === "UPSTREAM_BAD_REQUEST") {
      status = 422;
      code = "UPSTREAM_BAD_REQUEST";
      message = error.message;
    }
    else if (errorAny.code === "UPSTREAM_SERVER_ERROR") {
      status = 502;
      code = "UPSTREAM_SERVER_ERROR";
      message = error.message;
    }
    else if (error.message === "Bearer token is required") {
      status = 401;
      code = "UNAUTHORIZED";
      message = error.message;
    }
    else if (errorAny.status) {
      status = errorAny.status;
      code = errorAny.code || "UPSTREAM_ERROR";
      message = error.message;
    }

    const errorResponse: TTSErrorResponse = {
      error: {
        code,
        message,
        details: {
          status: errorAny.originalStatus || status,
          ...(errorAny.requestId && { requestId: errorAny.requestId }),
        },
      },
    };

    console.error("TTS Controller Error:", {
      error: error.message,
      code: errorAny.code,
      status,
      requestId: errorAny.requestId,
      stack: error.stack,
    });

    res.status(status).json(errorResponse);
  }
}
