import base64url from 'base64url';
import { User } from "./entity/User";
import { Key } from "./entity/Keys";

type AuthenticatorTransport = "ble" | "internal" | "nfc" | "usb";

export type Authenticator = {
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

let testUser = {
    id: `1`,
    username: "Jeff",
    devices: [],
    currentChallenge: ""
} as UserModel;

export async function getUserFromDB(id: number) {
    const user = await User.findOne({ where: {id}});
    const devices = await Key.find({ where: { keysOwner: id } });
    let parsedDevices = [];
    for (let i =0; i<devices.length;i++) {
        parsedDevices.push(JSON.parse(devices[i].keysAuthenticator));
    }
    console.log(parsedDevices);
    if (!user) {
        return false;
    }
    const newModel = {id: `${id}`, username: user.usersName, currentChallenge: user.usersCurrentChallenge, devices: parsedDevices}
    return newModel as UserModel;
    //return {id: `${id}`, username: user.usersName, currentChallenge: user.currentChal};
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
        await Key.insert({
            keysOwner: device.owner,
            keysAuthenticator: JSON.stringify(device)
        });
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export function getUserAuthenticators(_user: UserModel) {
    return testUser.devices;
}

export function getUserAuthenticator(user: UserModel, id: any) {
    return user.devices.find(device => device.credentialID.equals(base64url.toBuffer(id)));
}

export function saveUpdatedAuthenticatorCounter(authenticator: Authenticator, newCount: number) {
    authenticator.counter = newCount;
}