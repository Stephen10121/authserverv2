<script>
  export let promptPlaceholder;
  export let promptEvent;
  export let promptExtra;

  const divClick = (e) => {
    if (e.target.id === "coverPrompt") {
      promptEvent(false, promptExtra);
    }
  };
</script>

<div class="prompt" id="coverPrompt" on:click={divClick}>
  <div class="prompt-color">
    <form on:submit|preventDefault={(e) => promptEvent(e, promptExtra)}>
      <!-- svelte-ignore a11y-autofocus -->
      <input type="text" placeholder={promptPlaceholder} autofocus />
      <button type="submit">Submit</button>
    </form>
    <button class="close" on:click={() => promptEvent(false, promptExtra)}>
      &#10006;
    </button>
  </div>
</div>

<style>
  .prompt {
    position: fixed;
    width: 100vw;
    height: 100vh;
    padding: 0;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 201;
    left: 0;
    top: 0;
  }

  .prompt-color {
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    width: 60%;
    height: 60px;
    display: grid;
    grid-template-columns: auto 60px;
    border-radius: 10px;
  }

  form {
    background-color: white;
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
    padding: 10px;
    display: grid;
    grid-template-columns: 5fr 2fr;
    gap: 10px;
  }
  input {
    width: 100%;
    height: 100%;
    border: 1px solid black;
    border-radius: 5px;
    padding-left: 5px;
    font-family: "Poppins", sans-serif;
  }

  form button {
    cursor: pointer;
    border: none;
    background-color: rgb(22, 207, 22);
    font-family: "Roboto", sans-serif;
    border-radius: 5px;
    transition: background-color 0.25s linear;
    font-size: 1rem;
  }

  form button:hover {
    background-color: rgb(0, 255, 0);
  }

  .close {
    width: 60px;
    height: 60px;
    border: none;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
    font-size: 1rem;
    cursor: pointer;
    background-color: rgb(245, 184, 184);
    transition: background-color 0.25s linear;
  }

  .close:hover {
    background-color: rgb(255, 129, 129);
  }
</style>
