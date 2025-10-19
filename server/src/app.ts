import 'express-async-errors';
import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import apiRouter from './routes';
import { websocket } from './websocket/ws';
import expressWs from 'express-ws';
import { connect } from 'mongoose';
import { ReliableBatchQueue } from './eventsQueue/reliableBatchQueue';
import path from 'path';
import { ApplicationStatsCleanupService } from './services/applicationStatsCleanup';
import { container } from 'tsyringe';
import { Postgres } from './database/postgres';
import { ConfigService } from './services/configService';


export async function startServer() {
  const config = container.resolve(ConfigService);
  console.log('Connecting to MongoDB...');
  await connect(`mongodb://${config.mongoHost}:${config.mongoPort}/${config.mongoDatabase}`);
  console.log('Connected to MongoDB');

  // Schedule Mongo ApplicationStats cleanup
  container.resolve(ApplicationStatsCleanupService).init();

  const postgres = container.resolve(Postgres);
  await postgres.ensureInitialized();

  await container.resolve(ReliableBatchQueue).init();

  const app = express();
  const wsInstance = expressWs(app);
  const { app: wsApp } = wsInstance;


  wsApp.ws('/ws', websocket);
  app.use(cors());

  // Serve static if a frontend build exists at ../web/dist
  const frontendDist = path.join(__dirname, '../../web/dist');
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    const now = new Date();
    console.info(`REQUEST ${now.toUTCString()} ${[req.method]} ${req.url}`)
    return next();
  })
  app.use((req, res, next) => {
    if (req.path === '/api/events/add') return next();
    bodyParser.json()(req, res, next)
  });
  app.use('/api', apiRouter);

  // Simple health route
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));


  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
      if (err) next(err);
    });
  });

  const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    const now = new Date();
    console.info(`ERROR ${now.toUTCString()} ${[req.method]} ${req.url}`)
    console.error(err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  };
  app.use(errorHandler);

  const port = config.port;
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}
