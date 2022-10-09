import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + '/.env' });
import "reflect-metadata";
import express from "express";
import { createConnection } from "typeorm";
import cookieParser from "cookie-parser";
import { User } from "./entity/User";
import { Site } from "./entity/Sites";
import { Key, KeysAuthenticator } from "./entity/Keys";
// @ts-ignore
import { capture } from "express-device";
import http from "http";
import path from "path";
import { twoAuthRoutes } from "./twoAuthRoutes";
import { authRoutes } from "./authRoutes";
import { homePageRoutes } from "./homePageRoutes";
import { loginRoutes } from "./loginRoutes";
import { signupRoutes } from "./signupRoutes";
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
    console.log("[server] Connection created to database.");
});

socketConnection(io);

server.listen(PORT, () => {
    console.log(`[server] Running on port ${PORT}.`);
});