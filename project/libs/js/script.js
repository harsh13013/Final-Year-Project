document.addEventListener("DOMContentLoaded", function () {
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
    }

    function error(err) {
      if (err.code === 1) {
        alert("Please allow geolocation access");
      } else {
        alert("Cannot get current location");
      }
    }
  }
  initMap();
});
