// Parse Server local para desenvolvimento/testes.
// Sobe um MongoDB embutido (mongodb-memory-server) gravando em server/.data/db,
// então os dados sobrevivem a reinícios. Use `npm run db:reset` para zerar.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ParseServer } from 'parse-server';
import { APP_ID, JAVASCRIPT_KEY, MASTER_KEY, PORT, MOUNT, SERVER_URL } from './config.js';
import { seed } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '.data', 'db');
fs.mkdirSync(dbPath, { recursive: true });

const mongo = await MongoMemoryServer.create({
  instance: { dbName: 'loja', dbPath, storageEngine: 'wiredTiger' },
});

const parseServer = new ParseServer({
  databaseURI: mongo.getUri('loja'),
  appId: APP_ID,
  javascriptKey: JAVASCRIPT_KEY,
  masterKey: MASTER_KEY,
  serverURL: SERVER_URL,
  allowClientClassCreation: true,
  // Permite que o cliente crie/edite os dados sem configurar CLPs — só para dev.
  directAccess: true,
  cloud: () => {
    // Stub do PIX: devolve um QR fake para o fluxo de checkout não quebrar local.
    Parse.Cloud.define('createPixPayment', async (request) => {
      const { total, description } = request.params;
      const payload = `PIX-LOCAL|${description}|${Number(total).toFixed(2)}`;
      return {
        payment_id: `local_${Date.now()}`,
        qr_code: payload,
        qr_code_base64: Buffer.from(payload).toString('base64'),
      };
    });
  },
});

await parseServer.start();

const app = express();
app.use(MOUNT, parseServer.app);
app.listen(PORT, async () => {
  console.log(`\n  Parse Server local: ${SERVER_URL}`);
  await seed();
});

const shutdown = async () => {
  await mongo.stop();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
