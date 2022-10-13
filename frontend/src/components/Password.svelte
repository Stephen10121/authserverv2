<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Prompt from "./Prompt.svelte";
  export let tfaTrue: boolean;
  const dispatch = createEventDispatcher();
  let showPrompt: boolean = false;
  let deleteAccount: boolean = false;
</script>

<div class="password">
  <p class="title">Danger Zone</p>
  <button
    on:click={() => {
      dispatch("change-password", true);
    }}>Change Password</button
  >
  <button
    on:click={() => {
      showPrompt = true;
    }}>Delete Account</button
  >
  <div class="tfa">
    <p>Allow 2fa</p>
    <input
      checked={tfaTrue}
      type="checkbox"
      name="Allow 2fa checkbox"
      on:change={({ target }) => {
        dispatch("changeTfa", target["checked"]);
      }}
      class="checkbox"
    />
  </div>
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
    flex-direction: column;
    padding: 40px 10px 10px 10px;
    position: relative;
    gap: 5px;
  }

  .title {
    position: absolute;
    top: 10px;
    left: 10px;
    font-family: "Roboto", sans-serif;
    font-size: 1rem;
    font-weight: bold;
    color: rgb(167, 0, 0);
  }

  .tfa {
    background-color: rgb(204, 0, 0);
    border: 2px solid rgb(255, 0, 0);
    border-radius: 5px;
    padding: 10px;
    font-family: "Poppins", sans-serif;
    transition: background-color 0.15s linear;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .tfa p {
    font-size: 0.7rem;
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

  :root {
    --checkbox-timing: 0.25s;
  }

  .checkbox::before {
    content: "";
    position: absolute;
    width: 60px;
    height: 30px;
    border-radius: 100vw;
    animation-fill-mode: forwards;
    animation: boxUnChecked2 var(--checkbox-timing) forwards;
  }

  .checkbox {
    position: relative;
    width: 60px;
    height: 30px;
    cursor: pointer;
    border-radius: 100vw;
  }

  .checkbox:checked.checkbox::after {
    animation: boxChecked var(--checkbox-timing) forwards;
  }

  .checkbox:checked.checkbox::before {
    animation: boxChecked2 var(--checkbox-timing) forwards;
  }

  .checkbox::after {
    content: "";
    position: absolute;
    width: 26px;
    height: 26px;
    border-radius: 100vw;
    background-color: white;
    animation-fill-mode: forwards;
    animation: boxUnChecked var(--checkbox-timing) forwards;
    top: 2px;
    left: 2px;
    box-shadow: rgba(0, 0, 0, 0.25) 0px 54px 55px,
      rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px,
      rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px;
  }

  @keyframes boxChecked {
    from {
      top: 2px;
    }
    to {
      left: 32px;
    }
  }

  @keyframes boxChecked2 {
    from {
      background-color: gray;
    }
    to {
      background-color: rgb(2, 245, 2);
    }
  }

  @keyframes boxUnChecked {
    from {
      top: 2px;
      left: 32px;
    }
    to {
      left: 2px;
    }
  }

  @keyframes boxUnChecked2 {
    from {
      background-color: rgb(2, 245, 2);
    }
    to {
      background-color: gray;
    }
  }

  @media only screen and (min-width: 700px) {
    .password {
      flex-direction: row;
    }
  }
</style>
