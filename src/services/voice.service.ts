// services/voice.service.ts

import type { AxiosResponse } from "axios";

import axios from "axios";

import type { ListVoicesQuery, ListVoicesResponse, Voice } from "../interfaces/voice.types";

import { CartesiaApiError, ExpandField, Gender, VoiceValidationError } from "../interfaces/voice.types";

export class VoiceService {
  private readonly baseURL: string;
  private readonly apiVersion: string;

  constructor() {
    // eslint-disable-next-line node/no-process-env
    this.baseURL = process.env.CARTESIA_API_URL || "https://api.cartesia.ai";
    // eslint-disable-next-line node/no-process-env
    this.apiVersion = process.env.CARTESIA_API_VERSION || "2025-04-16";
  }

  /**
   * Валидация query параметров
   */
  private validateQuery(query: ListVoicesQuery): void {
    if (query.limit !== undefined) {
      if (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 100) {
        throw new VoiceValidationError("Limit must be an integer between 1 and 100");
      }
    }

    if (query.gender && !Object.values(Gender).includes(query.gender)) {
      throw new VoiceValidationError(`Invalid gender. Must be one of: ${Object.values(Gender).join(", ")}`);
    }

    if (query.expand) {
      const validExpandFields = Object.values(ExpandField);
      for (const field of query.expand) {
        if (!validExpandFields.includes(field)) {
          throw new VoiceValidationError(`Invalid expand field: ${field}. Must be one of: ${validExpandFields.join(", ")}`);
        }
      }
    }
  }

  /**
   * Построение query параметров для запроса
   */
  private buildQueryParams(query: ListVoicesQuery): URLSearchParams {
    const params = new URLSearchParams();

    if (query.limit)
      params.append("limit", query.limit.toString());
    if (query.starting_after)
      params.append("starting_after", query.starting_after);
    if (query.ending_before)
      params.append("ending_before", query.ending_before);
    if (query.is_owner !== undefined)
      params.append("is_owner", query.is_owner.toString());
    if (query.is_starred !== undefined)
      params.append("is_starred", query.is_starred.toString());
    if (query.gender)
      params.append("gender", query.gender);
    if (query.expand) {
      query.expand.forEach(field => params.append("expand[]", field));
    }

    return params;
  }

  /**
   * Получение списка голосов из Cartesia API
   */
  public async getVoices(token: string, query: ListVoicesQuery = {}): Promise<ListVoicesResponse> {
    try {
      // Валидация входных параметров
      this.validateQuery(query);

      // Построение URL с query параметрами
      const queryParams = this.buildQueryParams(query);
      const url = `${this.baseURL}/voices${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      // Заголовки запроса
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Cartesia-Version": this.apiVersion,
        "Content-Type": "application/json",
      };

      // Выполнение запроса
      const response: AxiosResponse<ListVoicesResponse> = await axios.get(url, { headers });

      return response.data;
    }
    catch (error) {
      if (error instanceof VoiceValidationError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || error.message || "Unknown error occurred";
        throw new CartesiaApiError(`Cartesia API error: ${message}`, statusCode);
      }

      throw new CartesiaApiError("Unknown error occurred while fetching voices");
    }
  }

  /**
   * Получение конкретного голоса по ID (дополнительный метод)
   */
  public async getVoiceById(token: string, voiceId: string): Promise<Voice> {
    try {
      const url = `${this.baseURL}/voices/${voiceId}`;

      const headers = {
        "Authorization": `Bearer ${token}`,
        "Cartesia-Version": this.apiVersion,
        "Content-Type": "application/json",
      };

      const response: AxiosResponse<Voice> = await axios.get(url, { headers });
      return response.data;
    }
    catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.message || error.message || "Unknown error occurred";
        throw new CartesiaApiError(`Failed to fetch voice: ${message}`, statusCode);
      }

      throw new CartesiaApiError("Unknown error occurred while fetching voice");
    }
  }

  /**
   * Кэширование голосов в базе данных (заглушка для реализации)
   */
  public async cacheVoices(voices: Voice[]): Promise<void> {
    // TODO: Реализовать сохранение в базу данных
    console.log(`Caching ${voices.length} voices to database`);
  }

  /**
   * Получение голосов из кэша (заглушка для реализации)
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  public async getCachedVoices(query: ListVoicesQuery): Promise<ListVoicesResponse | null> {
    // TODO: Реализовать получение из базы данных
    console.log("Fetching voices from cache");
    return null;
  }
}
