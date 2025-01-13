document.addEventListener("DOMContentLoaded", function () {
  let placeSearch,
    userMarker,
    userCircle,
    countryMarker,
    countryCircle,
    easyButton,
    placeMarkers = [];
  function hidePreLoader() {
    const preLoader = document.getElementById("pre-loader");
    if (preLoader) {
      preLoader.style.display = "none";
    }
  }

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

  function initMap() {
    map = L.map("map").setView([20, 0], 2);

    const osmTileLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "© OpenStreetMap contributors",
      }
    );
    loadGoogleMapsAPI(initPlaceSearch);
    const satelliteTileLayer = L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      {
        attribution: "© OpenTopoMap contributors",
      }
    );
    osmTileLayer.addTo(map);

    const baseLayers = {
      "Street View": osmTileLayer,
      "Satellite View": satelliteTileLayer,
    };
    L.control.layers(baseLayers).addTo(map);

    if (location.protocol === "https:" || location.hostname === "localhost") {
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(success, error);
      } else {
        alert("Geolocation is not valid");
      }
    } else {
      alert("Geolocation is only available over HTTPS or on localhost.");
      alert(
        "Geolocation requests are blocked because the site is not served over HTTPS. Please switch to a secure connection."
      );
    }

    function success(pos) {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      map.setView([lat, lng], 13);

      fetchCountryName(lat, lng)
        .then(() => hidePreLoader())
        .catch((error) => {
          console.error("Error in fetching country info:", error);
          hidePreLoader();
        });
    }

    function error(err) {
      if (err.code === 1) {
        alert("Please allow geolocation access");
      } else {
        alert("Cannot get current location");
      }
    }

    function initPlaceSearch() {
      const input = document.getElementById("placeSearch");
      const autocomplete = new google.maps.places.Autocomplete(input, {
        fields: ["geometry", "name"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
          alert("No details available for the selected place.");
          return;
        }

        const { lat, lng } = place.geometry.location;
        const name = place.name;

        map.setView([lat(), lng()], 13);
        placeMarkers.forEach((marker) => map.removeLayer(marker));
        placeMarkers = [];
        const cityMarker = L.marker([lat(), lng()])
          .bindPopup(`<b>${name}</b>`)
          .addTo(map);
        fetchNearbyAttractions(lat(), lng());
      });
    }

    function fetchNearbyAttractions(lat, lng) {
      const service = new google.maps.places.PlacesService(
        document.createElement("div")
      );

      const request = {
        location: new google.maps.LatLng(lat, lng),
        radius: 50000,
        type: ["tourist_attraction"],
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          placeMarkers.forEach((marker) => map.removeLayer(marker));
          placeMarkers = [];

          results.forEach((place) => {
            const marker = L.marker([
              place.geometry.location.lat(),
              place.geometry.location.lng(),
            ])
              .bindPopup(
                `
                <b>${place.name}</b><br>
                ${place.vicinity || ""}<br>
                ${
                  place.photos && place.photos.length > 0
                    ? `<img src="${place.photos[0].getUrl({
                        maxWidth: 200,
                      })}" alt="${
                        place.name
                      }" style="max-width: 100%; height: auto;">`
                    : "No image available"
                }
              `
              )
              .addTo(map);

            placeMarkers.push(marker);
          });
        } else {
          alert("No attractions found in the selected area.");
        }
      });
    }
  }

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

  function addCurrentLocationToDropdown(countryName, countryCode) {
    const countrySelect = document.getElementById("countrySelect");
    const option = document.createElement("option");
    option.value = countryCode;
    option.text = `${countryName}`;
    option.selected = true;
    countrySelect.appendChild(option);
  }

  function fetchCountryList() {
    fetch("libs/php/getCountryList.php")
      .then((response) => response.json())
      .then((data) => {
        const countrySelect = document.getElementById("countrySelect");
        data.countries.forEach((country) => {
          let option = document.createElement("option");
          option.value = country.iso;
          option.text = country.name;
          countrySelect.appendChild(option);
        });
      })
      .catch((error) => console.error("Error fetching country list:", error));
  }

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
        }
      })
      .catch((error) => console.error("Error fetching country info:", error));
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
