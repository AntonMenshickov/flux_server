import { Router } from 'express';
import bodyParser from 'body-parser';
import { validate } from '../../middleware/validate';
import { userAuthorizationRequired } from '../../middleware/authorizationRequired';
import { startDeviceStream, stopDeviceStream, streamControlValidateSchema } from './streams';

export default function websocketModule(router: Router) {
  router.post('/ws/streams/start', validate(streamControlValidateSchema), userAuthorizationRequired(startDeviceStream));
  router.post('/ws/streams/stop', validate(streamControlValidateSchema), userAuthorizationRequired(stopDeviceStream));

  console.log('Websocket streams module loaded');
}
