<script lang="ts">
  import Dashboard from "./components/Dashboard.svelte";
  import NotLogged from "./components/NotLogged.svelte";
  const PROXY = "http://localhost:4000/";
</script>

<!-- <Dashboard /> -->
<NotLogged {PROXY} />
