<?php

// Check if 'currency' is passed via POST request
if (isset($_POST['currency'])) {

    $currency = strtoupper(trim($_POST['currency']));
    
    // API key
    $apiKey = '29f407edc38e251b2c3a1bb3'; 
    
    // Construct the URL to fetch exchange rates for the given currency
    $url = "https://v6.exchangerate-api.com/v6/$apiKey/latest/$currency";

    // Fetch the data from the API using file_get_contents
    $response = file_get_contents($url);

    // Check if the response was successful
    if ($response !== false) {
        // Output the API response
        echo $response;
    } else {
        // If the response failed, return an error message in JSON format
        echo json_encode(["error" => "Unable to fetch currency data"]);
    }
} else {

    echo json_encode(["error" => "No currency specified"]);
}

?>
