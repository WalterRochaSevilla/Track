import { Factura } from "../database/entities/Factura.js";

export interface FacturaValidationResult {
  valida: boolean;
  errores: string[];
  advertencias: string[];
}

/**
 * Calculates checking digit using Modulo 11 for Bolivian NIT numbers.
 */
function calcularDigitoVerificadorMod11(nitSinDV: string): number {
  let suma = 0;
  let peso = 2;
  const longitud = nitSinDV.length;

  for (let i = longitud - 1; i >= 0; i--) {
    const digito = parseInt(nitSinDV.charAt(i), 10);
    suma += digito * peso;
    peso++;
    if (peso > 9) {
      peso = 2;
    }
  }

  const residuo = suma % 11;
  const dvCalculado = 11 - residuo;

  if (dvCalculado === 11) return 0;
  if (dvCalculado === 10) return 1;
  return dvCalculado;
}

export function validarFactura(
  factura: Partial<Factura>,
  confianzas?: Record<string, number>
): FacturaValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  const camposRequeridos: Array<keyof Factura> = [
    "nitEmisor",
    "razonSocialEmisor",
    "numeroFactura",
    "fechaEmision",
    "nitComprador",
    "importeTotal",
    "descuentos",
    "importeBaseCreditoFiscal"
  ];

  for (const campo of camposRequeridos) {
    if (factura[campo] === undefined || factura[campo] === null || factura[campo] === "") {
      errores.push(`El campo '${campo}' es requerido.`);
    }
  }

  if (errores.length > 0) {
    return { valida: false, errores, advertencias };
  }

  const nitEmisorLimpio = String(factura.nitEmisor).replace(/[\.\-\s]/g, "");
  const esNumericoEmisor = /^\d+$/.test(nitEmisorLimpio);
  const longitudValidaEmisor = nitEmisorLimpio.length >= 7 && nitEmisorLimpio.length <= 12;

  if (!esNumericoEmisor) {
    errores.push("El NIT del emisor debe contener únicamente números.");
  } else if (!longitudValidaEmisor) {
    errores.push(`El NIT del emisor tiene una longitud inválida (${nitEmisorLimpio.length} dígitos). Debe tener entre 7 y 12 dígitos.`);
  } else {
    const baseNit = nitEmisorLimpio.slice(0, -1);
    const dvOriginal = parseInt(nitEmisorLimpio.slice(-1), 10);
    const dvCalculado = calcularDigitoVerificadorMod11(baseNit);

    if (dvOriginal !== dvCalculado) {
      advertencias.push(
        `El NIT del emisor (${factura.nitEmisor}) no pasó la verificación matemática del algoritmo Módulo 11 (dígito original: ${dvOriginal}, calculado: ${dvCalculado}). Verifique si es correcto.`
      );
    }
  }

  if (factura.nitComprador) {
    const nitCompradorLimpio = String(factura.nitComprador).replace(/[\.\-\s]/g, "");
    const esNumericoComprador = /^\d+$/.test(nitCompradorLimpio);
    if (!esNumericoComprador && nitCompradorLimpio.toUpperCase() !== "0") {
      errores.push("El NIT del comprador debe contener únicamente números (o ser '0').");
    }
  }

  const total = Number(factura.importeTotal);
  const desc = Number(factura.descuentos || 0);
  const base = Number(factura.importeBaseCreditoFiscal);

  if (isNaN(total) || isNaN(desc) || isNaN(base)) {
    errores.push("Los montos de importeTotal, descuentos e importeBaseCreditoFiscal deben ser numéricos.");
  } else {
    const baseEsperada = total - desc;
    const diferencia = Math.abs(base - baseEsperada);

    if (base > total) {
      errores.push(`El importeBaseCreditoFiscal (${base}) no puede ser mayor que el importeTotal (${total}).`);
    } else if (diferencia > 0.1) {
      advertencias.push(
        `Diferencia aritmética detectada: Total (${total}) - Descuentos (${desc}) = ${baseEsperada.toFixed(2)}, pero el importeBaseCreditoFiscal registrado es ${base}.`
      );
    }
  }

  if (factura.fechaEmision) {
    const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
    if (!regexFecha.test(factura.fechaEmision)) {
      errores.push(`El formato de la fecha de emisión '${factura.fechaEmision}' es inválido (se requiere YYYY-MM-DD).`);
    } else {
      const parsedDate = Date.parse(factura.fechaEmision);
      if (isNaN(parsedDate)) {
        errores.push(`La fecha de emisión '${factura.fechaEmision}' no es una fecha válida.`);
      }
    }
  }

  if (confianzas) {
    for (const [campo, nivelConfianza] of Object.entries(confianzas)) {
      if (nivelConfianza < 0.7) {
        advertencias.push(
          `Baja confianza del lector de visión para el campo '${campo}' (confianza: ${(nivelConfianza * 100).toFixed(0)}%). Se sugiere revisión manual.`
        );
      }
    }
  }

  return {
    valida: errores.length === 0,
    errores,
    advertencias
  };
}
