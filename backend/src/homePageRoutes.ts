import { Router } from "express";
import { verify } from "jsonwebtoken";
import { Key, KeysAuthenticator } from "./entity/Keys";
import { Site } from "./entity/Sites";
import { User } from "./entity/User";
export const homePageRoutes = Router();

interface Payload {
    userId: number;
    tokenVersion: number;
    iat: number;
    exp: number;
}

homePageRoutes.post("/contact", (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress ;
    console.log(req.body);
    console.log(`[server] ${req.body.email}@${ip} sent contact form.`);
    // sendMail(req.body.email, req.body.what);
    res.json({msg: "Message Recieved!"});
});

homePageRoutes.post("/changeName", async (req, res) => {
    if (!req.query.name) {
        res.json({ error: true, msg: "Missing Arguments" });
        return;
    }
    
    if (!req.cookies["G_VAR"]) {
        res.json({ error: true, msg: "Unauthorized" });
        return;
    }

    let payload2;
    try {
        payload2 = verify(req.cookies.G_VAR, process.env.REFRESH_TOKEN_SECRET!);
    } catch (err) {
        res.json({ error: true, msg: "Unauthorized" });
        return;
    }

    if (!payload2) {
        res.json({ error: true, msg: "Unauthorized" });
        return;
    }

    const payload = payload2 as Payload;
    const user = await User.findOne({ where: {id: payload.userId} });

    if (!user) {
        res.json({ error: true, msg: "Unauthorized" });
        return;
    }
    try {
        await User.update({ id: payload.userId }, { usersRName: req.query.name.toString() });
    } catch (err) {
        console.log(err);
        res.json({ error: true, msg: "Internal Error" });
        return;
    }
    res.json({error: false, msg: "Success"});
});

export const myAuth = async (req: any, res: any, io: any) => {
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
}

// app.post('/device',function(req,res) {
//     console.log(req.ip);
//     console.log(req.u)
//     res.json({ error: false, msg: "Good" });
// });