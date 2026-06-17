import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import dotenv from 'dotenv';
dotenv.config();

const BASE = `http://localhost:${process.env.PORT ?? 3000}`;

async function login(email, password){
  const res = await axios.post(`${BASE}/auth/login`, { email, password });
  return res.data.token;
}

async function upload(token){
  const tmp = path.join(process.cwd(), 'tmp-e2e.pdf');
  fs.writeFileSync(tmp, 'E2E PDF ' + new Date().toISOString());
  const form = new FormData();
  form.append('file', fs.createReadStream(tmp), { filename: 'e2e.pdf', contentType: 'application/pdf' });
  const headers = { ...form.getHeaders(), Authorization: `Bearer ${token}` };
  const res = await axios.post(`${BASE}/api/upload/`, form, { headers, maxBodyLength: Infinity });
  fs.unlinkSync(tmp);
  return res.data.docId;
}

async function analyze(token, docId){
  const res = await axios.post(`${BASE}/api/analizar-scan`, { docId }, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

async function registrar(token, payload){
  const res = await axios.post(`${BASE}/api/registrar`, payload, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}

async function main(){
  try{
    const token = await login('admin@cochatech.com','Password1!');
    console.log('token ok');
    const docId = await upload(token);
    console.log('uploaded docId=', docId);
    let campos = {};
    try {
      const analysis = await analyze(token, docId);
      console.log('analysis:', analysis.extracted?.campos ?? 'no extracted');
      campos = analysis.extracted?.campos || {};
    } catch (e) {
      console.warn('Analysis failed, continuing with fallback payload:', e?.response?.data ?? e.message ?? e);
      campos = {};
    }
    const payload = {
      tipo: campos.tipo || 'venta',
      nitEmisor: campos.nitEmisor || '00000000',
      razonSocialEmisor: campos.razonSocialEmisor || 'Proveedor E2E',
      numeroFactura: campos.numeroFactura || `E2E-${Date.now()}`,
      numeroAutorizacion: campos.numeroAutorizacion || null,
      fechaEmision: campos.fechaEmision || new Date().toISOString(),
      nitComprador: campos.nitComprador || null,
      importeTotal: Number(campos.importeTotal) || 123.45,
      descuentos: Number(campos.descuentos) || 0,
      importeBaseCreditoFiscal: Number(campos.importeBaseCreditoFiscal) || 123.45,
    };

    const reg = await registrar(token, payload);
    console.log('registrar result:', reg);
  }catch(e){
    console.error('E2E error:', e?.response?.data ?? e.message ?? e);
    process.exit(1);
  }
}

main();
