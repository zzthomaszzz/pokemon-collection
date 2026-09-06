import Joi from 'joi';

//The shape both /register and /login expect.
//This runs before the controller, so by the time your handler sees req.body it is
//guaranteed to have a trimmed name and a password of sane length.
export const credentialsSchema = Joi.object({
    name: Joi.string().trim().min(3).max(30).required().messages({
        'string.min': 'Name must be at least 3 characters',
        'string.max': 'Name must be 30 characters or fewer',
        'any.required': 'Name is required'
    }),
    password: Joi.string().min(8).max(128).required().messages({
        'string.min': 'Password must be at least 8 characters',
        'any.required': 'Password is required'
    })
});

//Turns a Joi schema into middleware: validateBody(schema) returns the function Express runs.
export function validateBody(schema) {
    return (req, res, next) => {
        //abortEarly:false reports every problem at once instead of just the first
        //stripUnknown drops fields we did not ask for
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.details.map((detail) => detail.message)
            });
        }

        //replace the raw body with the cleaned, trimmed version
        req.body = value;

        next();
    };
}
