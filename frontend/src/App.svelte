<script lang="ts">
  import Dashboard from "./components/Dashboard.svelte";
  import NotLogged from "./components/NotLogged.svelte";
  import { useSocket } from "./functions/useSocket";
  const PROXY = window.location.href;
  // const PROXY = "http://localhost:4000/";
  const socket = useSocket(PROXY);
  let loggedIn = false;
  let userData: any;
  socket.on("login", (data: any) => {
    console.log(data);
    userData = data;
    loggedIn = true;
  });

  const changeName = ({ detail }) => {
    userData.userData.name = detail;
  };
</script>

{#if loggedIn}
  <Dashboard {userData} {socket} on:nameChange={changeName} />
{:else}
  <NotLogged {PROXY} {socket} />
{/if}
