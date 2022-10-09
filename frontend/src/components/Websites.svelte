<script lang="ts">
  import Website from "./Website.svelte";
  export let sites: any;
  export let socket: any;
  export let userData: any;
</script>

<div class="websites">
  {#if sites.length === 1}
    <div class="empty">No 3rd party websites.</div>
  {/if}
  {#each sites as site}
    {#if !site.site.includes(window.location.origin)}
      <Website
        {userData}
        {socket}
        name={site.site}
        blackList={site.blackList}
        on:error
        on:success
      />
    {/if}
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

  .empty {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgb(119, 166, 194);
    border-radius: 5px;
    padding: 5px;
    font-family: "Poppins", sans-serif;
    font-size: 0.55rem;
  }

  @media only screen and (min-width: 1100px) {
    .empty {
      font-size: 1rem;
    }
  }
</style>
