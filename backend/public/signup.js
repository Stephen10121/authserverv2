const errorMessage = document.getElementById("signuperror");
const gerrorMessage = document.getElementById("gsignuperror");

document.getElementById("nouser").addEventListener("submit", (e) => {
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


const successMessage = () => {
    const form = document.querySelector("form");
    form.classList.add("successAnimation");
}

const clickSuccess = () => {
    if (!document.querySelector("form").classList.contains("successAnimation")) {
        return;
    }
    window.location.href = "/";
}