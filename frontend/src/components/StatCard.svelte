<script lang="ts">
  export let answer: number | string;
  export let icon: string;
  export let title: string;
  export let iconBackground: string;
</script>

<div class="card">
  <div
    style="background-color:{iconBackground
      ? iconBackground
      : 'rgba(79, 0, 153, 0.7)'};"
    ><img src={icon ? icon : null} alt="Icon" /></div
  >
  <h2>{title ? title : "N/A"}</h2>
  <p>{answer ? answer : "N/A"}</p>
</div>

<style>
  .card div {
    grid-area: img;
    width: 100%;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    aspect-ratio: 1;
  }

  .card div img {
    width: 100%;
  }

  .card h2 {
    grid-area: title;
    font-family: "Roboto", sans-serif;
    font-size: 0.75rem;
  }

  .card p {
    grid-area: res;
    font-family: "Poppins", sans-serif;
    font-size: 0.75rem;
  }

  .card {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    grid-template-areas: "img title title" "img res res";
    width: 170px;
    padding: 10px;
    gap: 10px;
    /* border-radius: 10px;
    background-color: rgba(0, 0, 0, 0.5); */
  }
</style>
