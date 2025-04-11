// Loads Google Maps API and executes callback once available
function loadGoogleMapsAPI(callback) {
  if (typeof google !== "undefined") {
    callback();
  } else {
    const checkGoogleMaps = setInterval(() => {
      if (typeof google !== "undefined") {
        clearInterval(checkGoogleMaps);
        callback();
      }
    }, 100);
  }
}

// Initializes Google Places autocomplete for the city input
function initPlaceSearch() {
  const input = document.getElementById("placeSearch");
  const autocomplete = new google.maps.places.Autocomplete(input, {
    types: ["(cities)"],
    fields: ["geometry", "name"],
  });

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) {
      alert("No details available for the selected place.");
      return;
    }
  });
}

// Fetches attractions for the selected city from a PHP backend
async function fetchAttractions(city) {
  try {
    const response = await fetch(
      `libs/php/places.php?city=${encodeURIComponent(city)}`
    );
    const data = await response.json();

    if (!data.success) {
      console.error("API Error:", data.error);
      throw new Error(data.error || "Unexpected response format");
    }

    return data.data.map((place) => ({
      name: place.name,
      description: place.description,
      image: place.image,
    }));
  } catch (error) {
    console.error("Error fetching attractions:", error);
    return [];
  }
}

// Generates an itinerary by distributing attractions across days based on the pace
function generateItinerary(city, days, pace) {
  return fetchAttractions(city).then((attractions) => {
    attractions.sort(() => Math.random() - 0.5);
    const paceMultiplier = pace === "relaxed" ? 1 : pace === "moderate" ? 2 : 3;
    const attractionsPerDay = Math.min(
      Math.ceil(attractions.length / days / paceMultiplier),
      5
    );

    const itinerary = [];
    for (let i = 0; i < days; i++) {
      itinerary.push({
        day: i + 1,
        activities: attractions.slice(
          i * attractionsPerDay,
          (i + 1) * attractionsPerDay
        ),
      });
    }
    return itinerary;
  });
}

// Displays the generated itinerary in the HTML container
function displayItinerary(itinerary) {
  const itineraryContainer = document.getElementById("itineraryDays");
  itineraryContainer.innerHTML = "";

  itinerary.forEach((day) => {
    document.getElementById("trip").textContent = "Your Trip";
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("itinerary-day");
    dayDiv.innerHTML = `<h4>Day ${day.day}</h4>`;

    day.activities.forEach((activity) => {
      const activityDiv = document.createElement("div");
      activityDiv.classList.add("activity");
      activityDiv.innerHTML = `
          <strong>${activity.name}</strong>
          <p>${activity.description}</p>
          ${
            activity.image
              ? `<img src="${activity.image}" alt="${activity.name}" style="width:100%;max-width:300px;">`
              : ""
          }
        `;
      dayDiv.appendChild(activityDiv);
    });

    itineraryContainer.appendChild(dayDiv);
  });
}

// Handles form submission to generate and display the itinerary
document.getElementById("trip-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const city = document.getElementById("placeSearch").value;
  const days = parseInt(document.getElementById("days").value, 10);
  const pace = document.getElementById("pace").value;

  if (!city || !days) {
    alert("Please fill in all the fields.");
    return;
  }

  generateItinerary(city, days, pace).then((itinerary) => {
    displayItinerary(itinerary);
  });
});

// Loads Google Maps API and initializes place search
loadGoogleMapsAPI(initPlaceSearch);
