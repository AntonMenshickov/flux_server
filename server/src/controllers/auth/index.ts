import { Router } from 'express';
import { auth, authValidateSchema } from './auth';
import { refresh, refreshValidateSchema } from './refresh';
import { validate } from '../../middleware/validate';

export default function authModule(router: Router) {
  router.post('/auth', validate(authValidateSchema),  auth);
  router.post('/auth/refresh', validate(refreshValidateSchema), refresh);

  console.log('Auth module loaded');
}