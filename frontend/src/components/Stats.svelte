<script lang="ts">
  import StatCard from "./StatCard.svelte";
  export let logins: number;
  export let failed: number;
  export let mostPopular: string;
  export let subscriptions: number;
</script>

<div class="stats">
  <p>Statistics</p>
  <StatCard
    answer={logins}
    icon="./shield-lock.svg"
    title="Attempted Logins"
    iconBackground="rgba(79, 0, 153, 0.7)"
  />
  <StatCard
    answer={failed}
    icon="./shield-x.svg"
    title="Failed Attempts"
    iconBackground="rgba(0, 82, 195, 0.7)"
  />
  <StatCard
    answer={subscriptions}
    icon="./shield-check.svg"
    title="Subscriptions"
    iconBackground="rgba(195, 0, 40, 0.7)"
  />
  <StatCard
    answer={mostPopular}
    icon="./bar-chart-line.svg"
    title="Most Popular"
    iconBackground="rgba(116, 233, 36, 0.7)"
  />
</div>

<style>
  .stats {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
  }

  .stats p {
    position: absolute;
    top: 10px;
    left: 10px;
    font-family: "Roboto", sans-serif;
    font-size: 1rem;
    font-weight: bold;
    color: var(--main-color);
  }

  @media only screen and (max-width: 1200px) {
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
      justify-content: center;
      padding: 50px;
    }
  }

  @media only screen and (max-width: 800px) {
    .stats {
      padding: 30px 10px 10px 10px;
    }
  }

  @media only screen and (max-width: 700px) {
    .stats {
      grid-template-columns: 1fr;
    }
  }
</style>
