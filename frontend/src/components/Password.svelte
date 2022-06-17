<script lang="ts">
  import Prompt from "./Prompt.svelte";
  let showPrompt: boolean = false;
  let deleteAccount: boolean = false;
</script>

<div class="password">
  <p>Danger Zone</p>
  <button>Change Password</button>
  <button
    on:click={() => {
      showPrompt = true;
    }}>Delete Account</button
  >
  {#if showPrompt}
    <Prompt
      on:closeit={() => {
        showPrompt = false;
      }}
      on:answer={() => {
        deleteAccount = true;
        showPrompt = false;
      }}
    />
  {/if}
</div>

<style>
  .password {
    width: 100%;
    height: 100%;
    border-radius: 10px;
    border: 2px solid rgb(167, 0, 0);
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    padding: 40px 10px 10px 10px;
    position: relative;
    gap: 5px;
  }

  .password p {
    position: absolute;
    top: 10px;
    left: 10px;
    font-family: "Roboto", sans-serif;
    font-size: 1rem;
    font-weight: bold;
    color: rgb(167, 0, 0);
  }

  .password button {
    background-color: rgb(204, 0, 0);
    border: 2px solid rgb(255, 0, 0);
    border-radius: 5px;
    padding: 10px;
    font-family: "Poppins", sans-serif;
    cursor: pointer;
    transition: background-color 0.15s linear;
  }

  .password button:hover {
    background-color: red;
  }
</style>
