<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$googleApiKey = "AIzaSyA4KGrT4S9X7S2pzdWTh-rku6HSzlMEyGk";
$unsplashApiKey = "7M717iPOtenZMS9PveSq1FD0YcW_dzD9xP-VoAbxw9k"; 

if (!isset($_GET['city']) || empty($_GET['city'])) {
    echo json_encode(["success" => false, "error" => "City parameter is required"]);
    exit;
}
 
$city = urlencode($_GET['city']);


$cityUrl = "https://api.opentripmap.com/0.1/en/places/geoname?name=$city&apikey=5ae2e3f221c38a28845f05b63374bf6fb80ff0ac34f52dfa39109360";
$cityResponse = file_get_contents($cityUrl);
$cityData = json_decode($cityResponse, true);

if (!$cityData || empty($cityData['lon']) || empty($cityData['lat'])) {
    echo json_encode(["success" => false, "error" => "City not found"]);
    exit;
}

$longitude = $cityData['lon'];
$latitude = $cityData['lat'];


$googlePlacesUrl = "https://maps.googleapis.com/maps/api/place/textsearch/json?query=top+attractions+in+$city&key=$googleApiKey";
$googlePlacesResponse = file_get_contents($googlePlacesUrl);
$googlePlacesData = json_decode($googlePlacesResponse, true);

if (!$googlePlacesData || empty($googlePlacesData['results'])) {
    echo json_encode(["success" => false, "error" => "No attractions found"]);
    exit;
}

$attractions = [];

foreach ($googlePlacesData['results'] as $place) {
    $name = $place['name'];
    $photoReference = $place['photos'][0]['photo_reference'] ?? null;
    $imageUrl = $photoReference ? "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=$photoReference&key=$googleApiKey" : null;


    if (!$imageUrl) {
        $unsplashUrl = "https://api.unsplash.com/search/photos?query=$name&client_id=$unsplashApiKey";
        $unsplashResponse = file_get_contents($unsplashUrl);
        $unsplashData = json_decode($unsplashResponse, true);
        $imageUrl = $unsplashData['results'][0]['urls']['small'] ?? null;
    }

    $attractions[] = [
        "name" => $name,
        "description" => $place['formatted_address'] ?? "No description available",
        "image" => $imageUrl
    ];
}

echo json_encode(["success" => true, "data" => $attractions]);
?>