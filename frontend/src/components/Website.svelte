<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  export let name: string;
  export let socket: any;
  export let userData: any;
  export let blackList: any;
  let blackListed: boolean;
  if (blackList === "false") {
    blackListed = false;
  } else {
    blackListed = true;
  }
  try {
    new URL(name);
  } catch (err) {
    name = "https://www.google.com";
  }
  let url = new URL(name);

  socket.on("blacklist", (data: any) => {
    if (!data.success) {
      blackListed = data.blacklist;
      dispatch(
        "error",
        `Unable to ${data.blacklist ? "blacklist" : "unblacklist"} website.`
      );
      return;
    }
    dispatch(
      "success",
      `Successfully ${
        data.blacklist ? "blacklisted" : "unblacklisted"
      } website.`
    );
  });
</script>

<div class={blackListed ? "blackList" : "website"}>
  {#if blackListed}
    <p class="blacklist-p">BlackListed</p>
  {/if}
  <img class="web-img" src="./window.svg" alt="Website" />
  <a href={url.origin} target="_blank" class="name"
    >{name ? url.origin : "N/A"}</a
  >
  {#if blackListed}
    <button
      on:click={() => {
        blackListed = false;
        socket.emit("blacklist", {
          name,
          key: userData.data,
          blackList: false,
        });
      }}
      name="Un-Blacklist"
      title="Un-Blacklist"
    >
      <img src="./shield-check.svg" alt="Un-Blacklist" />
    </button>
  {:else}
    <button
      on:click={() => {
        blackListed = true;
        socket.emit("blacklist", { name, key: userData.data, blackList: true });
      }}
      name="Blacklist"
      title="Blacklist"><img src="./shield-x.svg" alt="Blacklist" /></button
    >
  {/if}
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

  .blackList {
    width: 100%;
    height: 40px;
    display: grid;
    align-items: center;
    grid-template-columns: 40px auto 40px;
    background-color: rgb(119, 166, 194);
    border-radius: 5px;
    padding: 3px;
    position: relative;
    border: 2px solid red;
  }

  .blacklist-p {
    position: absolute;
    color: red;
    font-size: 1rem;
    font-family: "Roboto", sans-serif;
    font-weight: bold;
    right: 50px;
    top: 50%;
    transform: translateY(-50%);
  }

  .blackList .web-img,
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
    font-size: 0.55rem;
    text-decoration: underline;
    color: black;
  }

  .blackList button,
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
    width: 100%;
    user-drag: none;
    -webkit-user-drag: none;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
  }
  @media only screen and (min-width: 1100px) {
    .name {
      font-size: 1rem;
    }
  }
</style>
