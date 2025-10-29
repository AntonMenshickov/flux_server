import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { searchEvents, searchEventsValidateSchema } from './searchEvents';
import { addEvents, addEventsValidateSchema } from './addEvents';
import { appAuthorizationRequired, userAuthorizationRequired } from '../../middleware/authorizationRequired';
import bodyParser from 'body-parser';
import { addEventsFilter, addEventsFilterValidateSchema } from './addEventsFilter';
import { updateEventsFilter, updateEventsFilterValidateSchema } from './updateEventsFilter';
import { deleteEventsFilter, deleteEventsFilterValidateSchema } from './deleteEventsFilter';
import { searchEventsFilter, searchEventsFilterValidateSchema } from './searchEventsFilter';
import { shareEventsFilter, shareEventsFilterValidateSchema } from './shareEventsFilter';
import { getSharedEventsFilter, getSharedEventsFilterValidateSchema } from './getSharedEventsFilter';

export default function eventsModule(router: Router) {
  router.post('/events/search', validate(searchEventsValidateSchema,), userAuthorizationRequired(searchEvents));
  router.post('/events/add', bodyParser.json({ limit: '10mb' }), validate(addEventsValidateSchema), appAuthorizationRequired(addEvents));
  
  router.get('/events-filter/search', validate(searchEventsFilterValidateSchema), userAuthorizationRequired(searchEventsFilter));
  router.post('/events-filter/add', validate(addEventsFilterValidateSchema), userAuthorizationRequired(addEventsFilter));
  router.put('/events-filter/update', validate(updateEventsFilterValidateSchema), userAuthorizationRequired(updateEventsFilter));
  router.delete('/events-filter/delete', validate(deleteEventsFilterValidateSchema), userAuthorizationRequired(deleteEventsFilter));
  router.post('/events-filter/share', validate(shareEventsFilterValidateSchema), userAuthorizationRequired(shareEventsFilter));
  router.get('/events-filter/shared/:shareToken', validate(getSharedEventsFilterValidateSchema), getSharedEventsFilter);

  console.log('Events module loaded');
}