import { Router } from 'express';
import { addUser } from './addUser';
import { authorizationRequired } from '../../middleware/authorizationRequired';
import { deleteUser } from './deleteUser';
import { profile } from './profile';
import { searchUsers } from './searchUsers';

export default function userModule(router: Router) {
  router.post('/users/add', authorizationRequired, addUser);
  router.delete('/users/delete', authorizationRequired, deleteUser);
  router.get('/users/profile', authorizationRequired, profile);
  router.get('/users/search', authorizationRequired, searchUsers);

  console.log('User module loaded');
}