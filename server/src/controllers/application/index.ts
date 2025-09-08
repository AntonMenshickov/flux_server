import { Router } from 'express';
import { addApp, addAppValidateSchema } from './addApp';
import { validate } from '../../middleware/validate';
import { deleteApp, deleteAppValidateSchema } from './deleteApp';
import { searchApps, searchAppsValidateSchema } from './searchApp';

export default function applicationsModule(router: Router) {
  router.post('/applications/add', validate(addAppValidateSchema), addApp);
  router.delete('/applications/delete', validate(deleteAppValidateSchema), deleteApp);
  router.get('/applications/search', validate(searchAppsValidateSchema), searchApps);

  console.log('Application module loaded');
}