/** Códigos de error de la sección 11.8 del enunciado. */
export type ErrorCode =
  | "JSON_INVALIDO"
  | "NO_AUTENTICADO"
  | "CREDENCIALES_INVALIDAS"
  | "SIN_PERMISO"
  | "NO_ENCONTRADO"
  | "CODIGO_DUPLICADO"
  | "DOCUMENTO_DUPLICADO"
  | "EMAIL_DUPLICADO"
  | "NOMBRE_DUPLICADO"
  | "CATEGORIA_EN_USO"
  | "STOCK_INSUFICIENTE"
  | "FACTURA_ANULADA"
  | "VALIDACION"
  | "PRODUCTO_INACTIVO"
  | "CUENTA_CORRIENTE_NO_HABILITADA"
  | "LIMITE_CREDITO_EXCEDIDO"
  | "MONTO_INSUFICIENTE"
  | "PAGO_SUPERA_DEUDA"
  | "SALDO_PENDIENTE"
  | "CONTRASENA_ACTUAL_INCORRECTA"
  | "OPERACION_SOBRE_SI_MISMO"
  | "ERROR_INTERNO";

/** Detalle opcional por campo o por producto en errores de validación/stock. */
export type ErrorDetail = Record<string, unknown> & {
  campo?: string;
  mensaje?: string;
};

/**
 * Error de dominio único lanzado por los servicios (sección 10.4).
 * Los adaptadores HTTP lo convierten al JSON estándar de la API.
 */
export class ApiError extends Error {
  status: number;
  code: ErrorCode;
  details?: ErrorDetail[];

  /**
   * @param status Código HTTP (400–422, 409, 500…).
   * @param code Código de negocio de la sección 11.8.
   * @param message Mensaje legible para la UI.
   * @param details Lista opcional de detalles por campo/producto.
   */
  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    details?: ErrorDetail[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Forma JSON del error según la sección 11.1. */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}
