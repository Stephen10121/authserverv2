import * as dotenv from "dotenv";
dotenv.config({ path: __dirname+'/.env' });
import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./UserResolver";
import { createConnection, getConnection } from "typeorm";
import cookieParser from "cookie-parser";
import { verify } from "jsonwebtoken";
import { User } from "./entity/User";
import { Site } from "./entity/Sites";
import { createAccessToken, createRefreshToken } from "./auth";
import { sendRefreshToken } from "./sendRefreshToken";
import { hashed, sendRequest } from "./functions";
// @ts-ignore
import { capture } from "express-device";
import { compare, hash } from "bcryptjs";
import http from "http";
import path from "path";

(async () => {
    console.log(path.join(__dirname,"..",'public'));
    const app = express();
    app.set('view engine', 'ejs');
    
    app.use((_req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', "*");
        res.setHeader('Access-Control-Allow-Headers', '*');
        next();
    });
    
    app.use(cookieParser(), express.json(), express.static(path.join(__dirname,"..",'public')), express.urlencoded({ extended: true }), capture());
    const server = http.createServer(app);
    const io = require("socket.io")(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            allowEIO3: true
        }
      });

    // app.get('/', async (req, res) => {
    //     // console.log(req.device.type);
    //     console.log(req.cookies["G_VAR"]);
    //     res.render("index");
    // });

    app.get("/signup", (req, res) => {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress ;
        console.log(`[server] ${ip} requested signup page.`);
        res.render('signup');
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
                return;
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
            return;
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
        if (user.usersPopularSites === "") {
            let newPopular: any = {}
            newPopular[req.body.userData.website] = 1;
            await User.update({id: user.id}, {usersPopularSites: JSON.stringify(newPopular)});
        } else {
            const sites = JSON.parse(user.usersPopularSites);
            const siteKeys = Object.keys(sites);
            if (siteKeys.includes(req.body.userData.website)) {
                sites[req.body.userData.website]=sites[req.body.userData.website]+1;
            } else {
                sites[req.body.userData.website]=1;
            }
            await User.update({id: user.id}, {usersPopularSites: JSON.stringify(sites)});
        }
        await getConnection().getRepository(User).increment({id: user.id}, 'usersSuccessLogins', 1);
        await sendRequest(req.body.userData.website, req.body.userData.key, user.usersRName, user.usersEmail, user.usersName);
        res.json({ msg: "Good" });
    });

    app.post("/login", async (req, res) => {
        if (!req.body["userData"]) {
            res.json({error: true, errorMessage: "An error occured. Please refresh"});
            return;
        }
        const data = req.body.userData;
        if (!data["username"] || !data["password"]) {
            res.json({error: true, errorMessage: "Missing fields"});
            return;
        }
        const user = await User.findOne({ where: { usersName: data.username } });

        if (!user) {
            res.json({ error: true, errorMessage: "Invalid Username." });
            return;
        }
        const valid = await compare(data.password, user.usersPassword);

        if (!valid) {
            res.json({ error: true, errorMessage: "Invalid Password." });
            await getConnection().getRepository(User).increment({id: user.id}, 'usersFailedLogins', 1);
            return;
        }

        // sendRefreshToken(res, createRefreshToken(user));
        return res.cookie("G_VAR", createRefreshToken(user), { maxAge: 990000000}).json({error: false});
    });

    app.post("/signup", async (req, res) => {
        if (!req.body["userData"]) {
            res.json({error: true, errorMessage: "An error occured. Please refresh"});
            return;
        }
        const data = req.body.userData;
        data["phone"] = "false";
        if (!data["rname"] || !data["email"] || !data["username"] || !data["phone"] || !data["password"] || !data["rpassword"]) {
            res.json({error: true, errorMessage: "Missing fields"});
            return;
        }
        if (data.password !== data.rpassword) {
            res.json({error: true, errorMessage: "Passwords don't match!"});
            return;
        }

        const user = await User.findOne({ where: {usersName: data.username} });

        if (user) {
            res.json({error: true, errorMessage: "User already exists!"});
            return;
        }

        const hashedPassword = await hash(data.password, 3);

        try {
            await User.insert({
                usersName: data.username,
                usersRName: data.rname,
                usersEmail: data.email,
                usersPhone: data.phone,
                usersPassword: hashedPassword,
                users2FA: "false",
                usersSuccessLogins: 0,
                usersFailedLogins: 0,
                usersPopularSites: ""
            });
        } catch (err) {
            res.json({error: true, errorMessage: "Error registering user."});
            return;
        }

        const userLogged = await User.findOne({ where: {usersName: data.username} });

        if (!userLogged) {
            res.json({error: true, errorMessage: "Error registering user."});
            return;
        }
        res.cookie("G_VAR", createRefreshToken(userLogged), { maxAge: 990000000}).json({error: false});
    });

    app.post("/myAuth", async (req, res) => {
        const siteArray = await Site.find({ where: { sitesOwner: req.body.username} });
        const sites = siteArray.map((site) => {return {site: site.sitesWebsite, blackList: site.sitesBlackList}});
        const user = await User.findOne({ where: { usersName: req.body.username } });
        let success = 0;
        let failed = 0;
        let mostPopular;
        if (user) {
            if (user["usersSuccessLogins"]) {
                success = user.usersSuccessLogins;
            }
            if (user["usersFailedLogins"]) {
                failed = user.usersFailedLogins;
            }
            const sitesPopular = JSON.parse(user.usersPopularSites);
            const siteKeys = Object.keys(sitesPopular);
            let currentPop = {
                val: 0,
                key: ""
            }
            for (let i=0;i<siteKeys.length;i++) {
                let value = sitesPopular[siteKeys[i]];
                if (value > currentPop.val) {
                    currentPop.val = value;
                    currentPop.key = siteKeys[i];
                }
            }
            mostPopular = currentPop.key;
        }
        const info = {
            userData: req.body,
            sites,
            mostPopular,
            https: sites.filter(x => x.site.includes("https")).length,
            attemptedLogins: success+failed,
            failedLogins: failed
        }
        
        io.to(req.body.key).emit("login", info);
        res.json({ msg: "Good" });
    });

    app.post("/contact", (req, res) => {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress ;
        console.log(req.body);
        console.log(`[server] ${req.body.email}@${ip} sent contact form.`);
        // sendMail(req.body.email, req.body.what);
        res.json({msg: "Message Recieved!"});
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

    io.on("connection", (socket: any) => {
        console.log(`Connection from ${socket.id}`);

        socket.on("blacklist", async (data: any) => {
            if (!data["name"] || !data["key"] || data["blackList"] === undefined) {
                io.to(socket.id).emit("blacklist", false);
                return;
            }
            if (data.name === "http://localhost:4000/myAuth" || data.name === "https://auth.gruzservices.com/myAuth") {
                io.to(socket.id).emit("blacklist", false);
                return;
            }
            const site = await Site.findOne({ where: { sitesWebsite: data.name } });
            if (!site) {
                io.to(socket.id).emit("blacklist", false);
                return;
            }
            let owner = site.sitesOwner;
            let website = site.sitesWebsite;
            if (hashed(hashed(owner)+hashed(website)) !== hashed(hashed(owner)+hashed(data.name))) {
                io.to(socket.id).emit("blacklist", false);
                return;
            }
            
            if (data.blackList) {
                console.log(`[server] Blacklisting ${data.name} for ${owner}.`);
                await Site.update({sitesHash: hashed(hashed(owner)+hashed(data.name))}, {sitesBlackList: "true"});
            } else {
                console.log(`[server] Unblacklisting ${data.name} for ${owner}.`);
                await Site.update({sitesHash: hashed(hashed(owner)+hashed(data.name))}, {sitesBlackList: "false"});
            }
            io.to(socket.id).emit("blacklist", true);
        });
    });

    server.listen(4000, () => {
        console.log("[server] Running on port 4000.");
    });
})();
