// types/auth-cartesia.types.ts

export type TokenPermissions = {
  tts?: boolean;
  stt?: boolean;
};

export type GenerateTokenRequest = {
  permissions: TokenPermissions;
  expires_in: number; // seconds, max 3600 (1 hour)
};

export type GenerateTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: string; // ISO timestamp
  permissions: TokenPermissions;
};

export type AuthValidationErrorType = {
  name: "AuthValidationError";
} & Error;

export class AuthValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthValidationError";
  }
}

export class CartesiaAuthError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = "CartesiaAuthError";
    this.statusCode = statusCode;
  }
}
