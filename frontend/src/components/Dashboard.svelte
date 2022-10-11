<script lang="ts">
  import Date from "./Date.svelte";
  import Meter from "./Meter.svelte";
  import Password from "./Password.svelte";
  import Stats from "./Stats.svelte";
  import { toggle, toggleStartup } from "../functions/toggleTheme";
  import Websites from "./Websites.svelte";
  import SecondFactor from "./SecondFactor.svelte";
  import AskPrompt from "./AskPrompt.svelte";
  import Notification from "./Notification.svelte";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  export let userData: any;
  export let socket: any;

  interface PromptAsk {
    promptPlaceholder: string;
    promptEvent: any;
    promptExtra: any;
    promptShow: boolean;
  }

  interface NotificationType {
    type: "alert" | "success" | "default";
    slot: string;
    show: boolean;
  }

  let secureSubs: number = userData.https;
  let logins: number = userData.attemptedLogins;
  let failed: number = userData.failedLogins;
  let popular: string = userData.mostPopular;
  let subscriptions: number = userData.sites.length;
  let tfa: string = userData.tfa;
  let tfaKeys: any = userData.tfaKeys;
  let tfaTrue = tfa === "1" ? true : false;
  let askPrompt: PromptAsk = {
    promptPlaceholder: "",
    promptEvent: console.log,
    promptExtra: "",
    promptShow: false,
  };
  let notification: NotificationType = {
    show: false,
    type: "success",
    slot: "",
  };

  toggleStartup();

  const changeNameCallback = (name: any, _extra: any) => {
    if (!name) {
      askPrompt.promptShow = false;
      return;
    }
    askPrompt.promptShow = false;
    fetch(`/changeName?name=${name.target[0].value}`, { method: "POST" })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          notification.type = "alert";
          notification.slot = `Cant change name to '${name.target[0].value}'.`;
          notification.show = true;
          return;
        }
        notification.type = "success";
        notification.slot = `Changed name to '${name.target[0].value}'.`;
        notification.show = true;
        dispatch("nameChange", name.target[0].value);
      });
  };

  const changeName = () => {
    askPrompt = {
      promptPlaceholder: "Change Name to",
      promptEvent: changeNameCallback,
      promptExtra: "",
      promptShow: true,
    };
  };
</script>

{#if notification.show}
  <Notification
    type={notification.type}
    on:close={() => {
      notification.show = false;
    }}>{notification.slot}</Notification
  >
{/if}
{#if askPrompt.promptShow}
  <AskPrompt
    promptEvent={askPrompt.promptEvent}
    promptExtra={askPrompt.promptExtra}
    promptPlaceholder={askPrompt.promptPlaceholder}
  />
{/if}
<main>
  <header>
    <h1>Auth Dashboard</h1>
    <ul>
      <li><button on:click={toggle}>Toggle Theme</button></li>
      <li><a href="/">Logout</a></li>
    </ul>
  </header>
  <section class="main">
    <section class="meterPart tile">
      <p class="meter-title">Secure Subscriptions</p>
      <div class="extraInfo">
        <p>?</p>
        <div class="show">
          Percentage of websites your subscribed to that encrypts their data.
        </div>
      </div>
      <Meter max={subscriptions} rotate={secureSubs} gaugeColor="#430498" />
    </section>
    <section class="stats tile">
      <Stats mostPopular={popular} {failed} {logins} {subscriptions} />
    </section>
    <section class="chart tile">
      <button id="change-name" on:click={changeName}>Change</button>
      <h1>Hi {userData.userData.name}</h1>
    </section>
    <section class="tile websites">
      <Websites
        sites={userData.sites}
        {socket}
        userData={userData.userData}
        on:error={({ detail }) => {
          notification = {
            show: true,
            type: "alert",
            slot: detail,
          };
        }}
        on:success={({ detail }) => {
          notification = {
            show: true,
            type: "success",
            slot: detail,
          };
        }}
      />
    </section>
    <section class="date tile">
      <Date />
    </section>
    <section class="password tile">
      <Password
        {tfaTrue}
        on:changeTfa={async ({ detail }) => {
          if (detail) {
            try {
              const resp = await fetch(`/enabletfa`, { method: "POST" });
              const respJson = await resp.json();
              if (!respJson.error) {
                tfaTrue = true;
              }
            } catch (error) {
              console.error(error);
              tfaTrue = false;
            }
          } else {
            try {
              const resp = await fetch(`/canceltfa`, { method: "POST" });
              const respJson = await resp.json();
              if (!respJson.error) {
                tfaTrue = false;
              }
            } catch (error) {
              console.error(error);
              tfaTrue = true;
            }
          }
        }}
      />
    </section>
    <section class="ips tile">
      <SecondFactor tfa={tfaTrue} tfaKeys2={tfaKeys} />
    </section>
  </section>
</main>

<style>
  main {
    display: grid;
    grid-template-rows: 70px auto;
    width: 100vw;
    height: 100vh;
  }

  header {
    width: 100vw;
    height: 100%;
    background-color: var(--header-background-color);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
  }

  header h1 {
    font-family: "Poppins", sans-serif;
    font-weight: bold;
    color: var(--header-color);
    display: none;
  }

  header li {
    display: inline;
  }

  header li:last-child {
    margin-left: 10px;
  }

  header a {
    color: var(--header-color);
    font-family: "Roboto", sans-serif;
    text-decoration: underline;
  }

  header button {
    background-color: var(--header-background-color);
    border: none;
    padding: 10px;
    border-radius: 5px;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    color: var(--header-color);
    font-family: "Poppins", sans-serif;
    cursor: pointer;
    transition: box-shadow 0.25s linear;
  }

  header button:hover {
    box-shadow: rgba(0, 0, 0, 0.24) 5px 7px 8px;
  }

  .meterPart {
    grid-area: meter;
    position: relative;
    padding-top: 10px;
  }

  .stats {
    grid-area: stats;
  }

  .chart {
    grid-area: chart;
    padding: 30px 0;
  }

  .chart h1 {
    font-family: "Roboto", sans-serif;
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--main-color);
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .date {
    grid-area: date;
  }

  .password {
    grid-area: password;
  }

  .ips {
    grid-area: ips;
  }

  .websites {
    grid-area: websites;
  }

  .main {
    width: 100vw;
    height: 100%;
    background-color: var(--main-background-color);
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 20px;
  }

  .tile {
    background-color: var(--main-background-color);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    position: relative;
    box-shadow: var(--shadow);
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }

  .meter-title {
    position: absolute;
    top: 10px;
    left: 10px;
    font-family: "Roboto", sans-serif;
    font-size: 1rem;
    font-weight: bold;
    color: var(--main-color);
  }

  .extraInfo p {
    width: 20px;
    height: 20px;
    background-color: black;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 1px;
    border-radius: 50%;
    position: absolute;
    top: 5px;
    right: 5px;
    cursor: pointer;
    font-family: "Roboto", sans-serif;
    font-weight: bold;
    user-select: none;
  }

  .show {
    opacity: 0;
    visibility: hidden;
    width: 200px;
    height: 100px;
    background-color: green;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 10;
    transition: 0.25s;
    font-family: "Roboto", sans-serif;
    padding: 10px;
    border-radius: 5px;
    background-color: rgba(0, 0, 0, 0.7);
    color: #dfdfdf;
  }

  .extraInfo:hover .show {
    opacity: 1;
    visibility: visible;
  }

  #change-name {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 5px 10px;
    background-color: rgb(119, 166, 194);
    border-radius: 100vh;
    cursor: pointer;
    font-size: 0.7rem;
    font-family: "Poppins", sans-serif;
    border: none;
  }

  @media only screen and (min-width: 700px) {
    .main {
      display: grid;
      overflow-y: auto;
      grid-template-columns: 1fr;
      align-items: initial;
      justify-content: initial;
      gap: 10px;
      grid-template-rows: 1fr 1fr 1fr 1fr;
      grid-template-areas: "meter stats stats stats" "chart chart date date" "password password date date" "ips websites websites ..." "... websites websites ...";
    }

    header {
      justify-content: space-between;
    }

    header h1 {
      display: block;
    }
  }
  @media only screen and (min-width: 1100px) {
    .main {
      display: grid;
      overflow-y: auto;
      grid-template-columns: auto;
      align-items: initial;
      justify-content: initial;
      gap: 10px;
      grid-template-rows: 1fr 1fr 1fr 1fr;
      grid-template-areas: "meter stats stats stats" "chart chart date date" "password password date date" "ips websites websites ..." "... websites websites ...";
    }

    .chart {
      padding: 0;
    }
  }
  @media only screen and (min-width: 1200px) {
    .main {
      display: grid;
      overflow-y: auto;
      grid-template-columns: auto;
      align-items: initial;
      justify-content: initial;
      gap: 10px;
      grid-template-rows: 1fr 1fr 1fr 1fr;
      grid-template-areas: "meter stats stats stats stats" "chart websites date date password" "... websites date date ips";
    }
  }
</style>
