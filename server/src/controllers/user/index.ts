import { Router } from 'express';
import { addUser, addUserValidateSchema } from './addUser';
import { authorizationRequired } from '../../middleware/authorizationRequired';
import { deleteUser, deleteUserValidateSchema } from './deleteUser';
import { profile } from './profile';
import { searchUsers, searchUserValidateSchema } from './searchUsers';
import { validate } from '../../middleware/validate';

export default function userModule(router: Router) {
  router.post('/users/add', validate(addUserValidateSchema), authorizationRequired, addUser);
  router.delete('/users/delete', validate(deleteUserValidateSchema), authorizationRequired, deleteUser);
  router.get('/users/profile', authorizationRequired, profile);
  router.get('/users/search', validate(searchUserValidateSchema), authorizationRequired, searchUsers);

  console.log('User module loaded');
}