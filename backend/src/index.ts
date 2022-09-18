import * as dotenv from "dotenv";
dotenv.config({ path: __dirname+'/.env' });
import "reflect-metadata";
import express from "express";
import { createConnection, getConnection } from "typeorm";
import cookieParser from "cookie-parser";
import { verify } from "jsonwebtoken";
import { User } from "./entity/User";
import { Site } from "./entity/Sites";
import { Key, KeysAuthenticator } from "./entity/Keys";
import { createAccessToken, createRefreshToken } from "./auth";
import { sendRefreshToken } from "./sendRefreshToken";
import { hashed, sendRequest } from "./functions";
// @ts-ignore
import { capture } from "express-device";
import { compare, hash } from "bcryptjs";
import http from "http";
import path from "path";
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import {getUserFromDB, setUserCurrentChallenge, getUserCurrentChallenge, UserModel, Authenticator, addNewDevice, getUserAuthenticator, saveUpdatedAuthenticatorCounter } from "./testfunctions";

  // Human-readable title for your website
  const rpName = 'GruzAuth';
  // A unique identifier for your website
  const rpID = 'key.gruzservices.com';
  // The URL at which registrations and authentications should occur
  const origin = `https://${rpID}`;

(async () => {
    console.log(path.join(__dirname,"..",'public'));
    const app = express();
    app.set('view engine', 'ejs');
    
    app.use((_req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', "*");
        res.setHeader('Access-Control-Allow-Headers', '*');
        next();
    });
    
    app.use(cookieParser(), express.json(), express.static(path.join(__dirname,"..","..","frontend",'public')), express.urlencoded({ extended: true }), capture());
    const server = http.createServer(app);
    const io = require("socket.io")(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            allowEIO3: true
        }
      });

    // app.get('/', async (req, res) => {
    //     // console.log(req.device.type);
    //     console.log(req.cookies["G_VAR"]);
    //     res.render("index");
    // });

    app.get("/signup", (req, res) => {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress ;
        console.log(`[server] ${ip} requested signup page.`);
        res.render('signup');
    });

    app.get("/getRegistrationOptions", async (req, res) => {
        if (!req.cookies["G_VAR"]) {
            res.status(400).send({ error: "User not logged in." });
            return;
        }

        let payload2;
        try {
            payload2 = verify(req.cookies["G_VAR"], process.env.REFRESH_TOKEN_SECRET!);
        } catch (err) {
            res.clearCookie("G_VAR").status(400).send({error: "Invalid cookie."});
            return;
        }

        if (!payload2) {
            res.clearCookie("G_VAR").status(400).send({ error: "No User found." });
            return;
        }

        const payload = payload2 as Payload;

        // (Pseudocode) Retrieve the user from the database
        // after they've logged in
        const user: UserModel | boolean = await getUserFromDB(payload.userId);

        if (!user) {
            res.status(400).send({ error: `Cant find user.` });
            return;
        }
        // (Pseudocode) Retrieve any of the user's previously-
        // registered authenticators
        const userAuthenticators: Authenticator[] = user.devices;
      
        const options = generateRegistrationOptions({
          rpName,
          rpID,
          userID: user.id,
          userName: user.username,
          // Don't prompt users for additional information about the authenticator
          // (Recommended for smoother UX)
          attestationType: 'indirect',
          // Prevent users from re-registering existing authenticators
          excludeCredentials: userAuthenticators.map(authenticator => ({
            id: authenticator.credentialID,
            type: 'public-key',
            // Optional
            transports: authenticator.transports,
          })),
        });
      
        // (Pseudocode) Remember the challenge for this user
        if (!await setUserCurrentChallenge(user, options.challenge)) {
            res.status(400).send({ error: `Error Saving Challenge.` });
            return;
        }
      
        res.send(options);
      });
      
      
      
      
      app.post("/register", async (req, res) => {
        const {body} = req;
        
        if (!req.cookies["G_VAR"]) {
            res.status(400).send({ error: "User not logged in." });
            return;
        }

        if (!req.body["keyName"]) {
            res.status(400).send({error: "No Key Name."});
            return;
        }
        let payload2;
        try {
            payload2 = verify(req.cookies["G_VAR"], process.env.REFRESH_TOKEN_SECRET!);
        } catch (err) {
            res.clearCookie("G_VAR").status(400).send({error: "Invalid cookie."});
            return;
        }

        if (!payload2) {
            res.clearCookie("G_VAR").status(400).send({ error: "No User found." });
            return;
        }

        const payload = payload2 as Payload;
      
        // (Pseudocode) Retrieve the logged-in user
        const user: UserModel | boolean = await getUserFromDB(payload.userId);
        if (!user) {
            res.status(400).send({ error: `Cant find user.` });
            return;
        }
        // (Pseudocode) Get `options.challenge` that was saved above
        const expectedChallenge = await getUserCurrentChallenge(user);

        if (!expectedChallenge) {
            res.status(400).send({ error: "Error finding user."});
            return;
        }
      
        let verification;
        try {
          verification = await verifyRegistrationResponse({
            credential: body,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
          });
        } catch (error) {
          console.error(error);
          res.status(400).send({ error: "Internal error" });
          return;
        }
      
        const { verified, registrationInfo } = verification;
      
        if (verified && registrationInfo) {
          const { credentialPublicKey, credentialID, counter } = registrationInfo;
      
          const existingDevice = user.devices.find(device => device.credentialID===credentialID);
      
          if (!existingDevice) {
            /**
             * Add the returned device to the user's list of devices
             */
            const newDevice: Authenticator = {
                id: 1,
              credentialPublicKey,
              credentialID,
              counter,
              transports: body.transports,
              owner: user.id,
              blacklist: false,
              name: req.body.keyName
            };
            const resp = await addNewDevice(newDevice);
            if (!resp) {
                res.status(400).send({ error: "Cannot save key." });
                return;
            }
          }
        }
        res.send({verified});
        return;
      });

      app.get("/getAuthenticationOptions", async (req, res) => {
        if (!req.cookies["G_VAR"]) {
            res.status(400).send({ error: "User not logged in." });
            return;
        }

        let payload2;
        try {
            payload2 = verify(req.cookies["G_VAR"], process.env.REFRESH_TOKEN_SECRET!);
        } catch (err) {
            res.clearCookie("G_VAR").status(400).send({error: "Invalid cookie."});
            return;
        }

        if (!payload2) {
            res.clearCookie("G_VAR").status(400).send({ error: "No User found." });
            return;
        }

        const payload = payload2 as Payload;
        
        // (Pseudocode) Retrieve the logged-in user
        const user: UserModel | boolean = await getUserFromDB(payload.userId);
        if (!user) {
            res.status(400).send({ error: `Cant find user.` });
            return;
        }
        // (Pseudocode) Retrieve any of the user's previously-
        // registered authenticators
        const userAuthenticators: Authenticator[] = user.devices;
      
        const options = generateAuthenticationOptions({
          // Require users to use a previously-registered authenticator
          allowCredentials: userAuthenticators.map(authenticator => ({
            id: authenticator.credentialID,
            type: 'public-key',
            // Optional
            transports: authenticator.transports,
          })),
          userVerification: 'preferred',
        });
      
        // (Pseudocode) Remember this challenge for this user
        if (!await setUserCurrentChallenge(user, options.challenge)) {
            res.status(400).send({ error: `Error Saving Challenge.` });
            return;
        }
        res.send(options);
      });
      
      app.post("/startAuthentication", async (req, res) => {
        const body = req.body;
        if (!req.cookies["G_VAR"]) {
            res.status(400).send({ error: "User not logged in." });
            return;
        }

        let payload2;
        try {
            payload2 = verify(req.cookies["G_VAR"], process.env.REFRESH_TOKEN_SECRET!);
        } catch (err) {
            res.clearCookie("G_VAR").status(400).send({error: "Invalid cookie."});
            return;
        }

        if (!payload2) {
            res.clearCookie("G_VAR").status(400).send({ error: "No User found." });
            return;
        }

        const payload = payload2 as Payload;
      
        // (Pseudocode) Retrieve the logged-in user
        const user: UserModel | boolean = await getUserFromDB(payload.userId);
        if (!user) {
            res.status(400).send({ error: `Cant find user.` });
            return;
        }
        // (Pseudocode) Get `options.challenge` that was saved above
        const expectedChallenge = user.currentChallenge;
        if (!expectedChallenge) {
            res.status(400).send({ error: "Cannot find user." });
            return;
        }
        // (Pseudocode} Retrieve an authenticator from the DB that
        // should match the `id` in the returned credential
        const authenticator = getUserAuthenticator(user, body.asseResp.id);

        if (!authenticator) {
          console.error(`Could not find authenticator ${body.asseResp.id} for user ${user.id}`);
          res.status(400).send({ error: `Could not find authenticator ${body.asseResp.id} for user ${user.id}` });
          return;
        }

        let verification;
        try {
          verification = await verifyAuthenticationResponse({
            credential: body.asseResp,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            authenticator: authenticator
          });
        } catch (error) {
          console.error(error);
          res.status(400).send({ error: "Internal Error." });
          return;
        }
      
        const { verified } = verification;
        if (verified) {
          const { authenticationInfo } = verification;
          const { newCounter } = authenticationInfo;
          saveUpdatedAuthenticatorCounter(authenticator, newCounter);
        }
        
        const user2 = await User.findOne({ where: {id: payload.userId} });

        if (!user2) {
            res.clearCookie("G_VAR").json({ error: true, msg: "Invalid cookie." });
            return;
        }

        if (user2.usersPopularSites === "") {
            let newPopular: any = {}
            newPopular[body.userData.website] = 1;
            await User.update({id: user2.id}, {usersPopularSites: JSON.stringify(newPopular)});
        } else {
            const sites = JSON.parse(user2.usersPopularSites);
            const siteKeys = Object.keys(sites);
            if (siteKeys.includes(body.userData.website)) {
                sites[body.userData.website]=sites[body.userData.website]+1;
            } else {
                sites[body.userData.website]=1;
            }
            await User.update({id: user2.id}, {usersPopularSites: JSON.stringify(sites)});
        }
        await getConnection().getRepository(User).increment({id: user2.id}, 'usersSuccessLogins', 1);
        await sendRequest(body.userData.website, body.userData.key, user2.usersRName, user2.usersEmail, user2.usersName);
        res.send({verified});
        return;
      });


    app.post("/canceltfa", async (req, res) => {
        if (!req.cookies["G_VAR"]) {
            res.status(400).send({ error: "User not logged in." });
            return;
        }

        let payload2;
        try {
            payload2 = verify(req.cookies["G_VAR"], process.env.REFRESH_TOKEN_SECRET!);
        } catch (err) {
            res.clearCookie("G_VAR").status(400).send({error: "Invalid cookie."});
            return;
        }

        if (!payload2) {
            res.clearCookie("G_VAR").status(400).send({ error: "No User found." });
            return;
        }

        const payload = payload2 as Payload;
        try {
            await User.update({id: payload.userId}, {users2FA: "0"});
        } catch (err) {
            console.error(err);
            res.status(400).send({ error: "Internal Error" });
            return;
        }
        res.send({error: false});
    });

    app.post("/deleteKey", async (req, res) => {
        if (!req.cookies["G_VAR"]) {
            res.status(400).send({ error: "User not logged in." });
            return;
        }
        
        if (!req.body["name"] || !req.body["id"]) {
            res.status(400).send({error: "Missing parameters."});
            return;
        }

        let payload2;
        try {
            payload2 = verify(req.cookies["G_VAR"], process.env.REFRESH_TOKEN_SECRET!);
        } catch (err) {
            res.clearCookie("G_VAR").status(400).send({error: "Invalid cookie."});
            return;
        }

        if (!payload2) {
            res.clearCookie("G_VAR").status(400).send({ error: "No User found." });
            return;
        }

        const payload = payload2 as Payload;
        try {
            const gotKey = await Key.findOne({where: { keysOwner: payload.userId, id: req.body.id}});
            if (!gotKey) {
                res.status(400).send({ error: "No key found." });
                return;
            }
            const gotKeyAuthenticator = await KeysAuthenticator.findOne({ where: { id: gotKey.keysAuthenticator, name: req.body.name }});
            if (!gotKeyAuthenticator) {
                res.status(400).send({ error: "No key found." });
                return;
            }
            console.log(await getConnection().createQueryBuilder().delete().from(KeysAuthenticator).where("id = :id", { id: gotKey.keysAuthenticator }).execute());
            console.log(await getConnection().createQueryBuilder().delete().from(Key).where("keysOwner = :keysOwner", { keysOwner: payload.userId }).execute());
        } catch (err) {
            console.error(err);
            res.status(400).send({ error: "Internal Error" });
            return;
        }
        res.send({error: false});
    });

    app.get("/getkeys", async (req, res) => {
        if (!req.cookies["G_VAR"]) {
            res.status(400).send({ error: "User not logged in." });
            return;
        }

        let payload2;
        try {
            payload2 = verify(req.cookies["G_VAR"], process.env.REFRESH_TOKEN_SECRET!);
        } catch (err) {
            res.clearCookie("G_VAR").status(400).send({error: "Invalid cookie."});
            return;
        }

        if (!payload2) {
            res.clearCookie("G_VAR").status(400).send({ error: "No User found." });
            return;
        }

        const payload = payload2 as Payload;
        try {
            const gotKey = await Key.find({where: { keysOwner: payload.userId}});
            if (!gotKey) {
                res.status(400).send({ error: "No key found." });
                return;
            }
            let toSend = [];
            for (let i=0;i<gotKey.length;i++) {
                let authetn = await KeysAuthenticator.findOne({where: {id: gotKey[i].keysAuthenticator}});
                if (!authetn) {
                    continue
                }
                toSend.push({id: gotKey[i].id, name: authetn.name});
            }
            res.send({keys: toSend});
        } catch (err) {
            console.error(err);
            res.status(400).send({ error: "Internal Error" });
            return;
        }
    });

    app.post("/enabletfa", async (req, res) => {
        if (!req.cookies["G_VAR"]) {
            res.status(400).send({ error: "User not logged in." });
            return;
        }

        let payload2;
        try {
            payload2 = verify(req.cookies["G_VAR"], process.env.REFRESH_TOKEN_SECRET!);
        } catch (err) {
            res.clearCookie("G_VAR").status(400).send({error: "Invalid cookie."});
            return;
        }

        if (!payload2) {
            res.clearCookie("G_VAR").status(400).send({ error: "No User found." });
            return;
        }

        const payload = payload2 as Payload;
        try {
            await User.update({id: payload.userId}, {users2FA: "1"});
        } catch (err) {
            console.error(err);
            res.status(400).send({ error: "Internal Error" });
            return;
        }
        res.send({error: false});
    });

    interface Payload {
        userId: number;
        tokenVersion: number;
        iat: number;
        exp: number;
    }

    app.get("/auth", async (req, res) => {
        if (req.cookies["G_VAR"]) {
            console.log(`[server] Verifying ${req.cookies.G_VAR}`);
            let payload2;
            try {
                payload2 = verify(req.cookies["G_VAR"], process.env.REFRESH_TOKEN_SECRET!);
            } catch (err) {
                res.clearCookie("G_VAR").json({error: true, msg: "Invalid cookie."});
                return;
            }

            if (!payload2) {
                res.clearCookie("G_VAR").json({ error: true });
                return;
            }

            const payload = payload2 as Payload;
            const user = await User.findOne({ where: {id: payload.userId} });

            if (!user) {
                res.clearCookie("G_VAR").json({ error: true, msg: "Invalid cookie." });
                return;
            }
            res.render("auth", {userName: user.usersRName});
            return;
        }
        res.render("auth");
    });

    app.post("/auth", async (req, res) => {
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
        await getConnection().getRepository(User).increment({id: user.id}, 'usersSuccessLogins', 1);
        await sendRequest(req.body.userData.website, req.body.userData.key, user.usersRName, user.usersEmail, user.usersName);
        res.json({ msg: "Good" });
    });

    app.post("/login", async (req, res) => {
        if (!req.body["userData"]) {
            res.json({error: true, errorMessage: "An error occured. Please refresh"});
            return;
        }
        const data: any = req.body.userData;
        if (!data["username"] || !data["password"]) {
            res.json({error: true, errorMessage: "Missing fields"});
            return;
        }
        const user = await User.findOne({ where: { usersName: data.username } });

        if (!user) {
            res.json({ error: true, errorMessage: "Invalid Username." });
            return;
        }

        if (!await compare(data.password, user.usersPassword)) {
            res.json({ error: true, errorMessage: "Invalid Password." });
            await getConnection().getRepository(User).increment({id: user.id}, 'usersFailedLogins', 1);
            return;
        }
        if (user.users2FA === "1") {
            const findKeys = await Key.find({where: {keysOwner: user.id.toString() }});
            if (findKeys.length !== 0) {
                res.cookie("G_VAR", createRefreshToken(user), { maxAge: 990000000}).json({ error: false, tfa: true });
                return;
            }
        }

        // sendRefreshToken(res, createRefreshToken(user));
        return res.cookie("G_VAR", createRefreshToken(user), { maxAge: 990000000}).json({error: false});
    });

    app.post("/signup", async (req, res) => {
        if (!req.body["userData"]) {
            res.json({error: true, errorMessage: "An error occured. Please refresh"});
            return;
        }
        const data = req.body.userData;
        data["phone"] = "false";
        if (!data["rname"] || !data["email"] || !data["username"] || !data["phone"] || !data["password"] || !data["rpassword"] || data["twofa"]===undefined) {
            res.json({error: true, errorMessage: "Missing fields"});
            return;
        }
        if (data.password !== data.rpassword) {
            res.json({error: true, errorMessage: "Passwords don't match!"});
            return;
        }

        const user = await User.findOne({ where: {usersName: data.username} });

        if (user) {
            res.json({error: true, errorMessage: "User already exists!"});
            return;
        }

        const hashedPassword = await hash(data.password, 3);

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
            res.json({error: true, errorMessage: "Error registering user."});
            return;
        }

        const userLogged = await User.findOne({ where: {usersName: data.username} });

        if (!userLogged) {
            res.json({error: true, errorMessage: "Error registering user."});
            return;
        }
        if (data.twofa) {
            res.cookie("G_VAR", createRefreshToken(userLogged), { maxAge: 990000000}).json({error: false, twofa: true});
            return;
        }
        res.cookie("G_VAR", createRefreshToken(userLogged), { maxAge: 990000000}).json({error: false});
    });

    app.post("/myAuth", async (req, res) => {
        const siteArray = await Site.find({ where: { sitesOwner: req.body.username} });
        const sites = siteArray.map((site) => {return {site: site.sitesWebsite, blackList: site.sitesBlackList}});
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
        for (let i=0;i<siteKeys.length;i++) {
            let value = sitesPopular[siteKeys[i]];
            if (value > currentPop.val) {
                currentPop.val = value;
                currentPop.key = siteKeys[i];
            }
        }
        mostPopular = currentPop.key;
        let keyDataArray = [];
        const keys = await Key.find({where: {keysOwner : user.id}});
        for (let i=0; i<keys.length; i++) {
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
            attemptedLogins: success+failed,
            failedLogins: failed,
            tfa: user.users2FA,
            tfaKeys: keyDataArray
        }
        
        io.to(req.body.key).emit("login", info);
        res.json({ msg: "Good" });
    });

    app.post("/contact", (req, res) => {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress ;
        console.log(req.body);
        console.log(`[server] ${req.body.email}@${ip} sent contact form.`);
        // sendMail(req.body.email, req.body.what);
        res.json({msg: "Message Recieved!"});
    });

    app.post("/refresh_token", async (req, res) => {
        const token = req.cookies.G_VAR;
        
        if (!token) {
            return res.send({ ok: false, accessToken: "" });
        }

        let payload: any = null;

        try {
            payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
        } catch (err) {
            console.error(err);
            return res.send({ ok: false, accessToken: "" });
        }

        const user = await User.findOne({id: payload.userId});

        if (!user) {
            return res.send({ ok: false, accessToken: "" });
        }

        if (user.tokenVersion !== payload.tokenVersion) {
            return res.send({ ok: false, accessToken: "" });
        }

        sendRefreshToken(res, createRefreshToken(user));

        return res.send({ ok: true, accessToken: createAccessToken(user) });
    });

    await createConnection();

    io.on("connection", (socket: any) => {
        console.log(`Connection from ${socket.id}`);

        socket.on("blacklist", async (data: any) => {
            if (!data["name"] || !data["key"] || data["blackList"] === undefined) {
                io.to(socket.id).emit("blacklist", false);
                return;
            }
            if (data.name === "http://localhost:4000/myAuth" || data.name === "https://auth.gruzservices.com/myAuth") {
                io.to(socket.id).emit("blacklist", false);
                return;
            }
            const site = await Site.findOne({ where: { sitesWebsite: data.name } });
            if (!site) {
                io.to(socket.id).emit("blacklist", false);
                return;
            }
            let owner = site.sitesOwner;
            let website = site.sitesWebsite;
            if (hashed(hashed(owner)+hashed(website)) !== hashed(hashed(owner)+hashed(data.name))) {
                io.to(socket.id).emit("blacklist", false);
                return;
            }
            
            if (data.blackList) {
                console.log(`[server] Blacklisting ${data.name} for ${owner}.`);
                await Site.update({sitesHash: hashed(hashed(owner)+hashed(data.name))}, {sitesBlackList: "true"});
            } else {
                console.log(`[server] Unblacklisting ${data.name} for ${owner}.`);
                await Site.update({sitesHash: hashed(hashed(owner)+hashed(data.name))}, {sitesBlackList: "false"});
            }
            io.to(socket.id).emit("blacklist", true);
        });
    });

    server.listen(4000, () => {
        console.log("[server] Running on port 4000.");
    });
})();
