import * as sessionsService from '../services/sessions.service.js';

const BEARER_PREFIX = 'Bearer ';

//Guards a route. Put it in front of any handler that needs a logged-in user:
//
//    pokemonRouter.get('/mine', requireAuth, getMyPokemon);
//
//On success it hangs userId on the request and calls next(). On failure it answers
//401 itself, and the handler to its right never runs.
export async function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith(BEARER_PREFIX)) {
            return res.status(401).json({ error: 'Missing or malformed Authorization header' });
        }

        const token = header.slice(BEARER_PREFIX.length);
        const session = await sessionsService.findValidSession(token);

        if (!session) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        req.userId = session.userId;
        req.sessionToken = token;

        next();
    } catch (error) {
        //a thrown error here would hang the request forever — hand it to the error handler
        next(error);
    }
}
