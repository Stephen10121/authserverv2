<script lang="ts">
  import Website from "./Website.svelte";
  export let sites: any;
  export let socket: any;
  export let userData;
</script>

<div class="websites">
  {#each sites as site}
    <Website {userData} {socket} name={site.site} blackList={site.blackList} />
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
