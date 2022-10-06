import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + '/.env' });
import "reflect-metadata";
import express from "express";
import { createConnection } from "typeorm";
import cookieParser from "cookie-parser";
import cookie from "cookie";
import { User } from "./entity/User";
import { Site } from "./entity/Sites";
import { Key, KeysAuthenticator } from "./entity/Keys";
import { hashed } from "./functions";
// @ts-ignore
import { capture } from "express-device";
import http from "http";
import path from "path";
import { twoAuthRoutes } from "./twoAuthRoutes";
import { authRoutes } from "./authRoutes";
import { homePageRoutes } from "./homePageRoutes";
import { loginRoutes } from "./loginRoutes";
import { signupRoutes } from "./signupRoutes";
import { verify } from "jsonwebtoken";

const app = express();
app.set('view engine', 'ejs');
app.use(cookieParser(), express.json(), express.static(path.join(__dirname, "..", "..", "frontend", 'public')), express.urlencoded({ extended: true }), capture());


const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowEIO3: true
    }
});

app.use(twoAuthRoutes);
app.use(authRoutes);
app.use(homePageRoutes);
app.use(loginRoutes);
app.use(signupRoutes);

app.post("/myAuth", async (req, res) => {
    const siteArray = await Site.find({ where: { sitesOwner: req.body.username } });
    const sites = siteArray.map((site) => { return { site: site.sitesWebsite, blackList: site.sitesBlackList } });
    const user = await User.findOne({ where: { usersName: req.body.username } });
    let success = 0;
    let failed = 0;
    let mostPopular;

    if (!user) {
        res.json({ msg: "Bad" });
        return;
    }

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
    for (let i = 0; i < siteKeys.length; i++) {
        let value = sitesPopular[siteKeys[i]];
        if (value > currentPop.val) {
            currentPop.val = value;
            currentPop.key = siteKeys[i];
        }
    }
    mostPopular = currentPop.key;
    let keyDataArray = [];
    const keys = await Key.find({ where: { keysOwner: user.id } });
    for (let i = 0; i < keys.length; i++) {
        let authenticator = await KeysAuthenticator.findOne({ where: { id: keys[i].keysAuthenticator } });
        if (!authenticator) {
            continue
        }
        let keyData = {
            id: keys[i].id,
            name: authenticator.name
        }
        keyDataArray.push(keyData);
    }
    const info = {
        userData: req.body,
        sites,
        mostPopular,
        https: sites.filter(x => x.site.includes("https")).length,
        attemptedLogins: success + failed,
        failedLogins: failed,
        tfa: user.users2FA,
        tfaKeys: keyDataArray
    }
    io.to(req.body.key).emit("login", info);
    res.json({ msg: "Good" });
});

createConnection().then((_data) => {
    console.log("Connection created.");
});

interface Payload {
    userId: number;
    tokenVersion: number;
    iat: number;
    exp: number;
}

io.on("connection", (socket: any) => {
    console.log(`Connection from ${socket.id}`);

    socket.on("blacklist", async (data: any) => {
        if (!data["name"] || !data["key"] || data["blackList"] === undefined) {
            io.to(socket.id).emit("blacklist", false);
            return;
        }

        const cookieif = socket.handshake.headers.cookie;
        const cookies = cookie.parse(cookieif);
        
        if (!cookies["G_VAR"]) {
            io.to(socket.id).emit("blacklist", false);
            return;
        }

        let payload2;
        try {
            payload2 = verify(cookies.G_VAR, process.env.REFRESH_TOKEN_SECRET!);
        } catch (err) {
            io.to(socket.id).emit("blacklist", false);
            return;
        }

        if (!payload2) {
            io.to(socket.id).emit("blacklist", false);
            return;
        }

        const payload = payload2 as Payload;
        const user = await User.findOne({ where: {id: payload.userId} });

        if (!user) {
            io.to(socket.id).emit("blacklist", false);
            return;
        }

        if (data.name === "http://localhost:4000/myAuth" || data.name === "https://auth.gruzservices.com/myAuth") {
            io.to(socket.id).emit("blacklist", false);
            return;
        }
        const site = await Site.findOne({ where: { sitesWebsite: data.name, sitesOwner: user.usersName } });
        if (!site) {
            io.to(socket.id).emit("blacklist", false);
            return;
        }
        let owner = site.sitesOwner;
        let website = site.sitesWebsite;
        if (hashed(hashed(owner) + hashed(website)) !== hashed(hashed(owner) + hashed(data.name))) {
            io.to(socket.id).emit("blacklist", false);
            return;
        }

        if (data.blackList) {
            console.log(`[server] Blacklisting ${data.name} for ${owner}.`);
            await Site.update({ sitesHash: hashed(hashed(owner) + hashed(data.name)) }, { sitesBlackList: "true" });
        } else {
            console.log(`[server] Unblacklisting ${data.name} for ${owner}.`);
            await Site.update({ sitesHash: hashed(hashed(owner) + hashed(data.name)) }, { sitesBlackList: "false" });
        }
        io.to(socket.id).emit("blacklist", true);
    });
});

server.listen(4000, () => {
    console.log("[server] Running on port 4000.");
});