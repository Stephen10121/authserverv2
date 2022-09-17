<script lang="ts">
  import { Temporal } from "@js-temporal/polyfill";
  let newDate = Temporal.Now.zonedDateTimeISO();
  const months = {
    1: "Jan",
    2: "Feb",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "Aug",
    9: "Sep",
    10: "Oct",
    11: "Nov",
    12: "Dec",
  };
</script>

<div class="date-part">
  <p class="mon">{months[newDate.month]} {newDate.year}</p>
  <p class="day">{newDate.day}</p>
</div>

<style>
  .date-part {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    flex-direction: column;
  }

  .day {
    font-family: "Roboto", sans-serif;
    font-size: 10rem;
    color: var(--main-color);
  }

  .mon {
    font-family: "Poppins", sans-serif;
    font-size: 3rem;
    color: var(--main-color);
  }
</style>
