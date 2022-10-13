import { hash } from "bcryptjs";
import { Router } from "express";
import { User } from "../entity/User";
import { createRefreshToken } from "../auth";

export const signupRoutes = Router();

signupRoutes.get("/signup", (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`[server] ${ip} requested signup page.`);
    res.render('signup');
});

signupRoutes.post("/signup", async (req, res) => {
    if (!req.body["userData"]) {
        res.json({ error: true, errorMessage: "An error occured. Please refresh" });
        return;
    }
    const data = req.body.userData;
    data["phone"] = "false";
    if (!data["rname"] || !data["email"] || !data["username"] || !data["phone"] || !data["password"] || !data["rpassword"] || data["twofa"] === undefined) {
        res.json({ error: true, errorMessage: "Missing fields" });
        return;
    }
    if (data.password !== data.rpassword) {
        res.json({ error: true, errorMessage: "Passwords don't match!" });
        return;
    }

    const user = await User.findOne({ where: { usersName: data.username } });

    if (user) {
        res.json({ error: true, errorMessage: "User already exists!" });
        return;
    }

    const hashedPassword = await hash(data.password, process.env.SALT!);

    try {
        await User.insert({
            usersName: data.username,
            usersRName: data.rname,
            usersEmail: data.email,
            usersPhone: data.phone,
            usersPassword: hashedPassword,
            users2FA: data.twofa ? "1" : "0",
            usersSuccessLogins: 0,
            usersFailedLogins: 0,
            usersPopularSites: "",
            usersCurrentChallenge: ""
        });
    } catch (err) {
        res.json({ error: true, errorMessage: "Error registering user." });
        return;
    }

    const userLogged = await User.findOne({ where: { usersName: data.username } });

    if (!userLogged) {
        res.json({ error: true, errorMessage: "Error registering user." });
        return;
    }
    if (data.twofa) {
        res.cookie("G_VAR", createRefreshToken(userLogged), { maxAge: 990000000 }).json({ error: false, twofa: true });
        return;
    }
    res.cookie("G_VAR", createRefreshToken(userLogged), { maxAge: 990000000 }).json({ error: false });
});

// Not using this yet
// import { verify } from "jsonwebtoken";
// import { createAccessToken, createRefreshToken } from "../auth";
// import { sendRefreshToken } from "../sendRefreshToken";
// signupRoutes.post("/refresh_token", async (req, res) => {
//     const token = req.cookies.G_VAR;

//     if (!token) {
//         return res.send({ ok: false, accessToken: "" });
//     }

//     let payload: any = null;

//     try {
//         payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
//     } catch (err) {
//         console.error(err);
//         return res.send({ ok: false, accessToken: "" });
//     }

//     const user = await User.findOne({ id: payload.userId });

//     if (!user) {
//         return res.send({ ok: false, accessToken: "" });
//     }

//     if (user.tokenVersion !== payload.tokenVersion) {
//         return res.send({ ok: false, accessToken: "" });
//     }

//     sendRefreshToken(res, createRefreshToken(user));

//     return res.send({ ok: true, accessToken: createAccessToken(user) });
// });