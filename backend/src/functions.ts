import { Site } from "./entity/Sites";
import { createHash } from "crypto";
import request from "request";

export const hashed = (password: string) => {
    const hash = createHash('sha256').update(password).digest("hex");
    return hash;
}

const addSite = async (owner: string, website: string):Promise<boolean> => {
    try {
        await Site.insert({
            sitesOwner: owner,
            sitesWebsite: website,
            sitesHash: hashed(hashed(owner)+hashed(website)),
            sitesBlackList: "false"
        });
    } catch (err) {
        console.error(err);
        return false;
    }
    return true;
}

async function getSites(owner: string, website: string) {
    const sites = await Site.findOne({ where: { sitesOwner: owner, sitesWebsite: website } });
    if (!sites) {
        return false;
    }
    return sites;
}

const getOtherWebsiteKey = async (website: string, owner: string):Promise<String> => {

    let userSites = await getSites(owner, website);
    if (!userSites) {
        await addSite(owner, website);
        userSites = await getSites(owner, website) as any;
    }
    const sites = userSites as any;
    
    if (sites.sitesBlackList === "false") {
        return sites.sitesHash;
    };
    return "false";
}

export const sendRequest = async (website: string, key: string, name: string, email: string, username: string) => {
    const userData = await getOtherWebsiteKey(website, username);
    if (userData === "false") {
        return;
    }
    var clientServerOptions = {
        uri: website,
        body: JSON.stringify({data: userData, key, name, email, username}),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }
    return request(clientServerOptions, (error, _response) => {
        if (error) {
            return "error";
        }
        return;
    });
}