import { Router } from "express";
import { verify } from "jsonwebtoken";
import { getConnection } from "typeorm";
import { Key } from "./entity/Keys";
import { User } from "./entity/User";
import { sendRequest } from "./functions";

export const authRoutes = Router();
interface Payload {
    userId: number;
    tokenVersion: number;
    iat: number;
    exp: number;
}

authRoutes.get("/auth", async (req, res) => {
    if (req.cookies["G_VAR"]) {
        console.log(`[server] Verifying ${req.cookies.G_VAR}`);
        let payload2;
        try {
            payload2 = verify(req.cookies["G_VAR"], process.env.REFRESH_TOKEN_SECRET!);
        } catch (err) {
            res.clearCookie("G_VAR").render("auth");
            return;
        }

        if (!payload2) {
            res.clearCookie("G_VAR").render("auth");
            return;
        }

        const payload = payload2 as Payload;
        const user = await User.findOne({ where: {id: payload.userId} });

        if (!user) {
            res.clearCookie("G_VAR").render("auth");
            return;
        }
        res.render("auth", {userName: user.usersRName});
        return;
    }
    res.render("auth");
});

authRoutes.post("/auth", async (req, res) => {
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

    if (user.users2FA === "1") {
        const findKeys = await Key.find({where: {keysOwner: payload.userId.toString() }});
        if (findKeys.length !== 0) {
            res.json({ error: false, tfa: true });
            return;
        }
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
    res.json({error: false, blacklist: true});
    if (await sendRequest(req.body.userData.website, req.body.userData.key, user.usersRName, user.usersEmail, user.usersName) === "blacklist") {
        res.json({error: false, blacklist: true});
        return;
    }
    
    await getConnection().getRepository(User).increment({id: user.id}, 'usersSuccessLogins', 1);
    return;
    res.json({ msg: "Good" });
});