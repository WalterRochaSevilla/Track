import { createHash } from "node:crypto";
import type { Factura, ResultadoValidacion } from "../types/factura.js";

export const IVA_RATE = 0.13;
const TOLERANCIA = 0.05; // Bs de tolerancia por redondeo

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calcularCreditoFiscal(base: number): number {
  return redondear(base * IVA_RATE);
}

export function calcularHashDedup(f: Factura): string {
  const clave = `${f.nitEmisor}|${f.numeroFactura}|${f.fechaEmision}|${f.importeTotal}`;
  return createHash("sha256").update(clave).digest("hex");
}

export function validarNit(nit: string): boolean {
  // Validación de formato: solo dígitos, longitud razonable.
  // El dígito verificador oficial del NIT debe confirmarse con el SIN antes
  // de activarlo; un algoritmo equivocado rechazaría NITs válidos.
  return /^\d{5,15}$/.test(nit);
}

export function validarFecha(
  fecha: string,
  periodo?: string
): { ok: boolean; motivo?: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { ok: false, motivo: "Formato de fecha inválido (se espera YYYY-MM-DD)" };
  }
  const d = new Date(fecha + "T00:00:00");
  if (Number.isNaN(d.getTime())) return { ok: false, motivo: "Fecha inexistente" };
  if (d.getTime() > Date.now()) return { ok: false, motivo: "La fecha es futura" };
  if (periodo && fecha.slice(0, 7) !== periodo) {
    return { ok: false, motivo: `La fecha no pertenece al período ${periodo}` };
  }
  return { ok: true };
}

export function validarFactura(f: Factura, periodo?: string): ResultadoValidacion {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Montos no negativos
  if (f.importeTotal < 0) errores.push("importeTotal no puede ser negativo");
  if (f.descuentos < 0) errores.push("descuentos no puede ser negativo");
  if (f.importeBaseCreditoFiscal < 0) errores.push("importeBaseCreditoFiscal no puede ser negativo");

  // Coherencia de montos
  if (f.descuentos > f.importeTotal) errores.push("descuentos no puede superar importeTotal");
  if (f.importeBaseCreditoFiscal - f.importeTotal > TOLERANCIA) {
    errores.push("importeBaseCreditoFiscal no puede superar importeTotal");
  }

  // NIT
  if (!validarNit(f.nitEmisor)) errores.push(`NIT del emisor inválido: ${f.nitEmisor}`);
  if (!validarNit(f.nitComprador)) advertencias.push(`NIT del comprador con formato dudoso: ${f.nitComprador}`);

  // Fecha
  const fecha = validarFecha(f.fechaEmision, periodo);
  if (!fecha.ok) errores.push(fecha.motivo!);

  // Campos obligatorios / recomendados
  if (!f.numeroFactura?.trim()) errores.push("Falta el número de factura");
  if (!f.razonSocialEmisor?.trim()) advertencias.push("Falta la razón social del emisor");
  if (!f.numeroAutorizacion?.trim()) advertencias.push("Falta el número de autorización / CUF");

  return {
    valida: errores.length === 0,
    errores,
    advertencias,
    hashDedup: calcularHashDedup(f),
    creditoFiscal: calcularCreditoFiscal(f.importeBaseCreditoFiscal),
  };
}