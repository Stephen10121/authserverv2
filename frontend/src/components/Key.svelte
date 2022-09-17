<script>
  import Prompt from "./Prompt.svelte";

  export let name;
  export let id;
  let deleteIt = false;
</script>

{#if deleteIt}
  <Prompt
    on:closeit={() => {
      deleteIt = false;
    }}
    on:answer={({ detail }) => {
      if (detail) {
        console.log(`delete ${name}. id: ${id}`);
        deleteIt = false;
      }
    }}
  />
{/if}
<div class="website">
  <img class="web-img" src="./key.svg" alt="Key" />
  <p class="name">{name ? name : "N/A"}</p>
  <button
    name="delete"
    title="Delete"
    on:click={() => {
      deleteIt = true;
    }}><img src="./trash3.svg" alt="Delete" /></button
  >
</div>

<style>
  .website {
    width: 100%;
    height: 40px;
    display: grid;
    align-items: center;
    grid-template-columns: 40px auto 40px;
    background-color: rgb(119, 166, 194);
    border-radius: 5px;
    padding: 5px;
  }

  .website .web-img {
    width: 60%;
    user-drag: none;
    -webkit-user-drag: none;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
  }

  .name {
    font-family: "Poppins", sans-serif;
    font-size: 1rem;
  }

  .website button {
    width: 60%;
    cursor: pointer;
    background: none;
    border: none;
  }

  .website button:hover img,
  .blackList button:hover img {
    filter: invert(50%);
  }

  .blackList button img,
  .website button img {
    user-drag: none;
    -webkit-user-drag: none;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
    width: 100%;
  }
</style>
