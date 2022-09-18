<script>
  import Add2fa from "./Add2fa.svelte";
  let showAdd = false;
</script>

{#if showAdd}
  <Add2fa
    on:cancel={() => {
      showAdd = false;
    }}
    on:success
  />
{/if}
<button
  class="enable"
  on:click={() => {
    showAdd = true;
  }}>Add 2fa method</button
>

<style>
  .enable {
    width: 100%;
    height: 40px;
    cursor: pointer;
    border-radius: 5px;
    background-color: rgb(119, 166, 194);
    font-family: "Poppins", sans-serif;
    border: none !important;
    padding: 5px;
    font-size: 1rem;
  }

  .enable:hover {
    background-color: rgb(101, 144, 168);
  }
</style>
