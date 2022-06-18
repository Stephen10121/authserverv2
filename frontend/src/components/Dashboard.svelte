<!-- svelte-ignore missing-declaration -->
<script lang="ts">
  import ConnectedDevices from "./ConnectedDevices.svelte";
  import Date from "./Date.svelte";
  import LineChart from "./LineChart.svelte";
  import Meter from "./Meter.svelte";
  import Password from "./Password.svelte";
  import Stats from "./Stats.svelte";
  import { toggle, toggleStartup } from "../functions/toggleTheme";
  import Websites from "./Websites.svelte";
  let secureSubs: number = 4;
  let logins: number = 100;
  let failed: number = 20;
  let popular: string = "drive.gruzservices.com";
  let subscriptions: number = 10;
  toggleStartup();
</script>

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
      <Stats
        mostPopular={popular}
        failedAttempts={failed}
        {logins}
        {subscriptions}
      />
    </section>
    <section class="chart tile">
      <h1>Hi Stephen</h1>
    </section>
    <section class="tile websites">
      <Websites />
    </section>
    <section class="date tile">
      <Date />
    </section>
    <section class="password tile">
      <Password />
    </section>
    <section class="ips tile">
      <ConnectedDevices />
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
    justify-content: space-between;
    padding: 10px;
  }

  header h1 {
    font-family: "Poppins", sans-serif;
    font-weight: bold;
    color: var(--header-color);
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
  }

  .stats {
    grid-area: stats;
  }

  .chart {
    grid-area: chart;
  }

  .chart h1 {
    font-family: "Roboto", sans-serif;
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--main-color);
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
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr 1fr;
    gap: 20px;
    grid-template-areas: "meter stats stats stats" "chart websites date password" "... websites date ips";
    overflow-x: hidden;
    overflow-y: auto;
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

  @media only screen and (max-width: 1200px) {
    .main {
      grid-template-rows: 200px 200px 200px 200px;
      grid-template-areas: "meter stats stats stats" "meter stats stats stats" "chart websites date password" "... websites date ips";
    }
  }

  @media only screen and (max-width: 1100px) {
    .main {
      overflow-y: auto;
      grid-template-rows: 200px 200px 200px 200px 200px 200px;
      grid-template-areas: "meter stats stats stats" "meter stats stats stats" "chart chart date date" "password password date date" "ips websites websites ..." "... websites websites ...";
    }
  }

  @media only screen and (max-width: 700px) {
    .main {
      overflow-y: auto;
      grid-template-rows: 200px 200px 200px 200px 200px 200px;
      grid-template-areas: "meter stats stats stats" "meter stats stats stats" "chart chart date date" "password password date date" "ips websites websites ..." "... websites websites ...";
    }
  }

  @media only screen and (max-width: 550px) {
    header {
      justify-content: center;
    }

    header h1 {
      display: none;
    }

    .main {
      overflow-y: auto;
      grid-template-columns: 1fr;
      grid-template-areas: "meter" "stats" "chart" "date" "password" "ips" "websites";
      grid-template-rows: auto;
    }

    .meterPart {
      padding-top: 10px;
    }
  }
</style>
