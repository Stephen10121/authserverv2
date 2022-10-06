<script lang="ts">
  export let currentName: string;

  const changeName = () => {
    console.log("changing name");
  };
</script>

<div class="name">
  <p>Current Name: <span class="bold">{currentName}</span></p>
  <button on:click={changeName}>Change Name</button>
</div>
