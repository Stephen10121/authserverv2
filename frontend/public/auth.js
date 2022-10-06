const errorMessage = document.getElementById("signuperror");
const errorM2 = document.getElementById('error2cool');

const newUser = () => {
    document.getElementById("isuser").style.display = "none";
    document.getElementById("nouser").style.display = "flex";
}

const currentUser = () => {
    document.getElementById("isuser").style.display = "flex";
    document.getElementById("nouser").style.display = "none";
}

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

const sendAuth = () => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const website = urlParams.get('website');
    const key = urlParams.get('key');
    const cookie = getCookie("G_VAR");
    const data = {
        key,
        website,
        cookie
    }

    axios.post('/auth', {
        userData: data
    })
    .then((res) => {
        if (!res) {
            alert("error. check console.");
            return;
        }
        if (res.data.error) {
            console.log(res.data.error, res.data.errorMessage);
            alert("error. check console.");
            return;
        }
        if (res.data.tfa) {
            document.querySelector("#tfaPart").style.display = "flex";
            document.querySelector("#isuser").style.display = "none";
            setTimeout(tfaSend, 500);
            return;
        }
        errorMessage.innerText = "Success";
        errorMessage.classList.remove("hide");
        errorM2.innerText = "Success";
        errorM2.classList.remove("hide");
        window.close();
      })
      .catch(function (error) {
        console.log(error);
        alert("error. check console.");
        return;
    });
}

document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    let data;
    try {
        data = {
            username: e.target[0].value,
            password: e.target[1].value
        }
    } catch (error) {
        errorMessage.innerText = "An error occured. Please refresh.";
        errorMessage.classList.remove("hide");
        return;
    }
    errorMessage.innerText = "loading";
    errorMessage.classList.remove("hide");
    axios.post('/login', {
        userData: data
      })
      .then((res) => {
        errorMessage.classList.add("hide");
        if (!res) {
            errorMessage.innerText = "An error occured. Please refresh.";
            errorMessage.classList.remove("hide");
            return;
        }
        if (res.data.error) {
            errorMessage.innerText = res.data.errorMessage;
            errorMessage.classList.remove("hide");
            return;
        }
        if (res.data.tfa) {
            document.querySelector("#tfaPart").style.display = "flex";
            document.querySelector("#nouser").style.display = "none";
            setTimeout(tfaSend, 500);
            return;
        }
        errorMessage.innerText = "Success.";
        errorMessage.classList.remove("hide");
        sendAuth();
      })
      .catch(function (error) {
        console.log(error);
        errorMessage.innerText = "An error occured. Please refresh.";
        errorMessage.classList.remove("hide");
        return;
    });
});


const { startAuthentication } = SimpleWebAuthnBrowser;

// <span>/<p>/etc...
const elemSuccess2 = document.getElementById('success2');
// <span>/<p>/etc...
const elemError2 = document.getElementById('error2');

// Start authentication when the user clicks a button
const tfaSend = async () => {
// Reset success/error messages
elemSuccess2.innerHTML = '';
elemError2.innerHTML = '';

// GET authentication options from the endpoint that calls
// @simplewebauthn/server -> generateAuthenticationOptions()
const resp = await fetch('/getAuthenticationOptions');

let asseResp;
try {
    // Pass the options to the authenticator and wait for a response
    asseResp = await startAuthentication(await resp.json());
} catch (error) {
    // Some basic error handling
    elemError2.innerText = error;
    throw error;
}

// POST the response to the endpoint that calls
// @simplewebauthn/server -> verifyAuthenticationResponse()
const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
const website = urlParams.get('website');
const key = urlParams.get('key');
const cookie = getCookie("G_VAR");
const data = {
    key,
    website,
    cookie
}
const verificationResp = await fetch('/startAuthentication', {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    },
    body: JSON.stringify({asseResp, userData: data}),
});

// Wait for the results of verification
const verificationJSON = await verificationResp.json();

// Show UI appropriate for the `verified` status
if (verificationJSON && verificationJSON.verified) {
    elemSuccess2.innerHTML = 'Success!';
    window.close();
} else {
    elemError2.innerHTML = `Oh no, something went wrong! Response: <pre>${JSON.stringify(
    verificationJSON.error,
    )}</pre>`;
}
}