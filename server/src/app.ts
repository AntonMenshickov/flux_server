import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import apiRouter from './routes';

const app = express();

app.use(cors());
app.use(bodyParser.json());
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

export default app;
