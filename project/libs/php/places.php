<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// API keys for Google and Unsplash APIs
$googleApiKey = "AIzaSyA4KGrT4S9X7S2pzdWTh-rku6HSzlMEyGk";
$unsplashApiKey = "7M717iPOtenZMS9PveSq1FD0YcW_dzD9xP-VoAbxw9k"; 

// Check if the 'city' parameter is provided in the GET request
if (!isset($_GET['city']) || empty($_GET['city'])) {
    // Return an error if 'city' parameter is missing
    echo json_encode(["success" => false, "error" => "City parameter is required"]);
    exit;
}
 
// URL encode the city name for safe URL usage
$city = urlencode($_GET['city']);

// Request city data from OpenTripMap API using the city name
$cityUrl = "https://api.opentripmap.com/0.1/en/places/geoname?name=$city&apikey=5ae2e3f221c38a28845f05b63374bf6fb80ff0ac34f52dfa39109360";
$cityResponse = file_get_contents($cityUrl);
$cityData = json_decode($cityResponse, true);

// Check if city data was retrieved and contains valid coordinates
if (!$cityData || empty($cityData['lon']) || empty($cityData['lat'])) {
    // Return an error if city data is not found or incomplete
    echo json_encode(["success" => false, "error" => "City not found"]);
    exit;
}

// Extract longitude and latitude from the city data
$longitude = $cityData['lon'];
$latitude = $cityData['lat'];

// Request top attractions data from Google Places API using the city name
$googlePlacesUrl = "https://maps.googleapis.com/maps/api/place/textsearch/json?query=top+attractions+in+$city&key=$googleApiKey";
$googlePlacesResponse = file_get_contents($googlePlacesUrl);
$googlePlacesData = json_decode($googlePlacesResponse, true);

// Check if Google Places data is retrieved and contains results
if (!$googlePlacesData || empty($googlePlacesData['results'])) {
    // Return an error if no attractions are found
    echo json_encode(["success" => false, "error" => "No attractions found"]);
    exit;
}

// Initialize an array to store attractions
$attractions = [];

// Loop through the Google Places results and gather attraction details
foreach ($googlePlacesData['results'] as $place) {
    $name = $place['name'];
    // Check if a photo reference is available for the place
    $photoReference = $place['photos'][0]['photo_reference'] ?? null;
    // Build the image URL using the photo reference (if available)
    $imageUrl = $photoReference ? "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=$photoReference&key=$googleApiKey" : null;

    // If no image URL from Google Places, request a photo from Unsplash API
    if (!$imageUrl) {
        $unsplashUrl = "https://api.unsplash.com/search/photos?query=$name&client_id=$unsplashApiKey";
        $unsplashResponse = file_get_contents($unsplashUrl);
        $unsplashData = json_decode($unsplashResponse, true);
        // Use the first image result from Unsplash 
        $imageUrl = $unsplashData['results'][0]['urls']['small'] ?? null;
    }

    // Add the attraction to the array with name, description, and image URL
    $attractions[] = [
        "name" => $name,
        "description" => $place['formatted_address'] ?? "No description available",
        "image" => $imageUrl
    ];
}

// Return the list of attractions in JSON format
echo json_encode(["success" => true, "data" => $attractions]);
?>
