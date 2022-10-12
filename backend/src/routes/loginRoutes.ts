import { compare } from "bcryptjs";
import { getConnection } from "typeorm";
import { createRefreshToken } from "../auth";
import { User } from "../entity/User";
import { Router } from "express";
import { Key } from "../entity/Keys";
export const loginRoutes = Router();

loginRoutes.post("/login", async (req, res) => {
    if (!req.body["userData"]) {
        res.json({ error: true, errorMessage: "An error occured. Please refresh" });
        return;
    }
    const data: any = req.body.userData;
    if (!data["username"] || !data["password"]) {
        res.json({ error: true, errorMessage: "Missing fields" });
        return;
    }
    const user = await User.findOne({ where: { usersName: data.username } });

    if (!user) {
        res.json({ error: true, errorMessage: "Invalid Username." });
        return;
    }

    if (!await compare(data.password, user.usersPassword)) {
        res.json({ error: true, errorMessage: "Invalid Password." });
        await getConnection().getRepository(User).increment({ id: user.id }, 'usersFailedLogins', 1);
        return;
    }
    if (user.users2FA === "1") {
        const findKeys = await Key.find({ where: { keysOwner: user.id.toString() } });
        if (findKeys.length !== 0) {
            res.cookie("G_VAR", createRefreshToken(user), { maxAge: 990000000 }).json({ error: false, tfa: true });
            return;
        }
    }

    // sendRefreshToken(res, createRefreshToken(user));
    return res.cookie("G_VAR", createRefreshToken(user), { maxAge: 990000000 }).json({ error: false });
});