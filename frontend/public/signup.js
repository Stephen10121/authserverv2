const errorMessage = document.getElementById("signuperror");
const gerrorMessage = document.getElementById("gsignuperror");

document.getElementById("signupform").addEventListener("submit", (e) => {
    e.preventDefault();
    let data;
    try {
        data = {
            rname: e.target[0].value,
            email: e.target[1].value,
            username: e.target[2].value,
            password: e.target[3].value,
            rpassword: e.target[4].value,
            twofa: e.target[5].checked
        }
    } catch (error) {
        errorMessage.innerText = "Missing Data. Refresh the page.";
        errorMessage.classList.remove("hide");
        return;
    }
    axios.post('/signup', {
        userData: data
      })
      .then((res) => {
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
        if (data.twofa) {
            gerrorMessage.innerText = "Success.";
            gerrorMessage.classList.remove("hide");
            setTimeout(() => {
                document.querySelector("#signupform").style.marginLeft = "-100%";
                document.querySelector("#nouser .tfa").style.marginLeft = "-100%";
            }, 500);
            return;
        }
        setTimeout(successMessage, 500);
        gerrorMessage.innerText = "Success.";
        gerrorMessage.classList.remove("hide");
      })
      .catch(function (error) {
        console.log(error);
        errorMessage.innerText = "An error occured. Please refresh.";
        errorMessage.classList.remove("hide");
        return;
    });
});


const successMessage = () => document.querySelector("#nouser").classList.add("successAnimation");

const relocate = (cancel) => {
    if (cancel) {
        axios.post('/canceltfa')
          .then((res) => {
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
            window.location.href = "/";
          })
          .catch((error) => {
            console.log(error);
            errorMessage.innerText = "An error occured. Please refresh.";
            errorMessage.classList.remove("hide");
            return;
        });
    }
    window.location.href = "/"
};

const clickSuccess = () => {
    setTimeout(() => {
        if (!document.querySelector("#nouser").classList.contains("successAnimation")) {
            return;
        }
        window.location.href = "/";
    }, 500);
}
const submitButton = document.querySelector("#submitButton");
const checkBoxChange = (e) => {
    submitButton.innerText = e.checked ? "Next" : "Signup";
}

const { startRegistration } = SimpleWebAuthnBrowser;


// <button>
const elemBegin = document.getElementById('btnBegin');
// <span>/<p>/etc...
const elemSuccess = document.getElementById('success');
// <span>/<p>/etc...
const elemError = document.getElementById('error');

// Start registration when the user clicks a button
elemBegin.addEventListener('click', async () => {
    elemBegin.style.display = "none";
// Reset success/error messages
elemSuccess.innerHTML = '';
elemError.innerHTML = '';
const keyname = document.querySelector("#keyName").value;
if (!keyname || keyname===undefined || keyname ==="") {
    elemError.innerText = "Name the 2fa Method.";
    elemBegin.style.display = "block";
    return;
}

// GET registration options from the endpoint that calls
// @simplewebauthn/server -> generateRegistrationOptions()
const resp = await fetch(`/getRegistrationOptions`);
console.log(resp);
let attResp;
try {
    // Pass the options to the authenticator and wait for a response
    attResp = await startRegistration(await resp.json());
    attResp["keyName"] = keyname;
} catch (error) {
    // Some basic error handling
    if (error.name === 'InvalidStateError') {
    elemError.innerText = 'Error: Authenticator was probably already registered by user';
    } else {
    elemError.innerText = error;
    }

    throw error;
}

// POST the response to the endpoint that calls
// @simplewebauthn/server -> verifyRegistrationResponse()
const verificationResp = await fetch('/register', {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    },
    body: JSON.stringify(attResp),
});

// Wait for the results of verification
const verificationJSON = await verificationResp.json();

// Show UI appropriate for the `verified` status
if (verificationJSON && verificationJSON.verified) {
    elemSuccess.innerHTML = 'Success!';
    document.querySelector("#finishButton").style.display = "block";
    document.querySelector("#cancelButton").style.display = "none";
} else {
    elemError.innerHTML = `Oh no, something went wrong! Response: <pre>${JSON.stringify(
    verificationJSON,
    )}</pre>`;
}
});