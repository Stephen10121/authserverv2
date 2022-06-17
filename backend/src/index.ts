import * as dotenv from "dotenv";
dotenv.config({ path: __dirname+'/.env' });
import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./UserResolver";
import { createConnection } from "typeorm";
import cookieParser from "cookie-parser";
import { verify } from "jsonwebtoken";
import { User } from "./entity/User";
import { createAccessToken, createRefreshToken } from "./auth";
import { sendRefreshToken } from "./sendRefreshToken";
import { sendRequest } from "./functions";
// @ts-ignore
import { capture } from "express-device";

(async () => {
    const app = express();
    app.set('view engine', 'ejs');
    app.use(cookieParser(), express.json(), express.static('public'), express.urlencoded({ extended: true }), capture());

    app.get('/', async (req, res) => {
        // @ts-ignore
        console.log(req.device.type);
        res.json({msg: "good"});
    });

    interface Payload {
        userId: number;
        tokenVersion: number;
        iat: number;
        exp: number;
    }

    app.get("/auth", async (req, res) => {
        if (req.cookies["G_VAR"]) {
            console.log(`[server] Verifying ${req.cookies.G_VAR}`);
            let payload2;
            try {
                payload2 = verify(req.cookies["G_VAR"], process.env.REFRESH_TOKEN_SECRET!);
            } catch (err) {
                res.clearCookie("G_VAR").json({error: true, msg: "Invalid cookie."});
            }

            if (!payload2) {
                res.clearCookie("G_VAR").json({ error: true });
                return;
            }

            const payload = payload2 as Payload;
            const user = await User.findOne({ where: {id: payload.userId} });

            if (!user) {
                res.clearCookie("G_VAR").json({ error: true, msg: "Invalid cookie." });
                return;
            }
            res.render("auth", {userName: user.usersRName});
            return;
        }
        res.render("auth");
    });

    app.post("/auth", async (req, res) => {
        if (!req.body["userData"]) {
            res.json({error: true, errorMessage: "Missing parameters"});
            return;
        }
        if (!req.body.userData["website"] || !req.body.userData["key"]) {
            res.json({error: true, errorMessage: "Missing parameters."});
            return;
        }

        if (!req.cookies["G_VAR"]) {
            res.json({ error: true, errorMessage: "No cookie." });
        }
        
        let payload2;
        try {
            payload2 = verify(req.cookies.G_VAR, process.env.REFRESH_TOKEN_SECRET!);
        } catch (err) {
            res.clearCookie("G_VAR").json({error: true, errorMessage: "Invalid cookie."});
            return;
        }

        if (!payload2) {
            res.clearCookie("G_VAR").json({ error: true, errorMessage: "Internal Error" });
            return;
        }

        const payload = payload2 as Payload;
        const user = await User.findOne({ where: {id: payload.userId} });

        if (!user) {
            res.clearCookie("G_VAR").json({ error: true, msg: "Invalid cookie." });
            return;
        }
        await sendRequest(req.body.userData.website, req.body.userData.key, user.usersRName, user.usersEmail, user.usersName);
        res.json({ msg: "Good" });
    });

    app.post("/refresh_token", async (req, res) => {
        const token = req.cookies.G_VAR;
        
        if (!token) {
            return res.send({ ok: false, accessToken: "" });
        }

        let payload: any = null;

        try {
            payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
        } catch (err) {
            console.error(err);
            return res.send({ ok: false, accessToken: "" });
        }

        const user = await User.findOne({id: payload.userId});

        if (!user) {
            return res.send({ ok: false, accessToken: "" });
        }

        if (user.tokenVersion !== payload.tokenVersion) {
            return res.send({ ok: false, accessToken: "" });
        }

        sendRefreshToken(res, createRefreshToken(user));

        return res.send({ ok: true, accessToken: createAccessToken(user) });
    });

    await createConnection();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [UserResolver]
        }),
        context: ({ req, res }) => ({ req, res })
    });

    apolloServer.applyMiddleware({ app });

    app.listen(4000, () => {
        console.log("[server] Running on port 4000.");
    });
})();