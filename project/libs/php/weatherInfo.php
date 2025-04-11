<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);

// Retrieve latitude and longitude from POST request, default to empty string if not provided
$lat = $_POST['lat'] ?? ''; 
$lon = $_POST['lon'] ?? ''; 
$apiKey = '17108cbb5dc9737769530350662988ec'; // API key for OpenWeatherMap

// Construct the URL for the weather API request, including latitude, longitude, and API key
$url = "https://api.openweathermap.org/data/2.5/weather?lat=$lat&lon=$lon&appid=$apiKey&units=metric";

// Initialize cURL session to make the API request
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Disable SSL verification (consider enabling in production)
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);  // Return the response as a string
curl_setopt($ch, CURLOPT_URL, $url); // Set the URL for the API request

// Execute the cURL request and store the result
$result = curl_exec($ch);

// If there's a cURL error, return the error message in the response
if ($result === false) {
    echo json_encode(['error' => 'Curl error: ' . curl_error($ch)]);
    curl_close($ch); // Close the cURL session
    exit;
}

// Close the cURL session after the request is completed
curl_close($ch);

// Decode the JSON response from the weather API
$decode = json_decode($result, true);

// If the API response has an error code, return the error message
if (isset($decode['cod']) && $decode['cod'] != 200) {
    echo json_encode(['error' => 'Weather API error: ' . $decode['message']]);
    exit;
}

// Prepare the output with relevant weather data
$output = [
    'temp' => $decode['main']['temp'], // Temperature in Celsius
    'weather' => $decode['weather'][0]['main'], // General weather condition (e.g., Clear, Rain)
    'humidity' => $decode['main']['humidity'], // Humidity percentage
    'windSpeed' => $decode['wind']['speed'], // Wind speed in m/s
    'description' => $decode['weather'][0]['description'] // Weather condition description
];

// Set the response headers to return JSON and allow cross-origin requests
header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *"); // Allow requests from any origin
header("Access-Control-Allow-Methods: GET, POST, OPTIONS"); // Allow GET, POST, and OPTIONS methods
header("Access-Control-Allow-Headers: Content-Type"); // Allow Content-Type header

// Return the weather data as a JSON response
echo json_encode($output);
?>
