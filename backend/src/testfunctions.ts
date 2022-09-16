import base64url from 'base64url';
import { User } from "./entity/User";
import { Key, KeysAuthenticator } from "./entity/Keys";
type AuthenticatorTransport = "ble" | "internal" | "nfc" | "usb";

export type Authenticator = {
    id: number;
    // SQL: Encode to base64url then store as `TEXT`. Index this column
    credentialID: Buffer;
    // SQL: Store raw bytes as `BYTEA`/`BLOB`/etc...
    credentialPublicKey: Buffer;
    // SQL: Consider `BIGINT` since some authenticators return atomic timestamps as counters
    counter: number;
    // SQL: `VARCHAR(255)` and store string array as a CSV string
    // ['usb' | 'ble' | 'nfc' | 'internal']
    transports?: AuthenticatorTransport[];
    owner: string;
    blacklist: boolean;
    name: string;
};

export type UserModel = {
    id: string;
    username: string;
    currentChallenge: string;
    devices: Array<Authenticator>;
};


export async function getUserFromDB(id: number) {
    const user = await User.findOne({ where: {id}});
    if (!user) {
        return false;
    }
    let devices = await Key.find({ where: { keysOwner: id } });
    let newDevices = [];
    for (let i=0; i<devices.length; i++) {
        let newAuth = await KeysAuthenticator.findOne({where : {id: devices[i].keysAuthenticator}});
        if (!newAuth) {
            continue
        }
        console.log({credid:newAuth.credentialID, credpubkey: newAuth.credentialPublicKey});
        newAuth.transports = JSON.parse(newAuth.transports);
        newDevices.push(newAuth as unknown as Authenticator);
    }
    const newModel = {id: `${id}`, username: user.usersName, currentChallenge: user.usersCurrentChallenge, devices: newDevices}
    return newModel as UserModel;
  }
  
export async function setUserCurrentChallenge(user: UserModel, challenge: string) {
    try {
        await User.update({id: parseInt(user.id)}, {usersCurrentChallenge: challenge});
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export async function getUserCurrentChallenge(user: UserModel) {
    try {
        const findUser = await User.findOne({ where: { id: parseInt(user.id)} });
        if (!findUser) {
            return false;
        }
        return findUser.usersCurrentChallenge;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export async function addNewDevice(device:Authenticator) {
    try {
        console.log({newcred:Buffer.from(device.credentialID.toJSON().data).toString(),newcredPubKey:device.credentialPublicKey});
        let newDevice = {
            credentialID: device.credentialID,
            credentialPublicKey: device.credentialPublicKey,
            counter: device.counter,
            transports: JSON.stringify(device.transports),
            owner: device.owner,
            blacklist: device.blacklist,
            name: device.name
        }
        const addedAuthenticator = await KeysAuthenticator.insert(newDevice);
        await Key.insert({
            keysOwner: device.owner,
            keysAuthenticator: addedAuthenticator.raw
        });
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export function getUserAuthenticator(user: UserModel, id: any) {
    for (let i = 0; i<user.devices.length; i++) {
        console.log({id: Buffer.from(id), userDevices: base64url.encode(user.devices[i].credentialID)});
        if (base64url.encode(user.devices[i].credentialID) === id) {
            return user.devices[i] as Authenticator;
        }
    }
    return false;
}

export async function saveUpdatedAuthenticatorCounter(authenticator: Authenticator, newCount: number) {
    try {
        await KeysAuthenticator.update({id: authenticator.id}, {counter: newCount});
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}