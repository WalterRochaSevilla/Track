import { test } from "node:test";
import assert from "node:assert/strict";
import { validarFactura, calcularHashDedup, validarNit, IVA_RATE } from "./validarFactura.js";
import type { Factura } from "../types/factura.js";

const base: Factura = {
  empresaId: "emp-1",
  tipo: "compra",
  nitEmisor: "1023456789",
  razonSocialEmisor: "Proveedor SRL",
  numeroFactura: "001234",
  numeroAutorizacion: "29040011007",
  fechaEmision: "2026-05-10",
  nitComprador: "9876543",
  importeTotal: 1130,
  descuentos: 0,
  importeBaseCreditoFiscal: 1130,
};

test("factura válida no tiene errores", () => {
  const r = validarFactura(base, "2026-05");
  assert.equal(r.valida, true);
  assert.deepEqual(r.errores, []);
});

test("crédito fiscal es 13% de la base", () => {
  const r = validarFactura(base);
  assert.equal(r.creditoFiscal, Math.round(base.importeBaseCreditoFiscal * IVA_RATE * 100) / 100);
});

test("rechaza base mayor al total", () => {
  const r = validarFactura({ ...base, importeBaseCreditoFiscal: 2000 });
  assert.equal(r.valida, false);
});

test("rechaza NIT no numérico", () => {
  assert.equal(validarNit("12AB34"), false);
});

test("rechaza fecha fuera de período", () => {
  const r = validarFactura(base, "2026-06");
  assert.equal(r.valida, false);
});

test("hash de dedup es determinista y distingue duplicados", () => {
  assert.equal(calcularHashDedup(base), calcularHashDedup({ ...base }));
  assert.notEqual(calcularHashDedup(base), calcularHashDedup({ ...base, numeroFactura: "999" }));
});