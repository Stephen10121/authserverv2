const r = document.querySelector(':root');

export const toggle = () => {
    const rs = getComputedStyle(r);
    if (window.localStorage.getItem("theme") === "dark" | !window.localStorage.getItem("theme")) {
        r.style.setProperty('--header-background-color', '#202020');
        r.style.setProperty('--header-color', 'rgb(179, 179, 179)');
        r.style.setProperty('--main-background-color', 'rgb(25, 32, 43)');
        r.style.setProperty('--main-color', '#dfdfdf');
        r.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.24) 0px 3px 8px');
        window.localStorage.setItem("theme", "light");
    } else {
        r.style.setProperty('--header-background-color', '#f3f3f3');
        r.style.setProperty('--header-color', '#000000');
        r.style.setProperty('--main-background-color', '#dfdfdf');
        r.style.setProperty('--main-color', '#000000');
        r.style.setProperty('--shadow', 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px');
        window.localStorage.setItem("theme", "dark");
    }
}

export const toggleStartup = () => {
    if (window.localStorage.getItem("theme") === "light" | !window.localStorage.getItem("theme")) {
        r.style.setProperty('--header-background-color', '#202020');
        r.style.setProperty('--header-color', 'rgb(179, 179, 179)');
        r.style.setProperty('--main-background-color', 'rgb(25, 32, 43)');
        r.style.setProperty('--main-color', '#dfdfdf');
        r.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.24) 0px 3px 8px');
    } else {
        r.style.setProperty('--header-background-color', '#f3f3f3');
        r.style.setProperty('--header-color', '#000000');
        r.style.setProperty('--main-background-color', '#dfdfdf');
        r.style.setProperty('--main-color', '#000000');
        r.style.setProperty('--shadow', 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px');
    }
}