<script lang="ts">
  let yourDate = new Date();
  let date = yourDate.toISOString().split("T")[0].split("-");
  const months = {
    "01": "Jan",
    "02": "Feb",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "Aug",
    "09": "Sep",
    "10": "Oct",
    "11": "Nov",
    "12": "Dec",
  };
</script>

<div class="date-part">
  <p class="mon">{months[date[1]]} {date[0]}</p>
  <p class="day">{date[2]}</p>
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
