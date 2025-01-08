document.addEventListener("DOMContentLoaded", function () {
  function hidePreLoader() {
    const preLoader = document.getElementById("pre-loader");
    if (preLoader) {
      preLoader.style.display = "none";
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
  fetchCountryList();
  initMap();
});
