"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

export function useValorRetrasado<T>(valor: T, retraso = 300): T {
  const [retrasado, setRetrasado] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setRetrasado(valor), retraso);
    return () => clearTimeout(id);
  }, [valor, retraso]);
  return retrasado;
}

export function useFiltrosEnVivo(
  basePath?: string,
  claves: readonly string[] = [],
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendiente, startTransition] = useTransition();
  const ultimoAplicado = useRef<string | null>(null);

  const aplicar = useCallback(
    (params: URLSearchParams) => {
      const destino = new URLSearchParams(searchParams.toString());
      for (const clave of claves) destino.delete(clave);
      destino.delete("page");
      params.forEach((valor, clave) => destino.set(clave, valor));

      const qs = destino.toString();
      if (qs === searchParams.toString()) {
        ultimoAplicado.current = qs;
        return;
      }
      if (qs === ultimoAplicado.current) return;
      ultimoAplicado.current = qs;
      const ruta = basePath ?? pathname;
      startTransition(() => {
        router.replace(qs ? `${ruta}?${qs}` : ruta, { scroll: false });
      });
    },
    [basePath, claves, pathname, router, searchParams],
  );

  return { searchParams, pendiente, aplicar };
}
