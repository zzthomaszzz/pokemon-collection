//404 for anything no route matched. Mount after all routes.
export function notFound(req, res) {
    res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
}

//The safety net. Express only treats a middleware as an error handler if it takes
//FOUR arguments — dropping `next` here silently turns it back into normal middleware.
//Mount it last, after every route.
export function errorHandler(error, req, res, next) {
    console.error('Unhandled error:', error);

    //if a response already went out, Express must finish the job itself
    if (res.headersSent) {
        return next(error);
    }

    //deliberately vague: stack traces and SQL messages must never reach the client
    res.status(500).json({ error: 'Internal server error' });
}
