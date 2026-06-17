// src/services/validarFactura.ts
import { Factura } from "../database/entities/Factura.js";
import { createHash } from "node:crypto";

/**
 * Tasa de IVA estándar en Bolivia (13%)
 */
export const IVA_RATE = 0.13;
const TOLERANCIA = 0.05; // Bs de tolerancia por redondeo

export interface FacturaValidationResult {
  valida: boolean;
  errores: string[];
  advertencias: string[];
  hashDedup?: string;
  creditoFiscal?: number;
}

/**
 * Calculates checking digit using Modulo 11 for Bolivian NIT numbers.
 */
export function calcularDigitoVerificadorMod11(nitSinDV: string): number {
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

/**
 * Valida si un NIT tiene el formato numérico y longitud correctos.
 */
export function validarNit(nit: string | number): boolean {
  const nitLimpio = String(nit).replace(/[\.\-\s]/g, "");
  return /^\d+$/.test(nitLimpio) && nitLimpio.length >= 5 && nitLimpio.length <= 15;
}

/**
 * Genera un hash único para la deduplicación de facturas (Track B).
 */
export function calcularHashDedup(factura: Partial<Factura>): string {
  const nit = factura.nitEmisor || "";
  const nro = factura.numeroFactura || "";
  const fecha = factura.fechaEmision || "";
  const total = Number(factura.importeTotal || 0).toFixed(2);
  const clave = `${nit}|${nro}|${fecha}|${total}`;
  return createHash("sha256").update(clave).digest("hex");
}

export function validarFecha(
  fecha: string,
  periodo?: string
): { ok: boolean; motivo?: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { ok: false, motivo: `El formato de la fecha '${fecha}' es inválido (se requiere YYYY-MM-DD).` };
  }
  const parsedDate = Date.parse(fecha);
  if (isNaN(parsedDate)) {
    return { ok: false, motivo: `La fecha '${fecha}' no es válida.` };
  }
  const d = new Date(fecha + "T00:00:00");
  if (d.getTime() > Date.now()) {
    return { ok: false, motivo: "La fecha de emisión no puede ser futura." };
  }
  if (periodo && fecha.slice(0, 7) !== periodo) {
    return { ok: false, motivo: `La fecha '${fecha}' no pertenece al período fiscal ${periodo}.` };
  }
  return { ok: true };
}

export function validarFactura(
  factura: Partial<Factura>,
  confianzasOrPeriodo?: Record<string, number> | string
): FacturaValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // 1. Extraemos periodo o confianzas
  let period: string | undefined = undefined;
  let confianzas: Record<string, number> | undefined = undefined;

  if (typeof confianzasOrPeriodo === "string") {
    period = confianzasOrPeriodo;
  } else if (confianzasOrPeriodo && typeof confianzasOrPeriodo === "object") {
    confianzas = confianzasOrPeriodo;
  }

  // 2. Validación de campos obligatorios
  const camposRequeridos: Array<keyof Factura> = [
    "nitEmisor",
    "razonSocialEmisor",
    "numeroFactura",
    "fechaEmision",
    "importeTotal",
    "descuentos",
    "importeBaseCreditoFiscal"
  ];

  for (const campo of camposRequeridos) {
    if (factura[campo] === undefined || factura[campo] === null || factura[campo] === "") {
      errores.push(`El campo '${campo}' es requerido.`);
    }
  }

  // Si faltan campos requeridos básicos, retornamos temprano
  if (errores.length > 0) {
    return {
      valida: false,
      errores,
      advertencias,
      hashDedup: calcularHashDedup(factura),
      creditoFiscal: Math.round(Number(factura.importeBaseCreditoFiscal || 0) * IVA_RATE * 100) / 100
    };
  }

  // 3. Montos no negativos
  const total = Number(factura.importeTotal);
  const desc = Number(factura.descuentos || 0);
  const base = Number(factura.importeBaseCreditoFiscal);

  if (isNaN(total) || total < 0) errores.push("importeTotal no puede ser negativo o inválido.");
  if (isNaN(desc) || desc < 0) errores.push("descuentos no puede ser negativo o inválido.");
  if (isNaN(base) || base < 0) errores.push("importeBaseCreditoFiscal no puede ser negativo o inválido.");

  // Coherencia de montos
  if (desc > total) {
    errores.push("descuentos no puede superar importeTotal");
  }
  if (base - total > TOLERANCIA) {
    errores.push("importeBaseCreditoFiscal no puede superar importeTotal");
  }

  const baseEsperada = total - desc;
  const diferencia = Math.abs(base - baseEsperada);
  if (diferencia > TOLERANCIA) {
    advertencias.push(
      `Diferencia aritmética detectada: Total (${total}) - Descuentos (${desc}) = ${baseEsperada.toFixed(2)}, pero el importeBaseCreditoFiscal registrado es ${base}.`
    );
  }

  // 4. NIT Emisor (formato y dígito verificador)
  if (!validarNit(factura.nitEmisor!)) {
    errores.push(`NIT del emisor inválido: ${factura.nitEmisor}`);
  } else {
    const nitEmisorLimpio = String(factura.nitEmisor).replace(/[\.\-\s]/g, "");
    if (nitEmisorLimpio.length >= 7 && nitEmisorLimpio.length <= 12) {
      const baseNit = nitEmisorLimpio.slice(0, -1);
      const dvOriginal = parseInt(nitEmisorLimpio.slice(-1), 10);
      const dvCalculado = calcularDigitoVerificadorMod11(baseNit);

      if (dvOriginal !== dvCalculado) {
        advertencias.push(
          `El NIT del emisor (${factura.nitEmisor}) no pasó la verificación matemática del algoritmo Módulo 11 (dígito original: ${dvOriginal}, calculado: ${dvCalculado}).`
        );
      }
    }
  }

  // NIT Comprador
  if (factura.nitComprador) {
    if (!validarNit(factura.nitComprador)) {
      advertencias.push(`NIT del comprador con formato dudoso: ${factura.nitComprador}`);
    }
  }

  // 5. Fecha de emisión
  if (factura.fechaEmision) {
    const checkFecha = validarFecha(factura.fechaEmision, period);
    if (!checkFecha.ok) {
      errores.push(checkFecha.motivo!);
    }
  }

  // 6. Confianzas de visión
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
    advertencias,
    hashDedup: calcularHashDedup(factura),
    creditoFiscal: Math.round(base * IVA_RATE * 100) / 100
  };
}
