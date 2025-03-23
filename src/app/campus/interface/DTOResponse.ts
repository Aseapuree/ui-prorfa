// src/app/interfaces/dto-response.ts

export interface DTOResponse<T> {
  code: number;
  message: string;
  data: T;
}