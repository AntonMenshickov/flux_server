import { Router } from 'express';
import { addApp, addAppValidateSchema } from './addApp';
import { validate } from '../../middleware/validate';
import { deleteApp, deleteAppValidateSchema } from './deleteApp';
import { searchApps, searchAppsValidateSchema } from './searchApp';
import { appSetBundleIds, appSetBundleIdsValidateSchema } from './appSetBundleIds';
import { appSetMaintainers, appSetMaintainersValidateSchema } from './appSetMaintainers';
import { userAuthorizationRequired } from '../../middleware/authorizationRequired';
import { updateApp, updateAppValidateSchema } from './updateApp';
import { searchAppStats, searchAppStatsValidateSchema } from './searchAppStats';
import { getAppStats, getAppStatsValidateSchema } from './getAppStats';
import { searchOnlineDevices, searchOnlineDevicesValidateSchema } from './searchOnlineDevices';
import { getOnlineDevicesCount, getOnlineDevicesCountValidateSchema } from './getOnlineDevicesCount';

export default function applicationsModule(router: Router) {
  router.post('/applications/add',  validate(addAppValidateSchema), userAuthorizationRequired(addApp));
  router.put('/applications/update', validate(updateAppValidateSchema), userAuthorizationRequired(updateApp));
  router.put('/applications/set-bundles', validate(appSetBundleIdsValidateSchema), userAuthorizationRequired(appSetBundleIds));
  router.put('/applications/set-maintainers', validate(appSetMaintainersValidateSchema), userAuthorizationRequired(appSetMaintainers));
  router.delete('/applications/delete', validate(deleteAppValidateSchema), userAuthorizationRequired(deleteApp));
  router.get('/applications/search', validate(searchAppsValidateSchema), userAuthorizationRequired(searchApps))
  router.get('/applications/search-stats', validate(searchAppStatsValidateSchema), userAuthorizationRequired(searchAppStats))
  router.get('/applications/stats', validate(getAppStatsValidateSchema), userAuthorizationRequired(getAppStats))
  router.get('/applications/search-online-devices', validate(searchOnlineDevicesValidateSchema), userAuthorizationRequired(searchOnlineDevices))
  router.get('/applications/count-online-devices', validate(getOnlineDevicesCountValidateSchema), userAuthorizationRequired(getOnlineDevicesCount))

  console.log('Application module loaded');
}