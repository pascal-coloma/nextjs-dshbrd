import bcrypt from 'bcrypt';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';
import { pool } from '@/db';

async function seedUsers(client: any) {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `);

  await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Conflicto por email (lo más común) o por id (si estás fijando ids)
      return client.query(
        `
        INSERT INTO users (id, name, email, password)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING;
        `,
        [user.id, user.name, user.email, hashedPassword],
      );
    }),
  );
}

async function seedCustomers(client: any) {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `);

  await Promise.all(
    customers.map((customer) =>
      client.query(
        `
        INSERT INTO customers (id, name, email, image_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING;
        `,
        [customer.id, customer.name, customer.email, customer.image_url],
      ),
    ),
  );
}

async function seedInvoices(client: any) {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL REFERENCES customers(id),
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `);

  await Promise.all(
    invoices.map((invoice) =>
      client.query(
        `
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING;
        `,
        [invoice.customer_id, invoice.amount, invoice.status, invoice.date],
      ),
    ),
  );
}

async function seedRevenue(client: any) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `);

  await Promise.all(
    revenue.map((rev) =>
      client.query(
        `
        INSERT INTO revenue (month, revenue)
        VALUES ($1, $2)
        ON CONFLICT (month) DO NOTHING;
        `,
        [rev.month, rev.revenue],
      ),
    ),
  );
}

export async function GET() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await seedUsers(client);
    await seedCustomers(client);
    await seedInvoices(client);
    await seedRevenue(client);

    await client.query('COMMIT');
    return Response.json({ message: 'Database seeded successfully' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return Response.json(
      { error: error?.message ?? String(error) },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}