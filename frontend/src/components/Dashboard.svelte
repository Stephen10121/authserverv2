<!-- svelte-ignore missing-declaration -->
<script lang="ts">
  import LineChart from "./LineChart.svelte";
  import Meter from "./Meter.svelte";
  import Stats from "./Stats.svelte";
  let secureSubs: number = 5;
  let logins: number = 100;
  let failed: number = 20;
  let popular: string = "drive.gruzservices.com";
  let subscriptions: number = 5;
</script>

<main>
  <header
    >header
    <label for="l1">Most Popular</label>
    <input type="text" bind:value={popular} id="l1" />
    <label for="l1">Secure Percentage</label>
    <input type="number" name="number" id="l2" bind:value={secureSubs} />
    <label for="l3">Login Attempts</label>
    <input type="number" name="number2" id="l3" bind:value={logins} />
    <label for="l4">Failed Attempts</label>
    <input type="number" name="number3" id="l4" bind:value={failed} />
    <label for="l5">Subs</label>
    <input type="number" name="number4" id="l5" bind:value={subscriptions} />
  </header>
  <section class="main">
    <section class="meterPart tile">
      <p class="meter-title">Secure Subscriptions</p>
      <div class="extraInfo">
        <p>?</p>
        <div class="show">
          Percentage of websites your subscribed to that encrypt their data.
        </div>
      </div>
      <Meter
        max={subscriptions}
        rotate={secureSubs}
        backgroundColor="#dfdfdf"
        gaugeColor="#430498"
      />
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
      <LineChart />
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
    background-color: #f3f3f3;
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
    height: 200px;
  }

  .main {
    width: 100vw;
    height: 100%;
    background-color: #dfdfdf;
    padding: 20px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-template-rows: 200px 200px 200px;
    gap: 20px;
    grid-template-areas: "meter stats stats stats" "chart chart ... ...";
    overflow-x: hidden;
  }

  .tile {
    background-color: #dfdfdf;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    position: relative;
    box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
    flex-direction: column;
  }

  .meter-title {
    position: absolute;
    top: 10px;
    left: 10px;
    font-family: "Roboto", sans-serif;
    font-size: 1rem;
    font-weight: bold;
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
      grid-template-areas: "meter stats stats stats" "meter stats stats stats" "chart chart ... ...";
    }
  }
  @media only screen and (max-width: 550px) {
    .main {
      grid-template-columns: 1fr;
      grid-template-areas: "meter" "stats" "chart";
      grid-template-rows: auto;
    }

    .meterPart {
      padding-top: 10px;
    }
  }
</style>
