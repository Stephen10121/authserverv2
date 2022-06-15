<!-- svelte-ignore missing-declaration -->
<script lang="ts">
  import Meter from "./Meter.svelte";
  let rotateLen: number = 1;
  let plus: boolean = false;
  let rotateLen2: number = 1;
  let plus2: boolean = false;
  let rotateLen3: number = 1;
  let plus3: boolean = false;
  let rotateLen4: number = 1;
  let plus4: boolean = false;
  let rotateLen5: number = 1;
  let plus5: boolean = false;
  setInterval(() => {
    rotateLen = plus ? rotateLen + 1 : rotateLen - 1;
    if (rotateLen === 0) {
      plus = true;
    }
    if (rotateLen === 100) {
      plus = false;
    }
  }, 50);
  setInterval(() => {
    rotateLen2 = plus2 ? rotateLen2 + 1 : rotateLen2 - 1;
    if (rotateLen2 === 0) {
      plus2 = true;
    }
    if (rotateLen2 === 100) {
      plus2 = false;
    }
  }, 60);
  setInterval(() => {
    rotateLen3 = plus3 ? rotateLen3 + 1 : rotateLen3 - 1;
    if (rotateLen3 === 0) {
      plus3 = true;
    }
    if (rotateLen3 === 100) {
      plus3 = false;
    }
  }, 70);
  setInterval(() => {
    rotateLen4 = plus4 ? rotateLen4 + 1 : rotateLen4 - 1;
    if (rotateLen4 === 0) {
      plus4 = true;
    }
    if (rotateLen4 === 100) {
      plus4 = false;
    }
  }, 80);
  setInterval(() => {
    rotateLen5 = plus5 ? rotateLen5 + 1 : rotateLen5 - 1;
    if (rotateLen5 === 0) {
      plus5 = true;
    }
    if (rotateLen5 === 100) {
      plus5 = false;
    }
  }, 90);
</script>

<main>
  <header>header</header>
  <section>
    <Meter rotate={rotateLen} backgroundColor="#dfdfdf" gaugeColor="#430498" />
    <Meter rotate={rotateLen2} backgroundColor="#dfdfdf" gaugeColor="#436573" />
    <Meter rotate={rotateLen3} backgroundColor="#dfdfdf" gaugeColor="#593787" />
    <Meter rotate={rotateLen4} backgroundColor="#dfdfdf" gaugeColor="#345898" />
    <Meter rotate={rotateLen5} backgroundColor="#dfdfdf" gaugeColor="#147290" />
    <button
      on:click={() => {
        rotateLen += 20;
      }}>More</button
    >
    <button
      on:click={() => {
        rotateLen -= 20;
      }}>Less</button
    >
  </section>
</main>

<style>
  main {
    display: grid;
    grid-template-rows: 70px auto;
    width: 100vw;
    height: 100vh;
  }

  header {
    width: 100vw;
    height: 100%;
    background-color: #f3f3f3;
  }

  section {
    width: 100vw;
    height: 100%;
    background-color: #dfdfdf;
  }
</style>
