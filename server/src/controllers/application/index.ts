import { Router } from 'express';
import { addApp, addAppValidateSchema } from './addApp';
import { validate } from '../../middleware/validate';
import { deleteApp, deleteAppValidateSchema } from './deleteApp';
import { searchApps, searchAppsValidateSchema } from './searchApp';
import { appSetBundleIds, appSetBundleIdsValidateSchema } from './appSetBundleIds';
import { appSetMaintainers, appSetMaintainersValidateSchema } from './appSetMaintainers';
import { userAuthorizationRequired } from '../../middleware/authorizationRequired';
import { updateApp, updateAppValidateSchema } from './updateApp';

export default function applicationsModule(router: Router) {
  router.post('/applications/add', userAuthorizationRequired, validate(addAppValidateSchema), addApp);
  router.put('/applications/update', userAuthorizationRequired, validate(updateAppValidateSchema), updateApp);
  router.put('/applications/set-bundles', userAuthorizationRequired, validate(appSetBundleIdsValidateSchema), appSetBundleIds);
  router.put('/applications/set-maintainers', userAuthorizationRequired, validate(appSetMaintainersValidateSchema), appSetMaintainers);
  router.delete('/applications/delete', userAuthorizationRequired, validate(deleteAppValidateSchema), deleteApp);
  router.get('/applications/search', userAuthorizationRequired, validate(searchAppsValidateSchema), searchApps);

  console.log('Application module loaded');
}