<script lang="ts">
  import Device from "./Device.svelte";
</script>

<div class="connectedDevices">
  <p>Connected Devices (Fake)</p>
  <Device name="desktop5" ip="10.80.3.3" />
  <Device name="desktop3" ip="10.80.3.4" />
  <Device name="stephens-phone" ip="10.80.3.5" />
  <Device name="stephens-phone2" ip="10.80.3.6" />
</div>

<style>
  .connectedDevices {
    width: 100%;
    height: 100%;
    position: relative;
    padding: 40px 10px 10px 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    overflow-y: auto;
  }

  .connectedDevices p {
    position: absolute;
    top: 10px;
    left: 10px;
    font-family: "Roboto", sans-serif;
    font-size: 1rem;
    font-weight: bold;
    color: var(--main-color);
  }
</style>
