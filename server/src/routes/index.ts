import { Router } from 'express';
import authModule from '../controllers/auth';
import userModule from '../controllers/user';
import applicationsModule from '../controllers/application';
import eventsModule from '../controllers/events';
import eventsFilterModule from '../controllers/eventsFilter';
import websocketModule from '../controllers/websocket';

const router = Router();

authModule(router);
userModule(router);
applicationsModule(router);
eventsModule(router);
eventsFilterModule(router);
websocketModule(router);


export default router;
