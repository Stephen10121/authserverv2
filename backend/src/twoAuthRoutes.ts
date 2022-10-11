import { verify } from "jsonwebtoken";
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import {getUserFromDB, setUserCurrentChallenge, getUserCurrentChallenge, UserModel, Authenticator, addNewDevice, getUserAuthenticator, saveUpdatedAuthenticatorCounter } from "./testfunctions";
import { User } from "./entity/User";
import { getConnection } from "typeorm";
import { sendRequest } from "./functions";
import { Router } from "express";
import { Key, KeysAuthenticator } from "./entity/Keys";

interface Payload {
    userId: number;
    tokenVersion: number;
    iat: number;
    exp: number;
}

export const twoAuthRoutes = Router();

// Human-readable title for your website
const rpName = 'GruzAuth';
// A unique identifier for your website
const rpID = 'auth.gruzservices.com';
// The URL at which registrations and authentications should occur
const origin = `https://${rpID}`;

    
twoAuthRoutes.get("/getRegistrationOptions", async (req, res) => {
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
    
    
    
    
twoAuthRoutes.post("/register", async (req, res) => {
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

twoAuthRoutes.get("/getAuthenticationOptions", async (req, res) => {
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
    
twoAuthRoutes.post("/startAuthentication", async (req, res) => {
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
    
    if (await sendRequest(body.userData.website, body.userData.key, user2.usersRName, user2.usersEmail, user2.usersName) === "blacklist") {
        await getConnection().getRepository(User).increment({id: user2.id}, 'usersFailedLogins', 1);
        res.json({error: false, blacklist: true});
        return;
    }
    
    await getConnection().getRepository(User).increment({id: user2.id}, 'usersSuccessLogins', 1);
    res.send({verified});
    return;
});

twoAuthRoutes.post("/canceltfa", async (req, res) => {
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

twoAuthRoutes.post("/deleteKey", async (req, res) => {
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

twoAuthRoutes.get("/getkeys", async (req, res) => {
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

twoAuthRoutes.post("/enabletfa", async (req, res) => {
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
