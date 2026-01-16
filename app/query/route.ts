import { pool } from '@/db';

async function listInvoices(client:any) {
	const data = await client.query(`
    SELECT invoices.amount, customers.name
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666;
  `);

	return data;
}

export async function GET() {
  const client = await pool.connect();
  try {
  	return Response.json(await listInvoices(client));
  } catch (error:any) {
  	return Response.json({ error: error?.message ?? String(error) }, { status: 500 });
  }
}
