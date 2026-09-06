import { Router } from 'express';

import { register, login, logout, me } from '../controllers/users.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { validateBody, credentialsSchema } from '../middlewares/validate.js';

export const usersRouter = Router();

//Public — you cannot require a token in order to get a token.
usersRouter.post('/register', validateBody(credentialsSchema), register);
usersRouter.post('/login', validateBody(credentialsSchema), login);

//Protected — requireAuth runs first and answers 401 if the token is bad,
//in which case the handler to its right never runs.
usersRouter.use(requireAuth)
usersRouter.post('/logout', logout);
usersRouter.get('/me', me);
