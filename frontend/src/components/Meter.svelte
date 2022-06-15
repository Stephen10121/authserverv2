<script lang="ts">
  import { map_range } from "../functions/map";
  export let rotate: number;
  export let backgroundColor: string;
  export let gaugeColor: string;
  let rotate2 = map_range(rotate, 0, 100, 0, 360);
  $: {
    rotate2 = map_range(rotate, 0, 100, 0, 180);
  }
</script>

<!-- svelte-ignore missing-declaration -->
<div
  style="--theme-color-background: {backgroundColor};--theme-color: {gaugeColor}"
  class="gauge--1"
>
  <div class="mask">
    <div class="semi-circle"><p>{rotate}%</p></div>
    <div
      class="semi-circle--mask"
      style="transform: rotate({rotate2}deg) translate3d(0, 0, 0);"
    />
  </div>
</div>

<style>
  .mask {
    position: relative;
    overflow: hidden;
    display: block;
    width: 12.5rem;
    height: 6.25rem;
    margin: 1.25rem;
  }
  .semi-circle {
    position: relative;
    display: block;
    width: 12.5rem;
    height: 6.25rem;
    background: linear-gradient(
      to right,
      #c0392b 0%,
      #f1c40f 50%,
      #1abc9c 100%
    );
    border-radius: 50% 50% 50% 50% / 100% 100% 0% 0%;
  }
  .semi-circle p {
    position: absolute;
    top: 80%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 100;
    font-family: Verdana, Geneva, Tahoma, sans-serif;
    font-weight: bold;
    font-stretch: expanded;
  }

  .semi-circle::before {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%;
    z-index: 2;
    display: block;
    width: 8.75rem;
    height: 4.375rem;
    margin-left: -4.375rem;
    background: var(--theme-color-background);
    border-radius: 50% 50% 50% 50% / 100% 100% 0% 0%;
  }
  .semi-circle--mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 12.5rem;
    height: 12.5rem;
    background: transparent;
    transform-origin: center center;
    backface-visibility: hidden;
    transition: all 0.13s ease-in-out;
  }
  .semi-circle--mask::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0%;
    z-index: 2;
    display: block;
    width: 12.625rem;
    height: 6.375rem;
    margin: -1px 0 0 -1px;
    background: #f2f2f2;
    border-radius: 50% 50% 50% 50% / 100% 100% 0% 0%;
  }
  .gauge--1 .semi-circle {
    /* background: red; */
    background: var(--theme-color);
    /* background: #1abc9c; */
  }
</style>
