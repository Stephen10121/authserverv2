<script lang="ts">
  import Website from "./Website.svelte";
  let blackList1: boolean = true;
  let blackList2: boolean = false;
</script>

<div class="websites">
  <Website
    name="youtube.com"
    blackListed={blackList1}
    on:blacklist={() => {
      blackList1 = true;
    }}
    on:un-blacklist={() => {
      blackList1 = false;
    }}
  />
  <Website
    name="gruzservices.com"
    blackListed={blackList2}
    on:blacklist={() => {
      blackList2 = true;
    }}
    on:un-blacklist={() => {
      blackList2 = false;
    }}
  />
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
