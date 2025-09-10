// src/types/tts.types.ts

import type { Buffer } from "node:buffer";

export type Voice = {
  mode: "id";
  id: string; // UUID
};

export type OutputFormat = {
  container: "mp3" | "wav" | "raw";
  bit_rate?: number; // Required for mp3
  sample_rate: number;
};

export type Language
    = | "en" | "fr" | "de" | "es" | "pt" | "zh" | "ja"
      | "hi" | "it" | "ko" | "nl" | "pl" | "ru" | "sv" | "tr";

export type Speed = "slow" | "normal" | "fast";

export type TTSRequest = {
  model_id: string;
  transcript: string;
  voice: Voice;
  output_format: OutputFormat;
  language: Language;
  speed: Speed;
  save: boolean;
  pronunciation_dict_ids?: string[];
};

export type TTSResponse = {
  audioBuffer: Buffer;
  contentType: string;
  cartesiaFileId?: string;
};

export type TTSErrorResponse = {
  error: {
    code: string;
    message: string;
    details: {
      status: number;
      requestId?: string;
    };
  };
};
