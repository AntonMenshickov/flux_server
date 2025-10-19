import "reflect-metadata";
import path from 'path';
import dotenv from 'dotenv';

//Reading config from config.env
const environmentConfig = path.join(__dirname, '/config.env');
console.log('Loading config from file', environmentConfig);
const configLoadResult = dotenv.config({ path: environmentConfig })

if (configLoadResult.error) {
  console.error(configLoadResult.error);
}

import { container } from 'tsyringe';
import { ConfigService } from './services/configService';

container.resolve(ConfigService);


import { startServer } from './app';

startServer();