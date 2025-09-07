import { Router } from 'express';
import { addUser } from './addUser';
import { authorizationRequired } from '../../middleware/authorizationRequired';
import { deleteUser } from './deleteUser';
import { profile } from './profile';

export default function userModule(router: Router) {
  router.post('/user/add-user', authorizationRequired, addUser);
  router.delete('/user/delete-user', authorizationRequired, deleteUser);
  router.get('/user/profile', authorizationRequired, profile);

  console.log('User module loaded');
}