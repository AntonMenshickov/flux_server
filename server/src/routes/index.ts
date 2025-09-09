import { Router } from 'express';
import authModule from '../controllers/auth';
import userModule from '../controllers/user';
import applicationsModule from '../controllers/application';

const router = Router();

authModule(router);
userModule(router);
applicationsModule(router);


export default router;
