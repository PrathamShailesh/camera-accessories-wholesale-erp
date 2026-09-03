import { PrismaClient } from '@prisma/client';

const passwords = [
  'postgres',
  'admin',
  'root',
  '123456',
  '1234',
  '12345',
  'password',
  'Pratham',
  'pratham',
  'Pratham@123',
  'pratham123',
  'postgrespassword',
  'Pass@123',
  'root123',
  'admin123',
  '12345678',
  'camera_erp',
  'camera',
  'wholesale',
];

async function test() {
  for (const pwd of passwords) {
    const url = `postgresql://postgres:${encodeURIComponent(pwd)}@localhost:5432/postgres?schema=public`;
    const p = new PrismaClient({ datasources: { db: { url } } });
    try {
      await p.$connect();
      console.log('SUCCESS_PASSWORD_FOUND:', pwd);
      await p.$disconnect();
      return;
    } catch (e: any) {
      await p.$disconnect();
    }
  }
  console.log('NO_MATCH_FOUND');
}

test();
