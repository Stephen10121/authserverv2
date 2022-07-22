<script lang="ts">
  import Dashboard from "./components/Dashboard.svelte";
  import NotLogged from "./components/NotLogged.svelte";
  import { useSocket } from "./functions/useSocket";
  // const PROXY = window.location.href;
  const PROXY = "http://localhost:4000/";
  const socket = useSocket(PROXY);
  let loggedIn = false;
  let userData: any;
  socket.on("login", (data: any) => {
    console.log(data);
    userData = data;
    loggedIn = true;
  });
</script>

{#if loggedIn}
  <Dashboard {userData} {socket} />
{:else}
  <NotLogged {PROXY} {socket} />
{/if}
