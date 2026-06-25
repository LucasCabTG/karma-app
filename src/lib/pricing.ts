// Archivo: src/lib/pricing.ts

export interface LoteData {
  precio: number;
  preciosPorCantidad?: { [cantidad: string]: number };
}

/**
 * Calcula el precio total óptimo para una cantidad de entradas,
 * combinando de forma óptima los precios especiales configurados por el administrador
 * (utilizando un enfoque de Programación Dinámica).
 * 
 * @param cantidad Cantidad de entradas seleccionadas.
 * @param precioBase Precio unitario de 1 entrada.
 * @param preciosPorCantidad Mapa opcional de cantidad -> precio total.
 * @returns El precio total calculado.
 */
export function calcularPrecioTotal(
  cantidad: number,
  precioBase: number,
  preciosPorCantidad?: { [cantidad: string]: number }
): number {
  if (cantidad <= 0) return 0;
  if (!preciosPorCantidad || Object.keys(preciosPorCantidad).length === 0) {
    return cantidad * precioBase;
  }

  // Si existe un precio explícito definido para exactamente esta cantidad, lo priorizamos
  if (preciosPorCantidad[String(cantidad)] !== undefined && preciosPorCantidad[String(cantidad)] > 0) {
    return preciosPorCantidad[String(cantidad)];
  }

  // Definimos las opciones de paquetes de entradas que el administrador ha configurado.
  // Siempre incluimos la opción de comprar 1 entrada individual al precio base.
  const paquetes: { cant: number; precio: number }[] = [{ cant: 1, precio: precioBase }];
  for (const [cantStr, prec] of Object.entries(preciosPorCantidad)) {
    const cant = Number(cantStr);
    if (cant > 1 && prec > 0) {
      paquetes.push({ cant, precio: prec });
    }
  }

  // dp[i] representará el precio total mínimo para conseguir exactamente 'i' entradas
  const dp: number[] = new Array(cantidad + 1).fill(Infinity);
  dp[0] = 0;

  for (let i = 1; i <= cantidad; i++) {
    for (const paquete of paquetes) {
      if (i >= paquete.cant) {
        dp[i] = Math.min(dp[i], dp[i - paquete.cant] + paquete.precio);
      }
    }
  }

  return dp[cantidad] === Infinity ? cantidad * precioBase : dp[cantidad];
}
