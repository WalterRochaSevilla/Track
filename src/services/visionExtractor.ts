import { ENV } from "../config/environments.js";
import axios from "axios";
import { z } from "zod";
import type { FacturaExtraida } from "../types/factura.js";

const GEMINI_MODEL = ENV.GEMINI_MODEL ?? "gemini-2.5-flash"
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const PROMPT = `Eres un asistente contable boliviano. Extrae los datos de esta factura.
Si un campo no aparece o no se lee con claridad, déjalo vacío.
Para cada campo, indica una confianza entre 0 y 1 según qué tan seguro estás de la lectura.
Los importes deben ser números (sin símbolo de moneda ni separadores de miles).
La fecha en formato YYYY-MM-DD.`;

// Type enums en MAYÚSCULA: así los espera la API REST de Gemini.
const responseSchema = {
  type: "OBJECT",
  properties: {
    nitEmisor: { type: "STRING" },
    razonSocialEmisor: { type: "STRING" },
    numeroFactura: { type: "STRING" },
    numeroAutorizacion: { type: "STRING" },
    fechaEmision: { type: "STRING" },
    nitComprador: { type: "STRING" },
    importeTotal: { type: "NUMBER" },
    descuentos: { type: "NUMBER" },
    importeBaseCreditoFiscal: { type: "NUMBER" },
    confianza: {
      type: "OBJECT",
      properties: {
        nitEmisor: { type: "NUMBER" },
        razonSocialEmisor: { type: "NUMBER" },
        numeroFactura: { type: "NUMBER" },
        numeroAutorizacion: { type: "NUMBER" },
        fechaEmision: { type: "NUMBER" },
        nitComprador: { type: "NUMBER" },
        importeTotal: { type: "NUMBER" },
        descuentos: { type: "NUMBER" },
        importeBaseCreditoFiscal: { type: "NUMBER" },
      },
    },
  },
};

const respuestaZod = z.object({
  nitEmisor: z.string().optional(),
  razonSocialEmisor: z.string().optional(),
  numeroFactura: z.string().optional(),
  numeroAutorizacion: z.string().optional(),
  fechaEmision: z.string().optional(),
  nitComprador: z.string().optional(),
  importeTotal: z.number().optional(),
  descuentos: z.number().optional(),
  importeBaseCreditoFiscal: z.number().optional(),
  confianza: z.record(z.string(), z.number()).optional(),
});

export async function descargarImagenComoBase64(
  url: string
): Promise<{ data: string; mimeType: string }> {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const mimeType = (res.headers["content-type"] as string) ?? "image/jpeg";
  const data = Buffer.from(res.data).toString("base64");
  return { data, mimeType };
}

export async function extraerFacturaDesdeImagen(params: {
  imagenBase64: string;
  mimeType: string;
}): Promise<FacturaExtraida> {
  const apiKey = ENV.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta GEMINI_API_KEY en el archivo .env");

  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: params.mimeType, data: params.imagenBase64 } },
          { text: PROMPT },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  };

  let respuesta;
  try {
    respuesta = await axios.post(ENDPOINT, body, {
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      timeout: 30000,
    });
  } catch (error: any) {
    const detalle = error.response?.data?.error?.message ?? error.message;
    throw new Error(`Error llamando a Gemini: ${detalle}`);
  }

  const texto = respuesta.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) throw new Error("Gemini no devolvió contenido");

  let parseado;
  try {
    parseado = respuestaZod.parse(JSON.parse(texto));
  } catch {
    throw new Error(`No se pudo interpretar la respuesta de Gemini: ${texto}`);
  }

  const { confianza, ...campos } = parseado;
  return {
    campos,
    confianza: (confianza as FacturaExtraida["confianza"]) ?? {},
  };
}