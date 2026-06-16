import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { ENV } from "../config/environments.js";
import { Factura } from "../database/entities/Factura.js";

export interface FacturaExtraida {
  campos: Partial<Factura>;
  confianza: Record<string, number>;
}

/**
 * Service to extract invoice data from an image file using Gemini 1.5 Flash.
 */
export class VisionExtractor {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = ENV.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.error("⚠️ GEMINI_API_KEY is not set in environment configuration.");
    }
  }

  /**
   * Extracts invoice details from a locally stored image file.
   * @param filePath Absolute or relative path to the image file.
   * @param mimetype The MIME type of the file (e.g. image/png, image/jpeg).
   */
  async extract(filePath: string, mimetype: string): Promise<FacturaExtraida> {
    if (!this.apiKey) {
      throw new Error("No se puede realizar la extracción: GEMINI_API_KEY no configurado.");
    }

    // 1. Read file and encode to base64
    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(filePath);
    } catch (err) {
      throw new Error(`No se pudo leer el archivo en ${filePath}: ${(err as Error).message}`);
    }

    const base64Data = fileBuffer.toString("base64");

    // 2. Prepare the payload for Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

    const prompt = `Analiza la imagen de la factura boliviana adjunta y extrae todos los campos contables requeridos.
    Determina si es una compra o una venta:
    - Si es de compras (es decir, una factura de gastos recibida por la empresa), pon 'compra'.
    - Si es de ventas (emitida por la propia empresa), pon 'venta'.
    Identifica cada campo con cuidado y evalúa de manera realista la nitidez y legibilidad de cada dato para asignar un valor de confianza de 0.0 a 1.0 (donde 1.0 es legible al 100% y 0.0 es ilegible o inexistente).
    Asegúrate de extraer la fecha de emisión en formato YYYY-MM-DD. Si no hay descuentos visibles, pon 0.`;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        campos: {
          type: "OBJECT",
          properties: {
            tipo: {
              type: "STRING",
              enum: ["compra", "venta"],
              description: "tipo de factura: 'compra' (recibida) o 'venta' (emitida)"
            },
            nitEmisor: {
              type: "STRING",
              description: "NIT del emisor de la factura"
            },
            razonSocialEmisor: {
              type: "STRING",
              description: "Razón social o nombre del emisor"
            },
            numeroFactura: {
              type: "STRING",
              description: "Número de factura"
            },
            numeroAutorizacion: {
              type: "STRING",
              description: "Número de autorización o CUF"
            },
            fechaEmision: {
              type: "STRING",
              description: "Fecha de emisión en formato YYYY-MM-DD"
            },
            nitComprador: {
              type: "STRING",
              description: "NIT del comprador/cliente"
            },
            importeTotal: {
              type: "NUMBER",
              description: "Importe total facturado"
            },
            descuentos: {
              type: "NUMBER",
              description: "Descuentos, rebajas o bonificaciones"
            },
            importeBaseCreditoFiscal: {
              type: "NUMBER",
              description: "Importe base para el IVA / crédito fiscal"
            }
          },
          required: [
            "tipo",
            "nitEmisor",
            "razonSocialEmisor",
            "numeroFactura",
            "fechaEmision",
            "nitComprador",
            "importeTotal",
            "descuentos",
            "importeBaseCreditoFiscal"
          ]
        },
        confianza: {
          type: "OBJECT",
          properties: {
            tipo: { type: "NUMBER", description: "Confianza en la detección del tipo (0.0 a 1.0)" },
            nitEmisor: { type: "NUMBER", description: "Confianza en la detección del NIT del emisor (0.0 a 1.0)" },
            razonSocialEmisor: { type: "NUMBER", description: "Confianza en la detección de la razón social (0.0 a 1.0)" },
            numeroFactura: { type: "NUMBER", description: "Confianza en la detección del número de factura (0.0 a 1.0)" },
            numeroAutorizacion: { type: "NUMBER", description: "Confianza en la detección del número de autorización/CUF (0.0 a 1.0)" },
            fechaEmision: { type: "NUMBER", description: "Confianza en la detección de la fecha de emisión (0.0 a 1.0)" },
            nitComprador: { type: "NUMBER", description: "Confianza en la detección del NIT del comprador (0.0 a 1.0)" },
            importeTotal: { type: "NUMBER", description: "Confianza en la detección del importe total (0.0 a 1.0)" },
            descuentos: { type: "NUMBER", description: "Confianza en la detección del descuento (0.0 a 1.0)" },
            importeBaseCreditoFiscal: { type: "NUMBER", description: "Confianza en la detección de la base imponible (0.0 a 1.0)" }
          },
          required: [
            "tipo",
            "nitEmisor",
            "razonSocialEmisor",
            "numeroFactura",
            "fechaEmision",
            "nitComprador",
            "importeTotal",
            "descuentos",
            "importeBaseCreditoFiscal"
          ]
        }
      },
      required: ["campos", "confianza"]
    };

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimetype,
                data: base64Data
              }
            },
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    };

    // 3. Perform the request
    try {
      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      const textOutput = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) {
        throw new Error("Gemini retornó una respuesta vacía o sin contenido.");
      }

      // 4. Parse the structured JSON response
      const extractedData = JSON.parse(textOutput) as FacturaExtraida;
      return extractedData;
    } catch (err: any) {
      const errorDetail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      throw new Error(`Fallo en la llamada a Gemini API: ${errorDetail}`);
    }
  }
}
