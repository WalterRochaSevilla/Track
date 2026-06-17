import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Client } = pg;
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}
const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const DOC = process.argv[2];
if (!DOC) {
  console.error('Usage: node queryUpload.mjs <docId>');
  process.exit(1);
}

async function main() {
  await client.connect();
  const res = await client.query('SELECT * FROM uploads WHERE doc_id = $1', [DOC]);
  console.log('rows:', res.rows);
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
