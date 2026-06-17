import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BASE = `http://localhost:${process.env.PORT ?? 3000}`;

async function login(email, password) {
  const res = await axios.post(`${BASE}/auth/login`, { email, password });
  return res.data.token;
}

async function register(token) {
  const payload = {
    tipo: 'venta',
    nitEmisor: '87654321',
    razonSocialEmisor: 'Proveedor SA',
    numeroFactura: 'F001-TEST-0001',
    numeroAutorizacion: null,
    fechaEmision: new Date().toISOString(),
    nitComprador: null,
    importeTotal: 1234.56,
    descuentos: 0,
    importeBaseCreditoFiscal: 1234.56,
  };

  const res = await axios.post(`${BASE}/api/registrar`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Registrar response:', res.data);
}

async function main() {
  try {
    const token = await login('admin@cochatech.com', 'Password1!');
    console.log('Token ok');
    await register(token);
  } catch (err) {
    console.error('Error testRegister:', err?.response?.data ?? err.message ?? err);
    process.exit(1);
  }
}

main();
