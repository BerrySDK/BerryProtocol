export interface ApiSuccess<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  error: unknown;
}

export const successResponse = <T>(message: string, data: T): ApiSuccess<T> => ({
  success: true,
  message,
  data,
});

export const errorResponse = (message: string, error: unknown): ApiFailure => ({
  success: false,
  message,
  error,
});
