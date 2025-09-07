import { Router } from 'express';
import { auth } from './auth';
import { refresh } from './refresh';

export default function authModule(router: Router) {
  router.post('/auth', auth);
  router.post('/auth/refresh', refresh);

  console.log('Auth module loaded');
}