import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { addEventsFilter, addEventsFilterValidateSchema } from './addEventsFilter';
import { updateEventsFilter, updateEventsFilterValidateSchema } from './updateEventsFilter';
import { deleteEventsFilter, deleteEventsFilterValidateSchema } from './deleteEventsFilter';
import { searchEventsFilter, searchEventsFilterValidateSchema } from './searchEventsFilter';
import { shareEventsFilter, shareEventsFilterValidateSchema } from './shareEventsFilter';
import { getSharedEventsFilter, getSharedEventsFilterValidateSchema } from './getSharedEventsFilter';
import { userAuthorizationRequired } from '../../middleware/authorizationRequired';

export default function eventsFilterModule(router: Router) {
  router.get('/events-filter/search', validate(searchEventsFilterValidateSchema), userAuthorizationRequired(searchEventsFilter));
  router.post('/events-filter/add', validate(addEventsFilterValidateSchema), userAuthorizationRequired(addEventsFilter));
  router.put('/events-filter/update', validate(updateEventsFilterValidateSchema), userAuthorizationRequired(updateEventsFilter));
  router.delete('/events-filter/delete', validate(deleteEventsFilterValidateSchema), userAuthorizationRequired(deleteEventsFilter));
  router.post('/events-filter/share', validate(shareEventsFilterValidateSchema), userAuthorizationRequired(shareEventsFilter));
  router.get('/events-filter/shared/:shareToken', validate(getSharedEventsFilterValidateSchema), getSharedEventsFilter);
}


