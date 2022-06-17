<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  let trueit: Boolean = false;
</script>

<div
  class="prompt"
  on:click={({ target }) => {
    // @ts-ignore
    if (target.classList.contains("prompt")) {
      dispatch("closeit", true);
    }
  }}
>
  <div class="yesNo">
    <p>Are you sure?</p>
    <button
      class="yes"
      on:click={() => {
        dispatch("answer", true);
      }}>Yes</button
    >
    <button
      class="no"
      on:click={() => {
        dispatch("closeit", true);
      }}>No</button
    >
  </div>
</div>

<style>
  .prompt {
    position: fixed;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.7);
    top: 0;
    left: 0;
    z-index: 100;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .yesNo {
    width: 200px;
    height: 100px;
    background-color: white;
    border-radius: 10px;
    padding: 20px 10px 10px 10px;
    cursor: default;
    display: flex;
    align-items: center;
    position: relative;
    justify-content: center;
    gap: 20px;
  }

  .yesNo p {
    position: absolute;
    top: 5px;
    left: 5px;
    font-family: "Poppins", sans-serif;
  }

  .yes {
    background-color: rgb(0, 170, 0);
  }

  .yes:hover {
    background-color: rgb(0, 133, 0);
  }

  .no {
    background-color: red;
  }

  .no:hover {
    background-color: rgb(177, 2, 2);
  }

  .yesNo button {
    padding: 10px 20px;
    border: none;
    cursor: pointer;
    border-radius: 5px;
    font-family: "Roboto", sans-serif;
    font-size: 1.25rem;
    transition: background-color 0.15s linear;
  }
</style>
