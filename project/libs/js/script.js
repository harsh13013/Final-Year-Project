document.addEventListener("DOMContentLoaded", function () {
  let placeSearch,
    userMarker,
    userCircle,
    countryMarker,
    countryCircle,
    easyButton,
    wikiButton,
    countryBorderLayer,
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
      const apiKey = "5ae2e3f221c38a28845f05b63374bf6fb80ff0ac34f52dfa39109360";
      const radius = 50000;
      const url = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${lng}&lat=${lat}&apikey=${apiKey}`;

      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          if (data.features && data.features.length > 0) {
            placeMarkers.forEach((marker) => map.removeLayer(marker));
            placeMarkers = [];

            data.features.forEach((place) => {
              const { name, xid, kinds } = place.properties;
              const [placeLng, placeLat] = place.geometry.coordinates;

              const marker = L.marker([placeLat, placeLng], {
                icon: L.icon({
                  iconUrl: getCategoryIcon(kinds),
                  iconSize: [32, 32],
                }),
              });

              marker
                .on("mouseover", (e) => {
                  const hoverTooltip = L.tooltip({
                    permanent: false,
                    direction: "top",
                    className: "custom-tooltip",
                  })
                    .setContent(`<b>${name}</b>`)
                    .setLatLng(e.latlng);

                  marker.bindTooltip(hoverTooltip).openTooltip();
                })
                .on("mouseout", () => {
                  marker.closeTooltip();
                });

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
                       ${details.kinds || "Category not available"}<br>
                       ${
                         imageUrl
                           ? `<img src="${imageUrl}" alt="${name}" style="width:100%; height:auto;">`
                           : ""
                       }
                       <p>${
                         details.wikipedia_extracts
                           ? details.wikipedia_extracts.text
                           : "No additional information available."
                       }</p>
                       <a href="https://opentripmap.com/en/places/${xid}" target="_blank">More Info</a>`
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
          } else {
            alert("No attractions found in the selected area.");
          }
        })
        .catch((error) => {
          console.error("Error fetching attractions:", error);
          alert("Failed to fetch attractions. Please try again later.");
        });
    }
    function getCategoryIcon(kinds) {
      if (kinds.includes("museum")) return "libs/img/museum.png";
      if (kinds.includes("historic")) return "libs/img/coliseum.png";
      if (kinds.includes("natural")) return "libs/img/bio.png";
      if (kinds.includes("religion")) return "libs/img/location.png";
      return "libs/img/love.png";
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
          fetchCountryBorder(countryCode);
          updateWikiButton(country);
        }
      })
      .catch((error) => console.error("Error fetching country info:", error));
  }

  function fetchCountryBorder(countryCode) {
    fetch(`libs/php/getCountryBorder.php?country=${countryCode}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error("Error fetching border data:", data.error);
        } else {
          displayCountryBorder(data);
        }
      })
      .catch((error) => console.error("Error fetching border data:", error));
  }

  function displayCountryBorder(borderData) {
    if (countryBorderLayer) {
      map.removeLayer(countryBorderLayer);
    }

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

    if (borderType === "Polygon") {
      latLngs = coordinates[0].map((coord) => [coord[1], coord[0]]);
      countryBorderLayer = L.polygon(latLngs, {
        color: "red",
        weight: 2,
        fillColor: "transparent",
        fillOpacity: 0.5,
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

    if (countryBorderLayer) {
      map.fitBounds(countryBorderLayer.getBounds());

      countryBorderLayer.on("mouseover", function () {
        countryBorderLayer.setStyle({
          fillColor: "grey",
          fillOpacity: 0.7,
          weight: 3,
        });
      });

      countryBorderLayer.on("mouseout", function () {
        countryBorderLayer.setStyle({
          fillColor: "transparent",
          fillOpacity: 0.5,
          weight: 2,
        });
      });
    }
  }
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
          displayWikipediaInfo(result.data);
        } else {
          console.error(
            "Error fetching Wikipedia info:",
            result.status ? result.status.description : "Invalid status object"
          );
        }
      })
      .catch((error) => console.error("Error fetching Wikipedia info:", error));
  }

  function displayWikipediaInfo(wikiData) {
    const wikiContent = wikiData.extract_html || "No information available.";
    const wikiContentContainer = document.getElementById("wikiContent");
    wikiContentContainer.innerHTML = wikiContent;

    const wikiModal = new bootstrap.Modal(document.getElementById("wikiModal"));
    wikiModal.show();
  }
  function updateWikiButton(country) {
    if (wikiButton) {
      wikiButton.remove();
    }

    wikiButton = L.easyButton({
      states: [
        {
          stateName: "show-wiki",
          icon: "fa-wikipedia-w fa-brands",
          title: "Show Wikipedia Information",
          onClick: function (btn, map) {
            fetchWikipediaInfo(country.countryName);
          },
        },
      ],
    }).addTo(map);
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
