import { Router } from 'express';
import authModule from '../controllers/auth';
import userModule from '../controllers/user';
import applicationsModule from '../controllers/application';
import eventsModule from '../controllers/events';

const router = Router();

authModule(router);
userModule(router);
applicationsModule(router);
eventsModule(router);


export default router;
