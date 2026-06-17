import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { ENV } from "../config/environments.js";
import { Factura } from "../database/entities/Factura.js";

export interface FacturaExtraida {
  campos: Partial<Factura>;
  confianza: Record<string, number>;
  metadatos: {
    modalidadFacturacion: string;
    codigoControl: string | null;
    cuf: string | null;
    actividadEconomica: string | null;
    leyenda: string | null;
    lugarEmision: string | null;
    literalTotal: string | null;
  };
}

/**
 * Service to extract invoice data from an image file using Gemini 1.5 Flash.
 * Optimized for Bolivian tax invoices (SIN / SIAT) with structured JSON output.
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
    // Asegurarse de que filePath sea una ruta absoluta y segura antes de leer.
    // La validación de path traversal se realiza en el router (api.ts) antes de llamar a este servicio.
    // Aquí solo nos aseguramos de que el archivo exista y sea accesible.

    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(filePath);
    } catch (err) {
      throw new Error(`No se pudo leer el archivo en ${filePath}: ${(err as Error).message}`);
    }

    const base64Data = fileBuffer.toString("base64");
    return this.extractFromBase64(base64Data, mimetype);
  }

  async extractFromBase64(base64Data: string, mimetype: string): Promise<FacturaExtraida> {
    if (!this.apiKey) {
      throw new Error("No se puede realizar la extracción: GEMINI_API_KEY no configurado.");
    }

    // 2. Prepare the payload for Gemini API with an expert-level prompt
    const model = ENV.GEMINI_MODEL || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const prompt = `Eres un sistema experto de OCR contable especializado en facturas del Estado Plurinacional de Bolivia, reguladas por el Servicio de Impuestos Nacionales (SIN) bajo la modalidad de Facturación en Línea (Ley 843 y RND 102100000011).

ANALIZA la imagen de la factura adjunta y extrae TODOS los campos con la máxima precisión.

INSTRUCCIONES CRÍTICAS:
1. TIPO DE FACTURA: Determina si es una factura de COMPRA (gasto recibido por la empresa, la empresa es el comprador) o VENTA (emitida por la empresa, la empresa es el vendedor). Si no se puede determinar con certeza, usa 'compra' como valor por defecto.
2. NIT: Los NITs bolivianos son numéricos de 7 a 13 dígitos. Extrae cada dígito con cuidado. No confundas 0 con O, 1 con l, 8 con B.
3. CUF / CÓDIGO DE CONTROL (OPCIONAL — NO OBLIGATORIO): Solo las facturas en línea o computarizadas tienen CUF, y solo las computarizadas antiguas tienen Código de Control. Las facturas MANUALES NO tienen ninguno de los dos. Si la factura es manual o no los ves con claridad, devuelve null en esos campos. NUNCA inventes un CUF ni un código de control.
4. IMPORTES: Usa puntos para miles y coma para decimales en Bolivia (ej: 1.234,50). Sin embargo, devuelve los valores como NÚMEROS sin formato (ej: 1234.50).
5. FECHA: Extrae en formato YYYY-MM-DD estricto.
6. Si el NIT del comprador dice "S/N", "Sin Nombre", "0" o está vacío, devuelve "0".
7. DESCUENTOS: Si no aparecen descuentos visibles, devuelve 0.
8. BASE CRÉDITO FISCAL: En facturas bolivianas normalmente coincide con el importe total (menos descuentos). Si no se ve explícitamente, calcula Total - Descuentos.
9. CONFIANZA: Evalúa de forma REALISTA y HONESTA la legibilidad de cada campo en la imagen:
   - 1.0 = texto perfectamente legible, sin ambigüedad
   - 0.8-0.9 = legible con alta certeza pero podría haber leve degradación
   - 0.5-0.7 = parcialmente legible, hay ambigüedad en algunos caracteres
   - 0.0-0.4 = muy difícil de leer o el campo no está presente
10. METADATOS ADICIONALES: Extrae información contextual como la modalidad de facturación, actividad económica, leyenda fiscal, lugar de emisión y el total literal si están visibles.`;

    const responseSchema = {
      type: "OBJECT",
      properties: {
        campos: {
          type: "OBJECT",
          properties: {
            tipo: {
              type: "STRING",
              enum: ["compra", "venta"],
              description: "Tipo: 'compra' si la empresa recibe la factura, 'venta' si la empresa emite."
            },
            nitEmisor: {
              type: "STRING",
              description: "NIT del emisor (razón social que emitió la factura). Solo dígitos."
            },
            razonSocialEmisor: {
              type: "STRING",
              description: "Razón social completa del emisor de la factura."
            },
            numeroFactura: {
              type: "STRING",
              description: "Número de factura impreso en el documento."
            },
            numeroAutorizacion: {
              type: "STRING",
              description: "Número de autorización de la factura (SIN). Si es electrónica, puede ser parte del CUF."
            },
            fechaEmision: {
              type: "STRING",
              description: "Fecha de emisión en formato YYYY-MM-DD."
            },
            nitComprador: {
              type: "STRING",
              description: "NIT del comprador/cliente. Si dice S/N o no tiene, devolver '0'."
            },
            importeTotal: {
              type: "NUMBER",
              description: "Importe total facturado en bolivianos (Bs)."
            },
            descuentos: {
              type: "NUMBER",
              description: "Descuentos, rebajas y/o bonificaciones sujetas al IVA."
            },
            importeBaseCreditoFiscal: {
              type: "NUMBER",
              description: "Importe base para crédito fiscal (IVA 13%). Generalmente = Total - Descuentos."
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
            tipo: { type: "NUMBER", description: "Confianza de 0.0 a 1.0 en la clasificación compra/venta." },
            nitEmisor: { type: "NUMBER", description: "Confianza en la lectura del NIT del emisor." },
            razonSocialEmisor: { type: "NUMBER", description: "Confianza en la razón social del emisor." },
            numeroFactura: { type: "NUMBER", description: "Confianza en el número de factura." },
            numeroAutorizacion: { type: "NUMBER", description: "Confianza en el número de autorización/CUF." },
            fechaEmision: { type: "NUMBER", description: "Confianza en la fecha de emisión." },
            nitComprador: { type: "NUMBER", description: "Confianza en el NIT del comprador." },
            importeTotal: { type: "NUMBER", description: "Confianza en el importe total." },
            descuentos: { type: "NUMBER", description: "Confianza en los descuentos." },
            importeBaseCreditoFiscal: { type: "NUMBER", description: "Confianza en la base de crédito fiscal." }
          },
          required: [
            "tipo", "nitEmisor", "razonSocialEmisor", "numeroFactura",
            "fechaEmision", "nitComprador", "importeTotal", "descuentos",
            "importeBaseCreditoFiscal"
          ]
        },
        metadatos: {
          type: "OBJECT",
          properties: {
            modalidadFacturacion: {
              type: "STRING",
              description: "Modalidad: 'Facturación en Línea', 'Facturación Computarizada', 'Facturación Manual', 'Facturación Electrónica' u 'Desconocida'."
            },
            codigoControl: {
              type: "STRING",
              nullable: true,
              description: "Código de control (solo facturas computarizadas antiguas, formato XX-XX-XX-XX). Null en facturas manuales o si no aplica."
            },
            cuf: {
              type: "STRING",
              nullable: true,
              description: "Código Único de Facturación (solo facturas en línea/electrónicas). Null en facturas manuales o si no existe."
            },
            actividadEconomica: {
              type: "STRING",
              nullable: true,
              description: "Actividad económica del emisor, si está visible. Null si no se ve."
            },
            leyenda: {
              type: "STRING",
              nullable: true,
              description: "Leyenda fiscal obligatoria de la factura. Null si no se lee."
            },
            lugarEmision: {
              type: "STRING",
              nullable: true,
              description: "Ciudad o lugar de emisión de la factura. Null si no aparece."
            },
            literalTotal: {
              type: "STRING",
              nullable: true,
              description: "El importe total expresado en letras (literal). Null si no está visible."
            }
          },
          required: ["modalidadFacturacion"]
        }
      },
      required: ["campos", "confianza", "metadatos"]
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

    // 3. Perform the request with retry logic for 429 rate limits
    let attempts = 0;
    const maxAttempts = 5;
    let delay = 5000;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.post(url, payload, {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": this.apiKey,
          },
          timeout: 45000
        });

        const textOutput = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textOutput) {
          throw new Error("Gemini retornó una respuesta vacía o sin contenido.");
        }

        const extractedData = JSON.parse(textOutput) as FacturaExtraida;

        if (!extractedData.metadatos) {
          extractedData.metadatos = {
            modalidadFacturacion: "Desconocida",
            codigoControl: null,
            cuf: null,
            actividadEconomica: null,
            leyenda: null,
            lugarEmision: null,
            literalTotal: null,
          };
        }

        return extractedData;
      } catch (err: any) {
        attempts++;
        const isTransient = err.response?.status === 429 || err.response?.status === 503 || err.message?.includes("429") || err.message?.includes("503");
        if (isTransient && attempts < maxAttempts) {
          let waitTime = delay;
          const retryDelayStr = err.response?.data?.error?.details?.find(
            (d: any) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo"
          )?.retryDelay;
          if (retryDelayStr) {
            const parsedSeconds = parseInt(retryDelayStr);
            if (!isNaN(parsedSeconds)) {
              waitTime = (parsedSeconds + 2) * 1000;
            }
          }
          console.warn(`⚠️ [Gemini API] Transient error (${err.response?.status || 'network'}). Retrying attempt ${attempts}/${maxAttempts} in ${waitTime / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          delay *= 2;
          continue;
        }

        const errorDetail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        throw new Error(`Fallo en la llamada a Gemini API: ${errorDetail}`);
      }
    }
    throw new Error("Fallo en la llamada a Gemini API: Máximo de reintentos alcanzado por límite de cuota (429).");
  }
}

const instance = new VisionExtractor();

export async function extraerFacturaDesdeImagen(params: {
  imagenBase64: string;
  mimeType: string;
}): Promise<FacturaExtraida> {
  return instance.extractFromBase64(params.imagenBase64, params.mimeType);
}

export async function descargarImagenComoBase64(
  url: string
): Promise<{ data: string; mimeType: string }> {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const mimeType = (res.headers["content-type"] as string) ?? "image/jpeg";
  const data = Buffer.from(res.data).toString("base64");
  return { data, mimeType };
}
