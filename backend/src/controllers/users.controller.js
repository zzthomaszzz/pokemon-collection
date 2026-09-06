import * as usersService from '../services/users.service.js';
import * as sessionsService from '../services/sessions.service.js';

//Every handler is wrapped in try/catch and forwards to next(error). Without it a
//rejected promise leaves the request hanging until the browser gives up.

export async function register(req, res, next) {
    try {
        const { name, password } = req.body;

        const userId = await usersService.registerUser(name, password);

        if (!userId) {
            return res.status(409).json({ error: 'That name is already taken' });
        }

        //log them straight in — no reason to make someone who just registered type it again
        const token = await sessionsService.createSession(userId);

        res.status(201).json({
            token,
            user: { id: userId, name }
        });
    } catch (error) {
        next(error);
    }
}

export async function login(req, res, next) {
    try {
        const { name, password } = req.body;

        const userId = await usersService.checkCredentials(name, password);

        if (!userId) {
            return res.status(401).json({ error: 'Incorrect name or password' });
        }

        const token = await sessionsService.createSession(userId);

        res.json({
            token,
            user: { id: userId, name }
        });
    } catch (error) {
        next(error);
    }
}

export async function logout(req, res, next) {
    try {
        //requireAuth put the token here, so we know it is valid
        await sessionsService.deleteSession(req.sessionToken);

        res.status(204).end();
    } catch (error) {
        next(error);
    }
}

//"who am I?" — the frontend calls this on load to check whether a stored token still works
export async function me(req, res, next) {
    try {
        const user = await usersService.findUserById(req.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        next(error);
    }
}
