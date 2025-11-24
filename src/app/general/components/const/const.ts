// Regex para validación de texto (letras, números, acentos, ñ, un solo espacio entre palabras)
export const SEARCH_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+( [a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+)*$/;
export const SEARCH_INTERMEDIATE_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+( [a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]*)*$/;

// Solo letras, espacios, acentos y ñ → ideal para nombres, competencias, descripción
export const TEXT_ONLY_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+( [a-zA-ZáéíóúÁÉÍÓÚñÑ]+)*$/;
export const TEXT_ONLY_INTERMEDIATE_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]*$/;

// Permite letras + números (abreviatura, códigos, etc.)
export const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+( [a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+)*$/;
export const ALPHANUMERIC_INTERMEDIATE_REGEX = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]*$/;

// Solo letras mayúsculas + números (muy común en abreviaturas)
export const ABBREVIATION_REGEX = /^[A-Z0-9]+$/;

// Regex para validación de texto sin números (solo letras, acentos, ñ, un solo espacio entre palabras)
export const SEARCH_NO_NUMBERS_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+( [a-zA-ZáéíóúÁÉÍÓÚñÑ]+)*$/;
export const SEARCH_NO_NUMBERS_INTERMEDIATE_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+( [a-zA-ZáéíóúÁÉÍÓÚñÑ]*)*$/;

// Regex para validación de fechas (formato YYYY-MM-DD)
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Mensajes reutilizables
export const VALIDATION_MESSAGES = {
  TEXT_ONLY: 'Solo letras, acentos, ñ y un solo espacio entre palabras.',
  ALPHANUMERIC: 'Solo letras, números, acentos, ñ y un solo espacio entre palabras.',
  ABBREVIATION: 'Solo letras mayúsculas y números, sin espacios.',
  NO_DOUBLE_SPACE: 'No se permiten espacios dobles.',
  NO_LEADING_SPACE: 'No se permite espacio al inicio.',
};

// Mensajes de validación para texto
export const SEARCH_VALIDATION_MESSAGES = {
  INVALID_FORMAT: 'Solo se permiten letras, números, acentos, ñ y un solo espacio entre palabras.',
  NO_LEADING_SPACE: 'No se permiten espacios al inicio.',
  NO_NUMBERS_INVALID_FORMAT: 'Solo se permiten letras, acentos, ñ y un solo espacio entre palabras. No se permiten números.',
};

// Mensajes de validación para fechas
export const DATE_VALIDATION_MESSAGES = {
  INVALID_FORMAT: 'Fecha inválida. Use el formato AAAA-MM-DD.',
  FUTURE_DATE: 'La fecha no puede ser futura.',
  END_BEFORE_START: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
  INVALID_YEAR: (currentYear: number) => `El año no puede ser mayor al año actual (${currentYear}).`,
  INVALID_MONTH: 'El mes debe estar entre 1 y 12.',
  INVALID_DAY: 'El día no es válido para el mes y año seleccionados.',
  INCOMPLETE_DATE: 'Por favor, ingrese una fecha completa (día, mes y año).',
};