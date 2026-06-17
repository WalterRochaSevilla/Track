(async () => {
  try {
    const loginRes = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@cochatech.com', password: 'Password1!' })
    });
    const loginJson = await loginRes.json();
    console.log('login', loginRes.status, JSON.stringify(loginJson));
    if (!loginJson?.token) return;
    const token = loginJson.token;
    const registrarRes = await fetch('http://localhost:3000/api/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tipo: 'venta',
        nitEmisor: '123456022',
        razonSocialEmisor: 'EXPORTADORA ITAJU S.R.L.',
        numeroFactura: '911',
        numeroAutorizacion: null,
        fechaEmision: new Date().toISOString(),
        nitComprador: '0',
        importeTotal: 69600,
        descuentos: 0,
        importeBaseCreditoFiscal: 0
      })
    });
    const registrarJson = await registrarRes.json();
    console.log('registrar', registrarRes.status, JSON.stringify(registrarJson));
    const facturasRes = await fetch('http://localhost:3000/api/facturas', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const facturasJson = await facturasRes.json();
    console.log('facturas', facturasRes.status, JSON.stringify(facturasJson?.length ?? facturasJson));
  } catch (err) {
    console.error(err);
  }
})();
