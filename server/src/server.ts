import "reflect-metadata";
import path from 'path';
import dotenv from 'dotenv';

//Reading config from config.env
const environmentConfig = path.join(__dirname, '/config.env');
console.log('Loading config from file', environmentConfig);
dotenv.config({ path: environmentConfig })


import { startServer } from './app';

startServer();