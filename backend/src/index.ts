import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + '/.env' });
import "reflect-metadata";
import express from "express";
import { createConnection } from "typeorm";
import cookieParser from "cookie-parser";
// @ts-ignore
import { capture } from "express-device";
import http from "http";
import path from "path";
import { twoAuthRoutes } from "./routes/twoAuthRoutes";
import { authRoutes } from "./routes/authRoutes";
import { homePageRoutes, myAuth } from "./routes/homePageRoutes";
import { loginRoutes } from "./routes/loginRoutes";
import { signupRoutes } from "./routes/signupRoutes";
import socketConnection from "./socketConnection";

const PORT = process.env.PORT || 4000;
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowEIO3: true
    }
});

// Allow shared fonts.
app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
});

app.set('view engine', 'ejs');
app.use(cookieParser(), express.json(), express.static(path.join(__dirname, "..", "..", "frontend", 'public')), express.urlencoded({ extended: true }), capture());
app.use(twoAuthRoutes);
app.use(authRoutes);
app.use(homePageRoutes);
app.use(loginRoutes);
app.use(signupRoutes);

app.post("/myAuth", async (req, res) => {
    myAuth(req, res, io);
});

createConnection().then((_data) => {
    console.log("[server] Connection created to database.");
});

socketConnection(io);

server.listen(PORT, () => {
    console.log(`[server] Running on port ${PORT}.`);
});