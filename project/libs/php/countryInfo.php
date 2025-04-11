<?php

ini_set('display_errors', 'On');
error_reporting(E_ALL);


$executionStartTime = microtime(true);

// Retrieve the country code from the POST request
$countryCode = $_POST['country'];

// Define the URL for the GeoNames API, appending the country code and username
$url = 'http://api.geonames.org/countryInfoJSON?formatted=true&country=' . $countryCode . '&username=manpreet11&type=json';  


$ch = curl_init();

// Disable SSL verification (not recommended for production)
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

// Set cURL options: return the response as a string, and set the URL
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);


curl_close($ch);

// Decode the JSON response from GeoNames into an associative array
$decode = json_decode($result, true);

// Prepare the response array with status and data
$output['status']['code'] = "200";  
$output['status']['name'] = "ok";  
$output['status']['description'] = "success"; 
$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";  // Time taken for the request (in milliseconds)
$output['data'] = $decode['geonames'];  

// Set the response header to return JSON
header('Content-Type: application/json; charset=UTF-8');

// Return the output as a JSON-encoded string
echo json_encode($output); 
?>
