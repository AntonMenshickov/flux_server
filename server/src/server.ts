import "reflect-metadata";
import path from 'path';
import dotenv from 'dotenv';

const environmentConfig = path.join(__dirname, '/config.env');
dotenv.config({ path: environmentConfig })


import { startServer } from './app';

startServer();