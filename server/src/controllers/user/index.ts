import { Router } from 'express';
import { addUser, addUserValidateSchema } from './addUser';
import { userAuthorizationRequired } from '../../middleware/authorizationRequired';
import { deleteUser, deleteUserValidateSchema } from './deleteUser';
import { profile } from './profile';
import { searchUsers, searchUserValidateSchema } from './searchUsers';
import { validate } from '../../middleware/validate';

export default function userModule(router: Router) {
  router.post('/users/add', validate(addUserValidateSchema), userAuthorizationRequired(addUser));
  router.delete('/users/delete', validate(deleteUserValidateSchema), userAuthorizationRequired(deleteUser));
  router.get('/users/profile', userAuthorizationRequired(profile));
  router.get('/users/search', validate(searchUserValidateSchema), userAuthorizationRequired(searchUsers));

  console.log('User module loaded');
}