import { Router } from "express";
import { verify } from "jsonwebtoken";
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