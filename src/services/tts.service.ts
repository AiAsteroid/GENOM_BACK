// src/services/tts.service.ts

import type { AxiosResponse } from "axios";

import axios, { AxiosError } from "axios";
import { Buffer } from "node:buffer";

import type { TTSRequest, TTSResponse } from "@/interfaces/tts.types";

export class TTSService {
  private readonly cartesiaApiUrl = "https://api.cartesia.ai/tts/bytes";
  private readonly cartesiaVersion = "2025-04-16";
  private readonly maxRetries = 3;
  private readonly timeoutMs = 30000;

  /**
   * Генерация аудио через Cartesia API
   */
  async generateAudio(request: TTSRequest, bearerToken: string): Promise<TTSResponse> {
    this.validateRequest(request);

    if (!bearerToken) {
      throw new Error("Bearer token is required");
    }

    const headers = {
      "Authorization": `${bearerToken}`,
      "Cartesia-Version": this.cartesiaVersion,
      "Content-Type": "application/json",
    };

    const requestBody = this.prepareCartesiaRequest(request);

    try {
      const response = await this.makeRequestWithRetry(headers, requestBody);

      return {
        audioBuffer: response.data,
        contentType: this.getContentType(request.output_format.container),
        cartesiaFileId: response.headers["cartesia-file-id"],
      };
    }
    catch (error) {
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Валидация входящего запроса
   */
  private validateRequest(request: TTSRequest): void {
    if (!request.transcript || request.transcript.trim().length === 0) {
      throw new Error("Transcript cannot be empty");
    }

    if (!this.isValidUuid(request.voice.id)) {
      throw new Error("Invalid voice ID format");
    }

    if (request.output_format.container === "mp3" && !request.output_format.bit_rate) {
      throw new Error("bit_rate is required for mp3 format");
    }

    if (!request.output_format.sample_rate) {
      throw new Error("sample_rate is required");
    }
  }

  /**
   * Подготовка тела запроса для Cartesia
   */
  private prepareCartesiaRequest(request: TTSRequest): object {
    return {
      model_id: request.model_id,
      transcript: request.transcript.trim(),
      voice: {
        mode: request.voice.mode,
        id: request.voice.id,
      },
      output_format: request.output_format,
      language: request.language,
      speed: request.speed,
      save: request.save,
      ...(request.pronunciation_dict_ids && {
        pronunciation_dict_ids: request.pronunciation_dict_ids,
      }),
    };
  }

  /**
   * Выполнение запроса с ретраями
   */
  private async makeRequestWithRetry(
    headers: Record<string, string>,
    data: object,
  ): Promise<AxiosResponse<Buffer>> {
    let lastError: AxiosError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.post<Buffer>(
          this.cartesiaApiUrl,
          data,
          {
            headers,
            timeout: this.timeoutMs,
            responseType: "arraybuffer",
            validateStatus: status => status < 500, // Ретрай только для 5xx
          },
        );

        if (response.status >= 400) {
          throw new AxiosError(
            "Client error from Cartesia",
            response.status.toString(),
            response.config,
            response.request,
            response,
          );
        }

        return {
          ...response,
          data: Buffer.from(response.data),
        };
      }
      catch (error) {
        lastError = error as AxiosError;

        // Не ретраим клиентские ошибки
        if (lastError.response && lastError.response.status < 500) {
          break;
        }

        if (attempt === this.maxRetries) {
          break;
        }

        // Экспоненциальный backoff
        const delay = 2 ** (attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // eslint-disable-next-line no-throw-literal
    throw lastError!;
  }

  /**
   * Обработка ошибок от Cartesia
   */
  private handleError(error: AxiosError): Error {
    const status = error.response?.status || 500;
    const requestId = error.response?.headers["request-id"]
      || error.response?.headers["x-request-id"];

    let errorCode = "UPSTREAM_ERROR";
    let message = `Cartesia API error: ${error.message}`;

    if (status >= 400 && status < 500) {
      errorCode = "UPSTREAM_BAD_REQUEST";
      if (error.response?.data) {
        try {
          const errorData = JSON.parse(error.response.data.toString());
          message = `Cartesia: ${errorData.message || errorData.error || "Bad request"}`;
        }
        catch {
          message = `Cartesia: Bad request (${status})`;
        }
      }
    }
    else if (status >= 500) {
      errorCode = "UPSTREAM_SERVER_ERROR";
      message = `Cartesia: Server error (${status})`;
    }

    const customError = new Error(message);
    (customError as any).code = errorCode;
    (customError as any).status = status;
    (customError as any).requestId = requestId;

    return customError;
  }

  /**
   * Получение MIME типа по контейнеру
   */
  private getContentType(container: string): string {
    const contentTypes: Record<string, string> = {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      raw: "application/octet-stream",
    };

    return contentTypes[container] || "application/octet-stream";
  }

  /**
   * Валидация UUID
   */
  private isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
