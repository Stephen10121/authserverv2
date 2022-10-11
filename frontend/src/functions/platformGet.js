import platform from "platform";
export default function platformGet() {
    console.log(platform);
    fetch("/device", { method: "POST", body: JSON.stringify(platform) })
    .then((response) => response.json())
    .then((data) => {
        console.log(data);
    });
    return platform;
}