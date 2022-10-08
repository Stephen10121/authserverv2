<script>
  import { createEventDispatcher } from "svelte";
  export let type;

  const dispatch = createEventDispatcher();
  const handleClose = () => {
    dispatch("close", false);
  };
</script>

<div class="notification-toast {type}">
  <div class="notification-toast-inner">
    <p><slot /></p>
    <button on:click={handleClose}>&#10006;</button>
  </div>
</div>

<style>
  .notification-toast {
    position: fixed;
    bottom: 10px;
    right: 10px;
    background-color: rgb(0, 132, 255);
    border-radius: 5px;
    z-index: 200;
  }

  .notification-toast-inner {
    background-color: #dfdfdf;
    padding: 15px 20px;
    position: relative;
    border-radius: 5px;
    margin-left: 7px;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
  }

  .notification-toast-inner p {
    font-family: "Poppins", sans-serif;
    font-size: 1rem;
    margin-right: 10px;
  }

  .notification-toast-inner button {
    position: absolute;
    top: 0px;
    right: 5px;
    cursor: pointer;
    border: none;
    background: none;
    color: black;
    transition: color 0.25s linear;
    font-size: 1rem;
  }

  .notification-toast-inner button:hover {
    color: gray;
  }

  .alert {
    background-color: red;
  }

  .success {
    background-color: rgb(0, 255, 0);
  }
</style>
