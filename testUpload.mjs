import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();
const BASE = `http://localhost:${process.env.PORT ?? 3000}`;

async function login(email, password) {
  const res = await axios.post(`${BASE}/auth/login`, { email, password });
  return res.data.token;
}

async function uploadFile(token) {
  const tmp = path.join(process.cwd(), 'tmp-upload.pdf');
  fs.writeFileSync(tmp, 'PDF-DUMMY-CONTENT ' + new Date().toISOString());

  const form = new FormData();
  form.append('file', fs.createReadStream(tmp), { filename: 'tmp-upload.pdf', contentType: 'application/pdf' });

  const headers = { ...form.getHeaders(), Authorization: `Bearer ${token}` };
  const res = await axios.post(`${BASE}/api/upload/`, form, { headers, maxBodyLength: Infinity });
  console.log('Upload response:', res.data);
  fs.unlinkSync(tmp);
}

async function main() {
  try {
    const token = await login('test@empresa.com', 'Password1!');
    console.log('Token obtenido ok');
    await uploadFile(token);
  } catch (err) {
    console.error('Error en testUpload:', err?.response?.data ?? err.message ?? err);
    process.exit(1);
  }
}

main();
