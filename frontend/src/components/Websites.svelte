<script lang="ts">
  import Website from "./Website.svelte";
  export let sites;
  let blackList1: boolean = true;
</script>

<div class="websites">
  {#each sites as site}
    <Website
      name={site}
      blackListed={blackList1}
      on:blacklist={() => {
        blackList1 = true;
      }}
      on:un-blacklist={() => {
        blackList1 = false;
      }}
    />
  {/each}
</div>

<style>
  .websites {
    width: 100%;
    height: 100%;
    padding: 10px;
    display: flex;
    gap: 10px;
    flex-direction: column;
    overflow-y: auto;
  }
</style>
