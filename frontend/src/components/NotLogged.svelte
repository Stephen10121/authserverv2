<script lang="ts">
  import { loginIt } from "../functions/login";
  export let PROXY;
  let popup1;
  let home1;
  let contact1;
  let about1;
  let bhome1;
  const contact = () => {
    home1.classList.add("hide");
    contact1.classList.remove("hide");
    about1.classList.add("hide");
    bhome1.classList.remove("hide");
  };
  const about = () => {
    home1.classList.add("hide");
    about1.classList.remove("hide");
    contact1.classList.add("hide");
    bhome1.classList.remove("hide");
  };
  const home = () => {
    about1.classList.add("hide");
    home1.classList.remove("hide");
    contact1.classList.add("hide");
    bhome1.classList.add("hide");
  };
  const submitContact = (e: any) => {
    e.preventDefault();
    fetch(`${PROXY}contact`, {
      method: "POST",
      body: JSON.stringify({
        email: e.target[0].value,
        what: e.target[1].value,
      }),
    });
  };
  const closeN = () => {
    popup1.classList.remove("movedown");
    popup1.classList.add("moveup");
    return;
  };
  const openN = () => {
    popup1.classList.remove("moveup");
    popup1.classList.add("movedown");
    return;
  };
</script>

<div class="main">
  <div class="popup" bind:this={popup1}>
    <div><button on:click={closeN}>&#10006;</button></div>
    <p id="message">N/A</p>
  </div>
  <header>
    <a href="/"><h1>Gruzservices</h1></a>
    <ul>
      <li id="bhome" bind:this={bhome1} class="hide"
        ><button on:click={home}>Home</button></li
      >
      <li><button on:click={contact}>Contact</button></li>
      <li><button on:click={about}>About</button></li>
    </ul>
  </header>
  <main>
    <section class="home" bind:this={home1}>
      <section class="sec1">
        <div>
          <button id="sauth-login" on:click={() => loginIt(PROXY)}
            >Login with Gruzservices <span
              ><img src="/lock2.svg" alt="Lock" /></span
            ></button
          ><br /><br />
          <a id="sauth-signup" href="/signup">Signup to Gruzservices</a>
        </div>
      </section>
      <section class="sec2">
        <img src="/lock.svg" alt="Lock Icon" />
      </section>
    </section>
    <section class="contact hide" bind:this={contact1}>
      <section class="sec2">
        <img src="/contact.svg" alt="Lock Icon" />
      </section>
      <section class="sec1">
        <form id="contactform" class="contact" on:submit={submitContact}>
          <input name="email" type="email" placeholder="Email" required />
          <textarea
            name="what"
            id="textarea"
            cols="30"
            rows="10"
            placeholder="What do you want to tell me?"
            required
          />
          <button type="submit">Send</button>
        </form>
      </section>
    </section>
    <section class="about hide" bind:this={about1}>
      <section class="sec1">
        <div>
          <h1>What is this?</h1>
          <p
            >Every time I build a website, I have to do the authentication part
            every single time. It is unnecessary and not convenient to the end
            user. Now I only need to plug my server to this authentication
            server and not worry about it again.</p
          >
        </div>
      </section>
      <section class="sec2">
        <img src="/about.svg" alt="Lock Icon" />
      </section>
    </section>
  </main>
</div>

<style>
  @font-face {
    font-family: "George-Italic";
    src: url(/fonts/Louis-George-Cafe-Italic.ttf);
  }

  :root {
    --background-color: #f3f3f3;
  }

  .main {
    width: 100vw;
    height: 100vh;
    display: grid;
    grid-template-rows: 70px calc(100vh - 70px);
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
  }

  header a {
    color: black;
    text-decoration: none;
  }

  header a h1 {
    font-family: "Poppins", sans-serif;
  }

  header ul {
    box-sizing: border-box;
    font-family: Poppins, sans-serif;
    margin: 0;
    padding: 0;
    text-decoration: none;
  }

  header ul li {
    display: inline;
    padding: 0 15px;
    border-right: 1px solid #000;
  }

  header ul li:last-child {
    border-right: none;
  }

  header ul li button {
    margin: 2px 0;
    font-family: "Poppins", sans-serif;
    color: #494949;
    border: none;
    background: none;
    cursor: pointer;
  }

  main {
    height: 100%;
    overflow-y: hidden;
    display: grid;
    grid-template-columns: 1vw 1vw 1vw;
  }

  .home,
  .contact,
  .about {
    width: 100vw;
    height: 100%;
    display: grid;
    background-color: var(--background-color);
    grid-template-columns: 1fr 1fr;
  }

  .hide {
    display: none;
  }
  .sec1 {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sec1 div,
  .sec1 form {
    display: flex;
    background-color: var(--background-color);
    border-radius: 10px;
    box-shadow: 0 3px 8px rgb(0 0 0 / 24%);
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 10px;
    height: 50%;
    padding: 20px;
    width: clamp(300px, 70%, 100%);
  }

  .contact input {
    width: 100%;
    height: 40px;
    border-radius: 100vw;
    border: 1px solid gray;
    padding: 10px;
  }

  .contact textarea {
    width: 100%;
    resize: none;
    border-radius: 20px;
    padding: 10px;
  }

  .contact button {
    width: 100%;
    height: 40px;
    background-color: rgb(134, 255, 134);
    border: none;
    border-radius: 100vw;
    cursor: pointer;
    font-family: "George-Italic", sans-serif;
  }

  .contact button:hover {
    outline: 2px solid rgb(134, 255, 134);
  }

  .sec2 {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .sec2 img {
    width: clamp(20px, 50%, 95%);
  }

  #sauth-signup {
    width: 220px;
    font-family: "George-Italic", sans-serif;
    border-radius: 100vw;
    font-size: 1em;
    text-decoration: none;
    color: black;
    text-align: center;
    padding: 15px;
    border: none;
    background-color: white;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    cursor: pointer;
    transition: box-shadow 0.25s linear;
  }

  #sauth-signup:hover {
    box-shadow: rgba(0, 0, 0, 0.24) 0px 8px 8px;
  }

  .popup {
    position: fixed;
    z-index: 100;
    width: 200px;
    height: 70px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 56, 94, 0.7);
    top: -90px;
    border-radius: 10px;
    font-family: "Poppins", sans-serif;
    padding: 10px;
  }

  @keyframes nmoveip {
    0% {
      top: -90px;
    }

    70% {
      top: 30px;
    }

    100% {
      top: 20px;
    }
  }

  @keyframes moveip {
    0% {
      top: 20px;
    }

    20% {
      top: 30px;
    }

    100% {
      top: -90px;
    }
  }

  .popup div {
    width: 100%;
    height: 20px;
  }

  .popup p {
    text-align: center;
  }

  .popup div button {
    float: right;
    background: none;
    border: none;
    outline: none;
    cursor: pointer;
    color: black;
  }

  .popup div button:hover {
    color: gray;
  }

  .about h1 {
    font-size: 2rem;
    font-family: "Poppins", sans-serif;
  }

  .about p {
    font-size: 1rem;
    font-family: sans-serif;
  }

  @media only screen and (max-width: 1100px) {
    .home,
    .contact,
    .about {
      grid-template-columns: 1fr;
    }

    .sec1 div,
    .sec1 form {
      width: 100%;
      height: 100%;
      border-radius: 0px;
      box-shadow: none;
    }

    .sec2 {
      display: none;
    }
  }

  @media only screen and (max-width: 500px) {
    .main {
      grid-template-rows: 100px auto;
    }

    header {
      justify-content: center;
      flex-direction: column;
      gap: 5px;
    }
  }
  #sauth-login {
    width: 220px;
    font-family: "George-Italic", sans-serif;
    border-radius: 100vw;
    border: none;
    background-color: white;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    height: 50px;
    cursor: pointer;
    transition: box-shadow 0.25s linear;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #sauth-login span {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #sauth-login:hover {
    box-shadow: rgba(0, 0, 0, 0.24) 0px 8px 8px;
  }
</style>
