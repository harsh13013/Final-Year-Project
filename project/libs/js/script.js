document.addEventListener("DOMContentLoaded", function () {
  let placeSearch,
    userMarker,
    userCircle,
    countryMarker,
    countryCircle,
    easyButton,
    wikiButton,
    newsButton,
    weatherButton,
    visaButton,
    filterButton,
    countryBorderLayer,
    placeMarkers = [],
    userInteracted = false;

  function hidePreLoader() {
    const preLoader = document.getElementById("pre-loader");
    if (preLoader) {
      preLoader.style.display = "none";
    }
  }

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

  // Initializes the map, adds tile layers, and sets up geolocation
  function initMap() {
    map = L.map("map").setView([20, 0], 2);

    loadGoogleMapsAPI(initPlaceSearch); // Loads Google Places Autocomplete

    // Map tile layers for different views
    const satelliteTileLayer = L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      { attribution: "© OpenTopoMap contributors" }
    );

    const streetLayer = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      { attribution: "© Carto contributors" }
    );

    // Adding default street view layer
    streetLayer.addTo(map);

    const baseLayers = {
      "Street View": streetLayer,
      "Satellite View": satelliteTileLayer,
    };

    L.control.layers(baseLayers).addTo(map);

    // Geolocation setup to center map based on user location
    if (location.protocol === "https:" || location.hostname === "localhost") {
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(success, error);
      } else {
        alert("Geolocation is not valid");
      }
    } else {
      alert("Geolocation is only available over HTTPS or on localhost.");
    }

    // Geolocation success callback
    function success(pos) {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      map.setView([lat, lng], 10);
      hidePreLoader();

      // Fetch country details and weather information
      setTimeout(() => {
        fetchCountryName(lat, lng)
          .then((countryData) => {
            fetchWeatherInfo(lat, lng);
            fetchWeatherForecast(lat, lng);
            fetchCountryBorder(countryData.countryCode);
          })
          .catch((error) =>
            console.error("Error fetching country info:", error)
          );
      }, 500);
    }

    // Geolocation error callback
    function error(err) {
      console.warn("Geolocation error:", err);
      hidePreLoader();
    }

    // Initialize Google Places autocomplete for place search input
    function initPlaceSearch() {
      const input = document.getElementById("placeSearch");
      const autocomplete = new google.maps.places.Autocomplete(input, {
        types: ["(cities)"],
        fields: ["geometry", "name"],
      });

      // Listen for place selection and update map with new location
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
          alert("No details available for the selected place.");
          return;
        }

        userInteracted = true;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const name = place.name;

        map.setView([lat, lng], 13);
        placeMarkers.forEach((marker) => map.removeLayer(marker));
        placeMarkers = [];

        const cityMarker = L.marker([lat, lng])
          .bindPopup(`<b>${name}</b>`)
          .addTo(map);

        fetchNearbyAttractions(lat, lng);
      });
    }

    // Fetch and display nearby attractions
    function fetchNearbyAttractions(lat, lng) {
      if (!userInteracted) return;

      const apiKey = "YOUR_API_KEY"; // API key for fetching nearby attractions

      if (!lat || !lng) {
        const center = map.getCenter();
        lat = center.lat;
        lng = center.lng;
      }

      const bounds = map.getBounds();
      const lat_min = bounds.getSouthWest().lat;
      const lat_max = bounds.getNorthEast().lat;
      const lon_min = bounds.getSouthWest().lng;
      const lon_max = bounds.getNorthEast().lng;

      // API request to fetch places within the visible map bounds
      const url = `https://api.opentripmap.com/0.1/en/places/bbox?lon_min=${lon_min}&lat_min=${lat_min}&lon_max=${lon_max}&lat_max=${lat_max}&apikey=${apiKey}`;

      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          if (data.features && data.features.length > 0) {
            placeMarkers.forEach((marker) => map.removeLayer(marker));
            placeMarkers = [];

            // Add markers for each nearby place
            data.features.forEach((place) => {
              const { name, xid, kinds } = place.properties;
              const [placeLng, placeLat] = place.geometry.coordinates;

              const marker = L.marker([placeLat, placeLng], {
                icon: getCategoryIcon(kinds),
                kinds: kinds,
              });

              // Fetch and display place details on marker click
              marker.on("click", () => {
                fetch(
                  `https://api.opentripmap.com/0.1/en/places/xid/${xid}?apikey=${apiKey}`
                )
                  .then((res) => res.json())
                  .then((details) => {
                    const imageUrl = details.preview
                      ? details.preview.source
                      : null;
                    marker
                      .bindPopup(
                        `<b>${name}</b><br>
                        ${
                          imageUrl
                            ? `<img src="${imageUrl}" alt="${name}" style="width:100%; height:auto;">`
                            : ""
                        }
                        <p>${
                          details.wikipedia_extracts
                            ? details.wikipedia_extracts.text
                            : "No additional information available."
                        }</p>`
                      )
                      .openPopup();
                  })
                  .catch((err) =>
                    console.error("Error fetching place details:", err)
                  );
              });

              marker.addTo(map);
              placeMarkers.push(marker);
            });

            filterAttractions(currentFilter);
          } else {
            console.log("No attractions found in the selected area.");
          }
        })
        .catch((error) => {
          console.error("Error fetching attractions:", error);
        });
    }

    // Re-fetch nearby attractions when the map is moved
    map.on("moveend", () => {
      if (userInteracted) {
        fetchNearbyAttractions();
      }
    });
    function getCategoryIcon(kinds) {
      const museumStyle =
        "color: #DEB887; text-shadow: 1px 1px 3px rgba(0,0,0,0.3); font-size: 24px;";
      const historicStyle =
        "color: #0000FF; text-shadow: 1px 1px 3px rgba(0,0,0,0.3); font-size: 24px;";
      const naturalStyle =
        "color: #006400; text-shadow: 1px 1px 3px rgba(0,0,0,0.3); font-size: 24px;";
      const religionStyle =
        "color: #FF8C00; text-shadow: 1px 1px 3px rgba(0,0,0,0.3); font-size: 24px;";
      const iconStyle =
        "color: #48D1CC; text-shadow: 1px 1px 3px rgba(0,0,0,0.3); font-size: 24px;";

      if (kinds.includes("museum"))
        return L.divIcon({
          html: `<i class="fas fa-landmark" style="${museumStyle}"></i>`,
          className: "custom-icon",
          iconSize: [32, 32],
        });
      if (kinds.includes("historic"))
        return L.divIcon({
          html: `<i class="fas fa-monument" style="${historicStyle}"></i>`,
          className: "custom-icon",
          iconSize: [32, 32],
        });
      if (kinds.includes("natural"))
        return L.divIcon({
          html: `<i class="fas fa-tree" style="color: #4caf50; ${naturalStyle}"></i>`,
          className: "custom-icon",
          iconSize: [32, 32],
        });
      if (kinds.includes("religion"))
        return L.divIcon({
          html: `<i class="fas fa-place-of-worship" style="color: #f39c12; ${religionStyle}"></i>`,
          className: "custom-icon",
          iconSize: [32, 32],
        });
      if (kinds.includes("water"))
        return L.divIcon({
          html: `<i class="fas fa-water" style="color: #007bff; ${iconStyle}"></i>`,
          className: "custom-icon",
          iconSize: [32, 32],
        });
      if (kinds.includes("art"))
        return L.divIcon({
          html: `<i class="fas fa-palette" style="color: #9c27b0; ${iconStyle}"></i>`,
          className: "custom-icon",
          iconSize: [32, 32],
        });
      if (kinds.includes("park"))
        return L.divIcon({
          html: `<i class="fas fa-tree-city" style="color: #28a745; ${iconStyle}"></i>`,
          className: "custom-icon",
          iconSize: [32, 32],
        });
      if (kinds.includes("beach"))
        return L.divIcon({
          html: `<i class="fas fa-umbrella-beach" style="color: #f4a261; ${iconStyle}"></i>`,
          className: "custom-icon",
          iconSize: [32, 32],
        });
      if (kinds.includes("castle"))
        return L.divIcon({
          html: `<i class="fas fa-chess-rook" style="color: #6c757d; ${iconStyle}"></i>`,
          className: "custom-icon",
          iconSize: [32, 32],
        });
      if (kinds.includes("bridge"))
        return L.divIcon({
          html: `<i class="fas fa-bridge" style="color: #795548; ${iconStyle}"></i>`,
          className: "custom-icon",
          iconSize: [32, 32],
        });
      if (kinds.includes("shopping"))
        return L.divIcon({
          html: `<i class="fas fa-shopping-bag" style="color: #dc3545; ${iconStyle}"></i>`,
          className: "custom-icon",
          iconSize: [32, 32],
        });
      if (kinds.includes("food"))
        return L.divIcon({
          html: `<i class="fas fa-utensils" style="color: #e67e22; ${iconStyle}"></i>`,
          className: "custom-icon",
          iconSize: [32, 32],
        });
      if (kinds.includes("zoo"))
        return L.divIcon({
          html: `<i class="fas fa-paw" style="color: #ff9800; ${iconStyle}"></i>`,
          className: "custom-icon",
          iconSize: [32, 32],
        });
      if (kinds.includes("theatre"))
        return L.divIcon({
          html: `<i class="fa-solid fa-film" style="color: #c0392b; ${iconStyle}"></i>`,
          className: "custom-icon",
          iconSize: [32, 32],
        });
      if (kinds.includes("science"))
        return L.divIcon({
          html: `<i class="fas fa-flask" style="color: #1abc9c; ${iconStyle}"></i>`,
          className: "custom-icon",
          iconSize: [32, 32],
        });
      if (kinds.includes("sports"))
        return L.divIcon({
          html: `<i class="fas fa-futbol" style="color: #2c3e50; ${iconStyle}"></i>`,
          className: "custom-icon",
          iconSize: [32, 32],
        });

      return L.divIcon({
        html: `<i class="fas fa-map-marker-alt" style="color: #e74c3c; ${iconStyle}"></i>`,
        className: "custom-icon",
        iconSize: [32, 32],
      });
    }
  }
  // Current filters applied on the map
  let currentFilters = [];

  // Adds the filter button to the map
  function addFilterButton() {
    if (filterButton) {
      filterButton.remove();
    }

    filterButton = L.easyButton({
      states: [
        {
          stateName: "show-filter",
          icon: "fa-filter fa-solid",
          title: "Filter Attractions",
          onClick: function (btn, map) {
            // Show the filter modal when the button is clicked
            const filterModal = document.getElementById("filterModal");
            const modal = new bootstrap.Modal(filterModal);
            modal.show();
          },
        },
      ],
    }).addTo(map);
  }

  // Handle the filter form submission and apply selected categories
  document
    .getElementById("filterForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      const selectedCategories = Array.from(
        document.querySelectorAll('input[name="categoryFilter"]:checked')
      ).map((checkbox) => checkbox.value);

      // Apply the filter based on selected categories
      filterAttractions(selectedCategories);

      // Close the modal after filtering
      const filterModal = document.getElementById("filterModal");
      const modal = bootstrap.Modal.getInstance(filterModal);
      modal.hide();
    });

  // Handle the reset filter action when the "Cancel" button is clicked
  document
    .querySelector(".btn-secondary")
    .addEventListener("click", function (event) {
      event.preventDefault();
      // Uncheck all category filters and reset
      document
        .querySelectorAll('input[name="categoryFilter"]')
        .forEach((checkbox) => (checkbox.checked = false));
      filterAttractions(["all"]);

      const filterModal = document.getElementById("filterModal");
      const modal = bootstrap.Modal.getInstance(filterModal);
      modal.hide();
    });

  // Function to filter and display attractions based on selected categories
  function filterAttractions(categories) {
    placeMarkers.forEach((marker) => {
      const kinds = marker.options.kinds;
      // Add markers to map if they match the selected categories
      if (
        categories.includes("all") ||
        categories.some((category) => kinds.includes(category))
      ) {
        marker.addTo(map);
      } else {
        map.removeLayer(marker); // Remove markers that don't match the filters
      }
    });
    currentFilters = categories;
  }

  // Fetch country name based on latitude and longitude
  function fetchCountryName(lat, lng) {
    const url = "libs/php/nearbyPlaces.php";
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        lat: lat,
        lng: lng,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        // On successful response, fetch country info
        if (data.status.code === "200" && data.data.length > 0) {
          const country = data.data[0].countryName;
          const countryCode = data.data[0].countryCode;
          addCurrentLocationToDropdown(country, countryCode);
          return fetchCountryInfo(countryCode, lat, lng);
        } else {
          console.error("No nearby places found:", data);
          return Promise.reject("No nearby places found");
        }
      })
      .catch((error) => {
        console.error("Error fetching country name:", error);
        return Promise.reject(error);
      });
  }

  // Add the current country to the dropdown list
  function addCurrentLocationToDropdown(countryName, countryCode) {
    const countrySelect = document.getElementById("countrySelect");
    const option = document.createElement("option");
    option.value = countryCode;
    option.text = `${countryName}`;
    option.selected = true;
    countrySelect.appendChild(option);
  }

  // Fetch the list of countries from the server and populate the dropdown
  function fetchCountryList() {
    fetch("libs/php/getCountryList.php")
      .then((response) => response.json())
      .then((data) => {
        const countrySelect = document.getElementById("countrySelect");
        countrySelect.innerHTML = ""; // Clear the dropdown first
        data.countries.sort((a, b) => a.name.localeCompare(b.name));

        // Add each country to the dropdown
        data.countries.forEach((country) => {
          let option = document.createElement("option");
          option.value = country.iso;
          option.text = country.name;
          countrySelect.appendChild(option);
        });
      })
      .catch((error) => console.error("Error fetching country list:", error));
  }

  // Fetch detailed information about a country based on its code
  function fetchCountryInfo(countryCode, lat = null, lng = null) {
    fetch("libs/php/countryinfo.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        country: countryCode,
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.status.name === "ok") {
          const country = result.data[0];
          const capital = country.capital;
          const countryName = country.countryName;

          // Update the map view with country center coordinates if available
          if (lat && lng) {
            updateMap(lat, lng, country, true);
          } else {
            const countryLat = (country.north + country.south) / 2;
            const countryLon = (country.east + country.west) / 2;
            lat = countryLat;
            lng = countryLon;

            updateMap(countryLat, countryLon, country, false);
          }
          updateEasyButton(country);
          fetchWeatherInfo(lat, lng, capital, countryName);
          fetchWeatherForecast(lat, lng);
          fetchCountryBorder(countryCode);
          updateWikiButton(country);
          updateNewsButton(country);
          updateCurrencyButton(country);
          updateVisaButton(country);
          addFilterButton(); // Add the filter button once country info is fetched
        }
      })
      .catch((error) => console.error("Error fetching country info:", error));
  }

  // Fetches border data for a given country code from the server
  function fetchCountryBorder(countryCode) {
    fetch(`libs/php/getCountryBorder.php?country=${countryCode}`)
      .then((response) => response.json())
      .then((data) => {
        // If there's an error, log it, otherwise display the country border
        if (data.error) {
          console.error("Error fetching border data:", data.error);
        } else {
          displayCountryBorder(data);
        }
      })
      .catch((error) => console.error("Error fetching border data:", error));
  }

  // Displays the border of the country on the map
  function displayCountryBorder(borderData) {
    if (countryBorderLayer) {
      map.removeLayer(countryBorderLayer); // Remove any existing border layer
    }

    // Ensure valid border data is provided
    if (
      !borderData ||
      !borderData.geometry ||
      !borderData.geometry.type ||
      !borderData.geometry.coordinates
    ) {
      console.error("Invalid border data:", borderData);
      return;
    }

    const borderType = borderData.geometry.type;
    const coordinates = borderData.geometry.coordinates;

    let latLngs;

    // Handling different border types (Polygon and MultiPolygon)
    if (borderType === "Polygon") {
      latLngs = coordinates[0].map((coord) => [coord[1], coord[0]]);
      countryBorderLayer = L.polygon(latLngs, {
        color: "red", // Border color
        weight: 2, // Border weight
        fillColor: "transparent", // Border transparency
        fillOpacity: 0.5, // Fill opacity
      }).addTo(map);
    } else if (borderType === "MultiPolygon") {
      latLngs = coordinates.map((polygon) =>
        polygon[0].map((coord) => [coord[1], coord[0]])
      );
      countryBorderLayer = L.polygon(latLngs, {
        color: "red",
        weight: 2,
        fillColor: "transparent",
        fillOpacity: 0.5,
      }).addTo(map);
    } else {
      console.error("Unsupported border type:", borderType);
      return;
    }

    // Adjust map view to fit the country border
    if (countryBorderLayer) {
      map.fitBounds(countryBorderLayer.getBounds());
    }
  }

  // Fetches Wikipedia information for the given country name
  function fetchWikipediaInfo(countryName) {
    fetch("libs/php/wikipediaInfo.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        country: countryName,
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.status && result.status.name === "ok") {
          displayWikipediaInfo(result.data); // Display the fetched Wikipedia information
        } else {
          console.error(
            "Error fetching Wikipedia info:",
            result.status ? result.status.description : "Invalid status object"
          );
        }
      })
      .catch((error) => console.error("Error fetching Wikipedia info:", error));
  }

  // Displays the Wikipedia information in a modal
  function displayWikipediaInfo(wikiData) {
    const wikiContent = wikiData.extract_html || "No information available.";
    const wikiUrl = wikiData.wiki_url || "#";

    const wikiContentContainer = document.getElementById("wikiContent");
    wikiContentContainer.innerHTML = wikiContent;

    const wikiUrlContainer = document.getElementById("wiki_url");
    wikiUrlContainer.innerHTML = `<a href="${wikiUrl}" target="_blank" rel="noopener noreferrer">Read more on Wikipedia</a>`;

    const wikiModal = new bootstrap.Modal(document.getElementById("wikiModal"));
    wikiModal.show(); // Show the Wikipedia modal
  }

  // Adds a button to the map to fetch Wikipedia information for the selected country
  function updateWikiButton(country) {
    if (wikiButton) {
      wikiButton.remove(); // Remove existing button if any
    }

    wikiButton = L.easyButton({
      states: [
        {
          stateName: "show-wiki",
          icon: "fa-wikipedia-w fa-brands",
          title: "Wikipedia Information",
          onClick: function (btn, map) {
            fetchWikipediaInfo(country.countryName); // Fetch Wikipedia info when clicked
          },
        },
      ],
    }).addTo(map);
  }

  // Fetches news articles related to the country using its country code
  function fetchNews(countryCode) {
    if (!countryCode || countryCode.trim() === "") {
      console.error("Invalid country code");
      return;
    }

    const newsContent = document.getElementById("newsContent");
    if (newsContent) {
      newsContent.innerHTML =
        '<div class="text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>'; // Show loading spinner
    }

    const cleanCountryCode = countryCode.trim();
    console.log("Fetching news for country:", cleanCountryCode);

    fetch("libs/php/newsinfo.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        country: cleanCountryCode,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        if (result.status.name === "ok" && Array.isArray(result.data)) {
          displayNews(result.data); // Display news if valid response
        } else {
          console.error("Error in news response:", result.status.description);
          displayNewsError(result.status.description || "Failed to fetch news");
        }
      })
      .catch((error) => {
        console.error("Error fetching news:", error);
        displayNewsError("Failed to load news. Please try again later.");
      });
  }

  // Displays the fetched news articles in the modal
  function displayNews(newsArticles) {
    const newsContent = document.getElementById("newsContent");
    if (!newsContent) {
      console.error("News content element not found");
      return;
    }

    newsContent.innerHTML = "";

    if (!Array.isArray(newsArticles) || newsArticles.length === 0) {
      newsContent.innerHTML =
        '<div class="alert alert-info">No news articles found for this country.</div>';
      return;
    }

    const articleElements = newsArticles.map((article) => {
      const title = article.title || "No Title";
      const description = article.description || "No description available";
      const source = article.source_id || "Unknown Source";
      const pubDate = article.pubDate
        ? new Date(article.pubDate).toLocaleDateString()
        : "Unknown Date";

      return `
      <div class="news-article card mb-3">
        <div class="card-body">
          <h5 class="card-title">${title}</h5>
          <h6 class="card-subtitle mb-2 text-muted">${source} • ${pubDate}</h6>
          <p class="card-text">${description}</p>
          ${
            article.link
              ? `<a href="${article.link}" target="_blank" class="card-link">Read more</a>`
              : ""
          }
        </div>
      </div>
    `;
    });

    newsContent.innerHTML = articleElements.join("");

    const newsModal = new bootstrap.Modal(document.getElementById("newsModal"));
    newsModal.show(); // Show the news modal
  }

  // Displays an error message if news articles cannot be fetched
  function displayNewsError(errorMessage) {
    const newsContent = document.getElementById("newsContent");
    if (newsContent) {
      newsContent.innerHTML = `
      <div class="alert alert-danger">
        <strong>Error:</strong> ${errorMessage}
        <hr>
        <p>Possible solutions:</p>
        <ul>
          <li>Check your API key in the PHP file</li>
          <li>Verify that the country code is supported by the API</li>
          <li>Check your network connection</li>
        </ul>
      </div>
    `;
    }

    const newsModal = new bootstrap.Modal(document.getElementById("newsModal"));
    newsModal.show(); // Show the error modal
  }

  // Adds a button to the map to fetch news articles for the selected country
  function updateNewsButton(country) {
    if (newsButton) {
      newsButton.remove(); // Remove existing button if any
    }

    newsButton = L.easyButton({
      states: [
        {
          stateName: "show-news",
          icon: "fa-solid fa-newspaper",
          title: "News Articles",
          onClick: function (btn, map) {
            fetchNews(country.countryCode); // Fetch news when clicked
          },
        },
      ],
    }).addTo(map);
  }

  function fetchCurrencyInfo(baseCurrency) {
    fetch("libs/php/currencyConverter.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        currency: baseCurrency,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error("Error fetching currency info:", data.error);
        } else {
          displayCurrencyConverter(data);
        }
      })
      .catch((error) => console.error("Error fetching currency info:", error));
  }

  function displayCurrencyConverter(data) {
    const baseCurrency = data.base_code;
    const targetCurrencySelect = document.getElementById(
      "targetCurrencySelect"
    );
    const amountInput = document.getElementById("amountInput");
    const conversionResult = document.getElementById("conversionResult");

    amountInput.value = 1;

    targetCurrencySelect.innerHTML = `
            <option value="${baseCurrency}">${baseCurrency}</option>
            ${Object.keys(data.conversion_rates)
              .map(
                (currency) => `
                <option value="${currency}">${currency}</option>
            `
              )
              .join("")}
        `;

    const currencyModal = new bootstrap.Modal(
      document.getElementById("currencyModal")
    );
    currencyModal.show();

    convertCurrency(data);
    targetCurrencySelect.addEventListener("change", function () {
      convertCurrency(data);
    });

    amountInput.addEventListener("input", function () {
      convertCurrency(data);
    });
  }

  function convertCurrency(data) {
    const amount = parseFloat(document.getElementById("amountInput").value);
    const targetCurrency = document.getElementById(
      "targetCurrencySelect"
    ).value;
    const baseCurrency = data.base_code;

    if (isNaN(amount) || amount <= 0) {
      return;
    }

    const rate = data.conversion_rates[targetCurrency];
    if (!rate) {
      console.error(`Conversion rate not found for ${targetCurrency}`);
      return;
    }

    const convertedAmount = (amount * rate).toFixed(2);
    document.getElementById("conversionResult").innerHTML = `
            <h5>Conversion Result</h5>
            <p>${amount} ${baseCurrency} = ${convertedAmount} ${targetCurrency}</p>
        `;
  }
  let currencyButton;
  function updateCurrencyButton(country) {
    if (currencyButton) {
      currencyButton.remove();
    }

    currencyButton = L.easyButton({
      states: [
        {
          stateName: "show-currency",
          icon: "fa-solid fa-money-bill",
          title: "Currency Converter",
          onClick: function (btn, map) {
            fetchCurrencyInfo(country.currencyCode);
          },
        },
      ],
    }).addTo(map);
  }

  function fetchWeatherInfo(lat, lon, capital, countryName) {
    if (!lat || !lon) {
      console.error("Latitude and Longitude are required.");
      return;
    }

    fetch("libs/php/weatherInfo.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        lat: lat,
        lon: lon,
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.error) {
          console.error("Error fetching weather info:", result.error);
        } else {
          updateWeatherButton(result, capital, countryName);
        }
      })
      .catch((error) => console.error("Error fetching weather info:", error));
  }

  function updateWeatherButton(weather, capital, countryName) {
    if (weatherButton) {
      weatherButton.remove();
    }

    weatherButton = L.easyButton({
      states: [
        {
          stateName: "show-weather",
          icon: "fa-cloud fa-lg",
          title: "Weather Information",
          onClick: function (btn, map) {
            const weatherTitle = document.getElementById("modal-title");
            weatherTitle.textContent = `${capital}, ${countryName}`;

            const weatherDesc = document.getElementById("weatherDesc");
            const weatherIcon = document.getElementById("weatherIcon");
            const weatherTemp = document.getElementById("weatherTemp");

            const weatherDescription =
              weather.description.toUpperCase() || "No description available";
            const weatherCondition = weather.weather || "Clouds";

            const weatherIconData = getWeatherIcon(weatherCondition);

            weatherDesc.textContent = weatherDescription;
            weatherIcon.className = `fas ${weatherIconData.icon} ${weatherIconData.colorClass} fa-3x mb-2`;

            const temp = Math.floor(weather.temp || "N/A");

            weatherTemp.textContent = `${temp}°C`;

            new bootstrap.Modal(document.getElementById("weatherModal")).show();
          },
        },
      ],
    }).addTo(map);
  }

  function fetchWeatherForecast(lat, lon) {
    if (!lat || !lon) {
      console.error("Latitude and Longitude are required for forecast.");
      return;
    }

    fetch("libs/php/weatherForecast.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        lat: lat,
        lon: lon,
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.error) {
          console.error("Error fetching weather forecast:", result.error);
        } else {
          updateWeatherForecast(result);
        }
      })
      .catch((error) =>
        console.error("Error fetching weather forecast:", error)
      );
  }

  function updateWeatherForecast(forecast) {
    if (!forecast || !forecast.list) {
      console.error("Invalid forecast data:", forecast);
      return;
    }

    const nextTwoDays = [1, 2].map((days) => {
      const date = new Date();
      date.setDate(new Date().getDate() + days);
      return date.toISOString().slice(0, 10);
    });

    const forecastMap = {};

    forecast.list.forEach((item) => {
      const itemDate = new Date(item.dt * 1000).toISOString().slice(0, 10);
      const weatherCondition = item.weather[0]?.main;
      const iconData = getWeatherIcon(weatherCondition);

      if (nextTwoDays.includes(itemDate)) {
        if (!forecastMap[itemDate]) {
          forecastMap[itemDate] = {
            temp_min: item.main.temp_min,
            temp_max: item.main.temp_max,
            weatherIcon: iconData.icon,
            colorClass: iconData.colorClass,
          };
        } else {
          forecastMap[itemDate].temp_min = Math.min(
            forecastMap[itemDate].temp_min,
            item.main.temp_min
          );
          forecastMap[itemDate].temp_max = Math.max(
            forecastMap[itemDate].temp_max,
            item.main.temp_max
          );
        }
      }
    });

    const forecastContent = Object.keys(forecastMap)
      .sort()
      .map((date) => {
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
        });
        const weatherData = forecastMap[date];

        return `
                    <div class="col-6 mb-3">
                        <div class="forecast-item text-center p-3 border">
                            <h6>${formattedDate}</h6>
                            <i class="fas ${weatherData.weatherIcon} ${
          weatherData.colorClass
        } fa-3x mb-2"></i>
                            <h4>${Math.floor(weatherData.temp_max)}°C</h4>
                            <p>${Math.floor(weatherData.temp_min)}°C</p>
                        </div>
                    </div>
                `;
      })
      .join("");

    document.getElementById("forecastContent").innerHTML = forecastContent;
  }

  function getWeatherIcon(iconCode) {
    switch (iconCode) {
      case "Clear":
        return { icon: "fa fa-sun", colorClass: "icon-sun" };
      case "Clouds":
        return { icon: "fa fa-cloud", colorClass: "icon-cloud" };
      case "Rain":
        return { icon: "fa fa-cloud-rain", colorClass: "icon-rain" };
      default:
        return { icon: "fa fa-cloud", colorClass: "icon-cloud" };
    }
  }

  //Update the visa modal
  function updateVisaButton(destinationCountry) {
    if (visaButton) {
      visaButton.remove();
    }

    visaButton = L.easyButton({
      states: [
        {
          stateName: "show-visa",
          icon: "fa fa-ticket",
          title: "Visa Requirements",
          onClick: function () {
            if (destinationCountry) {
              const destinationSelect = document.getElementById(
                "destinationCountrySelect"
              );
              destinationSelect.innerHTML = "";
              const option = document.createElement("option");
              option.value = destinationCountry;
              option.text = destinationCountry;
              option.selected = true;
              destinationSelect.appendChild(option);
            }

            fetchPassport();
            fetchDestinationPassport();

            const visaModal = new bootstrap.Modal(
              document.getElementById("visaModal")
            );
            visaModal.show();

            visaModal._element.addEventListener("shown.bs.modal", function () {
              const fetchVisaReqButton =
                document.getElementById("fetchVisaReqButton");

              if (fetchVisaReqButton) {
                fetchVisaReqButton.addEventListener(
                  "click",
                  async function (event) {
                    event.preventDefault();

                    const passportCountry = document.getElementById(
                      "passportCountrySelect"
                    ).value;
                    const destinationCountry = document.getElementById(
                      "destinationCountrySelect"
                    ).value;

                    if (!passportCountry || !destinationCountry) {
                      document.getElementById("visaResult").innerHTML =
                        "<p class='text-danger'>Please select both passport and destination countries.</p>";
                      return;
                    }

                    try {
                      const visaData = await fetchVisaReq(
                        passportCountry,
                        destinationCountry
                      );

                      if (
                        !visaData ||
                        typeof visaData !== "object" ||
                        !visaData.passport ||
                        !visaData.destination ||
                        !visaData.category
                      ) {
                        document.getElementById("visaResult").innerHTML = `
                          <p class="text-danger">Visa information is currently unavailable or invalid. Please try again later.</p>
                        `;
                        return;
                      }

                      const durationText = visaData.dur
                        ? visaData.dur
                        : "Not available";

                      const visaResultDiv =
                        document.getElementById("visaResult");
                      visaResultDiv.innerHTML = `
                        <h5>Visa Requirements</h5>
                        <p><strong>Passport:</strong> ${visaData.passport.name} (${visaData.passport.code})</p>
                        <p><strong>Destination:</strong> ${visaData.destination.name} (${visaData.destination.code})</p>
                        <p><strong>Category:</strong> ${visaData.category.name}</p>
                        <p><strong>Duration:</strong> ${durationText}</p>
                      `;
                    } catch (error) {
                      console.error("Error fetching visa data:", error);
                      document.getElementById("visaResult").innerHTML = `
                        <p class="text-danger">Error fetching visa requirements: ${error.message}. The service might be temporarily unavailable.</p>
                      `;
                    }
                  }
                );
              } else {
                console.error("fetchVisaReqButton not found.");
              }
            });
          },
        },
      ],
    }).addTo(map);
  }
  //Visa Requirement fetch
  async function fetchVisaReq(passportCountry, destinationCountry) {
    const url = `libs/php/visa.php?passportCountry=${passportCountry}&destinationCountry=${destinationCountry}`;
    console.log(`Request URL: ${url}`);

    try {
      const response = await fetch(url);
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data.status.code === "200") {
          return data.data;
        } else {
          throw new Error(data.status.description || "Unknown error occurred");
        }
      } catch (jsonError) {
        console.error("Error parsing JSON:", text);
        throw new Error("Invalid JSON response from server.");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  }
  //Origin pass
  function fetchPassport() {
    // Get country list
    fetch("libs/php/getCountryList.php")
      .then((response) => response.json())
      .then((data) => {
        const passportCountrySelect = document.getElementById(
          "passportCountrySelect"
        );
        passportCountrySelect.innerHTML =
          "<option value='' disabled selected>Select a country</option>";
        data.countries.sort((a, b) => a.name.localeCompare(b.name));

        data.countries.forEach((country) => {
          let option = document.createElement("option");
          option.value = country.iso;
          option.text = country.name;
          passportCountrySelect.appendChild(option);
        });
      })
      .catch((error) => {
        console.error("Error fetching passport countries:", error);
      });
  }
  //Destination pass
  function fetchDestinationPassport() {
    // Get country list
    fetch("libs/php/getCountryList.php")
      .then((response) => response.json())
      .then((data) => {
        const destinationCountrySelect = document.getElementById(
          "destinationCountrySelect"
        );
        destinationCountrySelect.innerHTML =
          "<option value='' disabled selected>Select a country</option>";
        data.countries.sort((a, b) => a.name.localeCompare(b.name));

        data.countries.forEach((country) => {
          let option = document.createElement("option");
          option.value = country.iso;
          option.text = country.name;
          destinationCountrySelect.appendChild(option);
        });
      })
      .catch((error) => {
        console.error("Error fetching destination countries:", error);
      });
  }
  function updateMap(lat, lon, isCurrentLocation) {
    if (isCurrentLocation) {
      if (userMarker) {
        map.removeLayer(userMarker);
        map.removeLayer(userCircle);
      }

      map.setView([lat, lon], 20);
    } else {
      if (countryMarker) {
        map.removeLayer(countryMarker);
        map.removeLayer(countryCircle);
      }

      map.setView([lat, lon], 5);
    }
  }
  //Country info modal
  function updateEasyButton(country) {
    if (easyButton) {
      easyButton.remove();
    }

    easyButton = L.easyButton({
      states: [
        {
          stateName: "show-info",
          icon: "fa-solid fa-info",
          title: "Country Information",
          onClick: function (btn, map) {
            const modalContent = `
                        <div class="w-50 h-50">
                            <table class="table">
                                <tr>
                                    <td class="text-center"><i class="fa fa-street-view fa-lg text-success"></i></td>
                                    <td><strong>Continent</strong></td>
                                    <td>${country.continentName}</td>
                                </tr>
                                <tr>
                                    <td class="text-center"><i class="fa fa-heart fa-lg text-success"></i></td>
                                    <td><strong>Capital</strong></td>
                                    <td>${country.capital}</td>
                                </tr>
                                <tr>
                                    <td class="text-center"><i class="fa fa-language fa-lg text-success"></i></td>
                                    <td><strong>Language</strong></td>
                                    <td>${country.languages}</td>
                                </tr>
                                <tr>
                                    <td class="text-center"><i class="fa fa-users fa-lg text-success"></i></td>
                                    <td><strong>Population</strong></td>
                                    <td>${numeral(country.population).format(
                                      "0,0"
                                    )}</td>
                                </tr>
                                <tr>
                                    <td class="text-center"><i class="fa fa-globe fa-lg text-success"></i></td>
                                    <td><strong>Area</strong></td>
                                    <td>${numeral(country.areaInSqKm).format(
                                      "0,0"
                                    )}</td>
                                </tr>
                                <tr>
                                    <td class="text-center"><i class="fa fa-info fa-lg text-success"></i></td>
                                    <td><strong>Country Code</strong></td>
                                    <td>${country.countryCode}</td>
                                </tr>
                                <tr>
                                    <td class="text-center"><i class="fa fa-money fa-lg text-success"></i></td>
                                    <td><strong>Currency Code</strong></td>
                                    <td>${country.currencyCode}</td>
                                </tr>
                            </table>
                        </div>
                    `;
            document.getElementById("modalContent").innerHTML = modalContent;
            new bootstrap.Modal(document.getElementById("exampleModal")).show();
          },
        },
      ],
    }).addTo(map);
  }
  document
    .getElementById("countrySelect")
    .addEventListener("change", function (event) {
      const selectedCountryCode = event.target.value;
      if (selectedCountryCode) {
        fetchCountryInfo(selectedCountryCode);
      }
    });
  fetchCountryList();
  initMap();
});
