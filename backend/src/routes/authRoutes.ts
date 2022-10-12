import { Router } from "express";
import { getConnection } from "typeorm";
import { Key } from "../entity/Keys";
import { User } from "../entity/User";
import { sendRequest } from "../functions";
import { userAuthorize } from "../userAuthorize";

export const authRoutes = Router();

authRoutes.get("/auth", async (req, res) => {
    const authenticate = await userAuthorize(req);
    if (!authenticate) {
        res.clearCookie("G_VAR").render("auth");
        return;
    }
    const { user } = authenticate;
    res.render("auth", {userName: user.usersRName});
    return;
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

    const authenticate = await userAuthorize(req);
    if (!authenticate) {
        res.json({ error: true, msg: "Unauthorized" });
        return;
    }

    const { user, payload } = authenticate;

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
    if (await sendRequest(req.body.userData.website, req.body.userData.key, user.usersRName, user.usersEmail, user.usersName) === "blacklist") {
        await getConnection().getRepository(User).increment({id: user.id}, 'usersFailedLogins', 1);
        res.json({error: false, blacklist: true});
        return;
    }
    await getConnection().getRepository(User).increment({id: user.id}, 'usersSuccessLogins', 1);
    res.json({ msg: "Good" });
});