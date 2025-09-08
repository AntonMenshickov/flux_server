import { Router, Request, Response } from 'express';
import { authorizationRequired } from '../middleware/authorizationRequired';
import authModule from '../controllers/auth';
import userModule from '../controllers/user';
import applicationsModule from '../controllers/application';

const router = Router();

authModule(router);
userModule(router);
applicationsModule(router);

router.get('/hello', (_req: Request, res: Response) => {
  res.json({ message: 'Hello from TypeScript Express server' });
});

// Protected route (local JWT)
router.get('/protected', authorizationRequired, (req: Request, res: Response) => {
  res.json({ message: 'Protected (JWT) data', user: (req as any).user });
});


export default router;
