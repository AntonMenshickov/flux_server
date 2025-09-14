import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import apiRouter from './routes';
import { websocket } from './websocket/ws';
import expressWs from 'express-ws';
import dotenv from 'dotenv';
import { connect } from 'mongoose';
import { CLickhouse } from './clickhouse/clickhouse';
import { ReliableBatchQueue } from './eventsQueue/reliableBatchQueue';

const environmentConfig = path.join(__dirname, '/config.env');
dotenv.config({ path: environmentConfig })

export async function startServer() {
  console.log('Connecting to MongoDB...');
  await connect(`mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}`);
  console.log('Connected to MongoDB');

  const clickhouse: CLickhouse = CLickhouse.instance;
  console.log('Checking ClickHouse database...');
  await clickhouse.ensureDatabase();
  console.log('Checking ClickHouse table...');
  // await clickhouse.clearTable();
  // await clickhouse.dropTable();
  await clickhouse.ensureTable();

  ReliableBatchQueue.instance.init();

  const app = express();
  const wsInstance = expressWs(app);
  const { app: wsApp } = wsInstance;


  wsApp.ws('/ws', websocket);
  app.use(cors());
  app.use((req, res, next) => {
    if (req.path === '/api/events/add') return next();
    bodyParser.json()(req, res, next)
  });
  app.use('/api', apiRouter);

  // Simple health route
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Serve static if a frontend build exists at ../web/dist
  const frontendDist = path.join(__dirname, '../../web/dist');
  app.use(express.static(frontendDist));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
      if (err) next(err);
    });
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}
