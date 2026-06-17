import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const BASE = `http://localhost:${process.env.PORT ?? 3000}`;
async function main(){
  try{
    const login = await axios.post(`${BASE}/auth/login`, { email: 'test@empresa.com', password: 'Password1!' });
    const token = login.data.token;
    const res = await axios.get(`${BASE}/api/facturas`, { headers: { Authorization: `Bearer ${token}` }, params: { fechaInicio: new Date(Date.now()-1000*60*60*24*120).toISOString(), fechaFin: new Date().toISOString() } });
    console.log('Facturas:', res.data);
  }catch(e){ console.error(e?.response?.data ?? e.message); process.exit(1); }
}
main();
