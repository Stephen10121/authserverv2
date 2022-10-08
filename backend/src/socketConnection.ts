import { verify } from "jsonwebtoken";
import cookie from "cookie";
import { Site } from "./entity/Sites";
import { User } from "./entity/User";
import { hashed } from "./functions";

interface Payload {
    userId: number;
    tokenVersion: number;
    iat: number;
    exp: number;
}

export default function socketConnection(io: any) {
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
}