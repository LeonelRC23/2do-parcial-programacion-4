/**
 * Error lanzado en el cliente cuando una respuesta `/api` no es exitosa.
 * Expone status HTTP, código de negocio y detalles opcionales.
 */
export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Alias histórico usado por algunos componentes de UI. */
export { ApiClientError as ClientApiError };

/**
 * Cliente fetch tipado hacia la API REST.
 * Parsea JSON, trata 204 como vacío y lanza `ApiClientError` si falla.
 *
 * @param url Ruta relativa (ej. `/api/productos`).
 * @param init Opciones de `fetch` (method, body, headers…).
 */
export async function fetchJson<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 204) return undefined as T;

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    const apiError = responseBody?.error;
    throw new ApiClientError(
      response.status,
      apiError?.code ?? "ERROR_INTERNO",
      apiError?.message ?? "Error de red",
      apiError?.details,
    );
  }

  return responseBody as T;
}
