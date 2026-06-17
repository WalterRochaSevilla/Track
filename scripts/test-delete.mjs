import axios from 'axios';
(async ()=>{
  try {
    const creds = { email: 'admin@cochatech.com', password: 'Password1!' };
    const loginRes = await axios.post('http://localhost:3000/auth/login', creds);
    const token = loginRes.data.token;
    console.log('TOKEN:', token);
    const headers = { Authorization: `Bearer ${token}` };

    const listRes = await axios.get('http://localhost:3000/api/facturas', { headers });
    const facturas = listRes.data;
    console.log('COUNT BEFORE:', facturas.length);
    if (!facturas.length) return console.log('NO_FACTURAS');
    const id = facturas[0].id;
    console.log('DELETE ID:', id);
    const delRes = await axios.delete(`http://localhost:3000/api/facturas/${id}`, { headers });
    console.log('DELETE STATUS:', delRes.status, delRes.data);

    const afterRes = await axios.get('http://localhost:3000/api/facturas', { headers });
    console.log('COUNT AFTER:', afterRes.data.length);
    console.log(JSON.stringify(afterRes.data.slice(0,5), null, 2));
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
    process.exit(1);
  }
})();
