import { Router, Request, Response } from 'express';
import { jwtAuth } from '../middleware/jwtAuth';
import { auth } from '../controllers/auth';

const router = Router();

router.post('/auth', auth);

router.get('/hello', (_req: Request, res: Response) => {
  res.json({ message: 'Hello from TypeScript Express server' });
});

// Protected route (local JWT)
router.get('/protected', jwtAuth, (req: Request, res: Response) => {
  res.json({ message: 'Protected (JWT) data', user: (req as any).user });
});


export default router;
