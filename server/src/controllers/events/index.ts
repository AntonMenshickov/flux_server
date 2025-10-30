import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { searchEvents, searchEventsValidateSchema } from './searchEvents';
import { getEventById, getEventByIdValidateSchema } from './getEventById';
import { addEvents, addEventsValidateSchema } from './addEvents';
import { appAuthorizationRequired, userAuthorizationRequired } from '../../middleware/authorizationRequired';
import bodyParser from 'body-parser';

export default function eventsModule(router: Router) {
  router.post('/events/search', validate(searchEventsValidateSchema,), userAuthorizationRequired(searchEvents));
  router.get('/events/:id', validate(getEventByIdValidateSchema), userAuthorizationRequired(getEventById));
  router.post('/events/add', bodyParser.json({ limit: '10mb' }), validate(addEventsValidateSchema), appAuthorizationRequired(addEvents));

  console.log('Events module loaded');
}