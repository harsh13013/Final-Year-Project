<?php
// Check if 'lat' and 'lng' are passed via POST request
if (isset($_POST['lat']) && isset($_POST['lng'])) {
    // Get latitude and longitude from POST request
    $lat = $_POST['lat'];
    $lng = $_POST['lng'];
    $username = 'manpreet11'; 

    // Construct the URL for the GeoNames API using latitude, longitude, and username
    $url = "http://api.geonames.org/findNearbyPlaceNameJSON?lat=${lat}&lng=${lng}&username=${username}";

    // Initialize cURL session to make the API request
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);  // Disable SSL verification (not recommended for production)
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);    // Return the response as a string
    curl_setopt($ch, CURLOPT_URL, $url);               // Set the URL for the request
    
    // Execute the cURL request and get the result
    $result = curl_exec($ch);
    curl_close($ch);  // Close the cURL session
    
    // Decode the JSON response from GeoNames API into an associative array
    $decode = json_decode($result, true);

    // Check if 'geonames' key exists in the response
    if (isset($decode['geonames'])) {
        // Prepare a successful response
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "success";
        $output['data'] = $decode['geonames'];
    } else {
     
        $output['status']['code'] = "500";
        $output['status']['name'] = "error";
        $output['status']['description'] = "Failed to retrieve data";
        $output['data'] = [];
    }

    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($output); 
} else {
    // If 'lat' or 'lng' are missing, return an error response
    $output['status']['code'] = "400";
    $output['status']['name'] = "fail";
    $output['status']['description'] = "Invalid input";
    $output['data'] = [];


    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($output);
}
?>
