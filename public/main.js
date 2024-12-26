const API_URL = "http://localhost:3000/feed";
let eatingTime = null;

function getTimeInCorrectFormat(utcTimestamp) {
  const tallinnTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Tallinn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcTimestamp));

  const formattedTime = `${tallinnTime.find((p) => p.type === "hour").value}:${
    tallinnTime.find((p) => p.type === "minute").value
  }:${tallinnTime.find((p) => p.type === "second").value} ${
    tallinnTime.find((p) => p.type === "day").value
  }.${tallinnTime.find((p) => p.type === "month").value}.${
    tallinnTime.find((p) => p.type === "year").value
  }`;

  return formattedTime;
}

function fetchEatingTime() {
  fetch(API_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json(); // Parse JSON response
    })
    .then((data) => {
      // Update the DOM with the fetched data
      const messageDiv = document.getElementById("eatingTime");
      // set global eating time var
      eatingTime = data.time;
      const time = getTimeInCorrectFormat(data.time);
      messageDiv.textContent = time;
    })
    .catch((error) => {
      // Handle errors
      console.error("Fetch error:", error);
      const messageDiv = document.getElementById("eatingTime");
      messageDiv.textContent = "Failed to load data.";
    });
}

function setEatingTime() {
  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(() => {
      fetchEatingTime();
    })
    .catch((error) => {
      // Handle errors
      console.error("Fetch error:", error);
      const messageDiv = document.getElementById("time");
      messageDiv.textContent = "Failed to load data.";
    });
}

function calculateHungerEmoji(timeWithoutFood) {
  const withoutFoodInSeconds = Math.floor(timeWithoutFood / 1000);

  if (withoutFoodInSeconds < 7200) {
    return "😻";
  }

  if (withoutFoodInSeconds < 14400) {
    return "🙀";
  }

  return "😾";
}

function calculateTimeWithoutFood() {
  const now = new Date();
  const timeLastAte = new Date(eatingTime);
  const timeWithoutFood = now - timeLastAte;

  // Calculate the difference in hours, minutes, and seconds
  const hours = Math.floor(timeWithoutFood / (1000 * 60 * 60));
  const minutes = Math.floor(
    (timeWithoutFood % (1000 * 60 * 60)) / (1000 * 60)
  );
  const seconds = Math.floor((timeWithoutFood % (1000 * 60)) / 1000);

  const hungerEmoji = calculateHungerEmoji(timeWithoutFood);

  // Format the result as "X hours Y minutes Z seconds"
  const timeRange = `${hours} hours ${minutes} minutes ${seconds} seconds ${hungerEmoji}`;
  const timeWithoutFoodElem = document.getElementById("timeWithoutFood");
  timeWithoutFoodElem.textContent = timeRange;
}

fetchEatingTime();

setInterval(() => {
  calculateTimeWithoutFood();
}, 1000);
