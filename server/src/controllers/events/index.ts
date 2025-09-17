import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { searchEvents, searchEventsValidateSchema } from './find';
import { addEvents, addEventsValidateSchema } from './addEvents';
import { appAuthorizationRequired, userAuthorizationRequired } from '../../middleware/authorizationRequired';
import bodyParser from 'body-parser';

export default function eventsModule(router: Router) {
  router.get('/events/search', userAuthorizationRequired, validate(searchEventsValidateSchema),  searchEvents);
  router.post('/events/add', bodyParser.json({limit: '10mb'}), appAuthorizationRequired, validate(addEventsValidateSchema),  addEvents);

  console.log('Events module loaded');
}