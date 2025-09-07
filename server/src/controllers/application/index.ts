import { Router } from 'express';
import { addApp, addAppValidateSchema } from './addApp';
import { validate } from '../../middleware/validate';

export default function authModule(router: Router) {
  router.post('/application/add', validate(addAppValidateSchema), addApp);

  console.log('Application module loaded');
}