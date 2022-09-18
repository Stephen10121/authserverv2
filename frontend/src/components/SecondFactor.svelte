<script>
  import Prompt from "./Prompt.svelte";
  import Key from "./Key.svelte";
  import AddKey from "./AddKey.svelte";
  import { identity } from "svelte/internal";
  export let tfa;
  export let tfaKeys2;
  let tfaKeys = tfaKeys2;
  let deleteIt = false;
</script>

{#if deleteIt}
  <Prompt
    on:closeit={() => {
      deleteIt = false;
    }}
    on:answer={async ({ detail }) => {
      if (detail) {
        const verificationResp = await fetch("/deleteKey", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: deleteIt.id,
            name: deleteIt.name,
          }),
        });

        // Wait for the results of verification
        const verificationJSON = await verificationResp.json();
        if (verificationJSON["error"] === false) {
          let newKeys = [];
          for (let i = 0; i < tfaKeys.length; i++) {
            if (tfaKeys[i].id !== deleteIt.id) {
              newKeys.push(tfaKeys[i]);
            }
          }
          tfaKeys = newKeys;
        }
        deleteIt = false;
      }
    }}
  />
{/if}
<div class="twofactor">
  <div class="extraInfo">
    <p>?</p>
    <div class="show">
      Add a second layer of protection with biometrics or security key.
    </div>
  </div>
  <p class="title">2 factor authentication</p>
  {#each tfaKeys as key}
    <Key
      name={key.name}
      id={key.id}
      on:delete={({ detail }) => {
        deleteIt = detail;
      }}
    />
  {/each}
  <AddKey
    on:success={async () => {
      const resp = await fetch(`/getKeys`);
      try {
        let respJSON = await resp.json();
        console.log(respJSON);
        if (respJSON["keys"]) {
          tfaKeys = respJSON.keys;
        }
      } catch (error) {
        console.log(error);
      }
    }}
  />
  {#if !tfa}
    <div class="blackout">
      <h1>Disabled</h1>
    </div>
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

  .blackout {
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.25);
    position: absolute;
    border-radius: 5px;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .blackout h1 {
    color: red;
    text-transform: uppercase;
    font-family: sans-serif;
    display: inline-block;
    border: 2px solid red;
    padding: 5px;
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
