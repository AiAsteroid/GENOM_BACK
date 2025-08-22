// types/voice.types.ts

export enum Gender {
  MASCULINE = "masculine",
  FEMININE = "feminine",
  GENDER_NEUTRAL = "gender_neutral",
}

export enum ExpandField {
  IS_STARRED = "is_starred",
}

export type Voice = {
  id: string;
  name: string;
  gender: Gender;
  language: string;
  description?: string;
  is_owner?: boolean;
  is_starred?: boolean;
  created_at: string;
  updated_at: string;
};

export type ListVoicesQuery = {
  limit?: number;
  starting_after?: string;
  ending_before?: string;
  is_owner?: boolean;
  is_starred?: boolean;
  gender?: Gender;
  expand?: ExpandField[];
};

export type ListVoicesResponse = {
  data: Voice[];
  has_more: boolean;
  next_page: string | null;
};

export type CartesiaHeaders = {
  "authorization": string;
  "cartesia-version": string;
};

export class VoiceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VoiceValidationError";
  }
}

export class CartesiaApiError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = "CartesiaApiError";
    this.statusCode = statusCode;
  }
}
