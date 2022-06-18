<script lang="ts">
  export let ip: string;
  export let name: string;
</script>

<div class="device">
  <img src="./phone.svg" alt="Device" />
  <p>{name ? name : "desktop"}@{ip ? ip : "192.168.0.85"}</p>
</div>

<style>
  .device {
    width: 100%;
    height: 40px;
    background-color: rgb(119, 166, 194);
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: start;
    gap: 20px;
    padding: 10px;
  }

  .device img {
    height: 100%;
  }

  .device p {
    font-size: 1rem;
    font-family: "Poppins", sans-serif;
  }
</style>
