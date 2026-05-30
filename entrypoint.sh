#!/bin/bash
set -e

echo "=========================================================="
echo " Starting DaraNet Customer & Billing Management System"
echo "=========================================================="

echo "Waiting for database to be ready..."
node -e "
const { Client } = require('pg');
const connectionString = process.env.DATABASE_URL;

async function check() {
  for (let i = 0; i < 30; i++) {
    const client = new Client({ connectionString });
    try {
      await client.connect();
      console.log('Database connection established successfully!');
      await client.end();
      process.exit(0);
    } catch (e) {
      console.log('Database not ready yet, retrying in 2 seconds (' + (i + 1) + '/30)...');
      try { await client.end(); } catch (err) {}
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  console.error('Failed to connect to the database after 60 seconds.');
  process.exit(1);
}
check();
"

echo "Database is online. Syncing database schema with Prisma..."
npx prisma db push

echo "Seeding database with default internet packages and premium mock data..."
node prisma/seed.js || echo "Seeding bypassed or already done."

echo "Building Next.js application (production bundle)..."
npm run build

echo "Launching DaraNet production server on port 3000..."
exec npm run start
