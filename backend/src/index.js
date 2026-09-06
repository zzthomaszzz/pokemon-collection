import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import { usersRouter } from "./routes/users.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';


//Middlewares
app.use(express.json());
//named origin rather than wide-open cors(): only our frontend may call this API
app.use(cors({ origin: frontendOrigin }));

//Routes
app.use('/users', usersRouter);

//Error handling — must come AFTER the routes, and errorHandler must be last
app.use(notFound);
app.use(errorHandler);

//Server running
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})
