<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  import * as SimpleWebAuthnBrowser from "@simplewebauthn/browser";
  const { startRegistration } = SimpleWebAuthnBrowser;

  let elemBegin;
  let elemSuccess;
  let elemError;
  let keyName;

  const relocate = async (cancel) => {
    if (cancel) {
      dispatch("cancel", true);
    } else {
      dispatch("success", true);
    }
  };

  // Start registration when the user clicks a button
  const beginRegistration = async () => {
    elemBegin.style.display = "none";
    // Reset success/error messages
    elemSuccess.innerHTML = "";
    elemError.innerHTML = "";
    if (!keyName || keyName === undefined || keyName === "") {
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
      attResp["keyName"] = keyName;
    } catch (error) {
      // Some basic error handling
      if (error.name === "InvalidStateError") {
        elemError.innerText =
          "Error: Authenticator was probably already registered by user";
      } else {
        elemError.innerText = error;
      }

      throw error;
    }

    // POST the response to the endpoint that calls
    // @simplewebauthn/server -> verifyRegistrationResponse()
    const verificationResp = await fetch("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attResp),
    });

    // Wait for the results of verification
    const verificationJSON = await verificationResp.json();

    // Show UI appropriate for the `verified` status
    if (verificationJSON && verificationJSON.verified) {
      dispatch("success", true);
      elemSuccess.innerHTML = "Success!";
      document.querySelector("#finishButton").style.display = "block";
      document.querySelector("#cancelButton").style.display = "none";
    } else {
      elemError.innerHTML = `Oh no, something went wrong! Response: <pre>${JSON.stringify(
        verificationJSON
      )}</pre>`;
    }
  };
</script>

<div class="addOn" id="addOnCover">
  <div class="addOnBox">
    <p class="status"
      ><span bind:this={elemSuccess} id="success" /><span
        bind:this={elemError}
        id="error"
      /></p
    >
    <div class="label">
      <div class="iconpart"
        ><img src="/icons/cursor-text.svg" alt="Person" /></div
      >
      <input
        bind:value={keyName}
        type="text"
        placeholder="2fa Method Name (e.g., Bobs Security Key)."
        id="keyName"
      />
    </div>
    <button bind:this={elemBegin} on:click={beginRegistration} id="btnBegin"
      >Begin</button
    >
    <button id="finishButton" style="display:none;" on:click={relocate}>
      Finish
    </button>
    <button
      id="cancelButton"
      on:click={() => {
        relocate(true);
      }}>Cancel</button
    >
  </div>
</div>

<style>
  .addOn {
    width: 100vw;
    height: 100vh;
    background: none;
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 200;
  }

  .addOnBox {
    width: 60%;
    height: 60%;
    background-color: var(--main-background-color);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    border: 1px solid black;
    box-shadow: var(--shadow);
    gap: 20px;
  }

  .status * {
    font-family: "George-Italic", sans-serif;
    font-size: 1.5rem;
    font-weight: bold;
    font-stretch: expanded;
  }
  .status #success {
    color: rgb(134, 255, 134);
  }
  .status #error {
    color: red;
  }

  input {
    height: 40px;
    width: 100%;
    border: 1px solid gray;
    border-bottom-right-radius: 5px;
    border-top-right-radius: 5px;
    padding: 0 10px;
    font-family: "George-Italic", sans-serif;
  }

  .label {
    display: flex;
    width: 90%;
    flex-direction: row;
  }

  .iconpart {
    height: 40px;
    width: 40px;
    background: rgb(134, 255, 134);
    border-bottom-left-radius: 5px;
    border-top-left-radius: 5px;
    border: 1px solid gray;
    border-right: none;
    padding: 7px;
  }

  .iconpart img {
    width: 100%;
    height: 100%;
    user-drag: none;
    -webkit-user-drag: none;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
  }

  button {
    -webkit-text-size-adjust: 100%;
    box-sizing: border-box;
    font-size: 100%;
    line-height: 1.15;
    margin: 0;
    overflow: visible;
    text-transform: none;
    -webkit-appearance: button;
    width: 90%;
    padding: 10px;
    background-color: #86ff86;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-family: "George-Italic", sans-serif;
  }

  button:hover {
    outline: 2px solid rgb(134, 255, 134);
  }
</style>
