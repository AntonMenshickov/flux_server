import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { searchEvents, searchEventsValidateSchema } from './find';

export default function eventsModule(router: Router) {
  router.get('/events/search', validate(searchEventsValidateSchema),  searchEvents);

  console.log('Events module loaded');
}