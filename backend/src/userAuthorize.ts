import { verify } from "jsonwebtoken";
import { User } from "./entity/User";

interface Payload {
    userId: number;
    tokenVersion: number;
    iat: number;
    exp: number;
}

export const userAuthorize = async (req: any) => {
    if (!req.cookies["G_VAR"]) {
        return false;
    }

    console.log(`[server] Checking if ${req.cookies.G_VAR} is valid.`);

    let payload2;
    try {
        payload2 = verify(req.cookies.G_VAR, process.env.REFRESH_TOKEN_SECRET!);
    } catch (err) {
        return false;
    }

    if (!payload2) {
        return false;
    }

    const payload = payload2 as Payload;
    const user = await User.findOne({ where: {id: payload.userId} });

    if (!user) {
        return false;
    }
    console.log(`[server] ${req.cookies.G_VAR} is valid.`);
    return {payload, user};
}