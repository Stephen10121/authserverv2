<script lang="ts">
  //import Device from "./Device.svelte";
  import Add2fa from "./Add2fa.svelte";
  import Key from "./Key.svelte";
  export let tfa: string;
  export let tfaKeys: any;
  let tfa2 = tfa === "1" ? true : (false as boolean);
  let showAdd = false;
</script>

<div class="twofactor">
  <div class="extraInfo">
    <p>?</p>
    <div class="show">
      Add a second layer of protection with biometrics or security key.
    </div>
  </div>
  <p class="title">2 factor authentication</p>
  {#if !tfa2}
    <button
      class="enable"
      on:click={() => {
        showAdd = true;
      }}>Enable 2fa</button
    >
  {:else}
    {#each tfaKeys as key}
      <Key name={key.name} id={key.id} />
    {/each}
    <button
      class="enable"
      on:click={() => {
        showAdd = true;
      }}>Add another method</button
    >
  {/if}
  {#if showAdd}
    <Add2fa
      on:cancel={() => {
        showAdd = false;
      }}
    />
  {/if}
</div>

<style>
  .twofactor {
    width: 100%;
    height: 100%;
    position: relative;
    padding: 40px 10px 10px 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 5px;
    overflow-y: auto;
  }

  .title {
    position: absolute;
    top: 10px;
    left: 10px;
    font-family: "Roboto", sans-serif;
    font-size: 1rem;
    font-weight: bold;
    color: var(--main-color);
  }

  .enable {
    width: 100%;
    height: 40px;
    cursor: pointer;
    border-radius: 5px;
    background-color: rgb(119, 166, 194);
    font-family: "Poppins", sans-serif;
    border: none !important;
    font-size: 1rem;
  }

  .enable:hover {
    background-color: rgb(101, 144, 168);
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
</style>
