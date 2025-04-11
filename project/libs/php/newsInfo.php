<?php

ini_set('display_errors', 'On');
error_reporting(E_ALL);


$executionStartTime = microtime(true);

// Retrieve country code from POST request
$countryCode = isset($_POST['country']) ? trim($_POST['country']) : '';

// Validate the country code, and return an error if it's empty
if (empty($countryCode)) {
    $output['status']['code'] = "400";
    $output['status']['name'] = "error";
    $output['status']['description'] = "Invalid country code provided";
    $output['data'] = [];
    echo json_encode($output);
    exit;
}

// Set the language for the news articles (English in this case)
$language = 'en';

// API key 
$apiKey = "pub_4988763a7b0cd1f178ebf51f1d813e9356eee"; 


$url = "https://newsdata.io/api/1/news?apikey=" . urlencode($apiKey) . 
       "&country=" . urlencode($countryCode) . 
       "&language=" . urlencode($language);


error_log("API URL: " . $url);

// Initialize cURL session to make the API request
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);  // Disable SSL verification (not recommended for production)
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);    // Return the response as a string
curl_setopt($ch, CURLOPT_URL, $url);               // Set the URL for the request

// Execute the cURL request and capture the result
$result = curl_exec($ch);

// Handle cURL errors, if any
if (curl_errno($ch)) {
    $output['status']['code'] = "500";
    $output['status']['name'] = "error";
    $output['status']['description'] = curl_error($ch);
    $output['data'] = [];
} else {
    // Decode the JSON response from the API
    $decode = json_decode($result, true);

    // Log the API response for debugging purposes
    error_log("API Response: " . $result);

    // Check if the API response contains an error status
    if (isset($decode['status']) && $decode['status'] === 'error') {
        $output['status']['code'] = "400";
        $output['status']['name'] = "error";
        $output['status']['description'] = isset($decode['message']) ? $decode['message'] : "API returned an error";
        $output['data'] = [];
    } 
    // If the response contains results, prepare them for output
    else if (isset($decode['results']) && is_array($decode['results'])) {
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "success";
        $output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
  
        // Limit the number of articles to 10
        $maxArticles = 10;
        $output['data'] = array_slice($decode['results'], 0, $maxArticles);
        
        // Ensure each article has a description, or set a default message
        foreach ($output['data'] as $key => $article) {
            if (isset($article['description']) && $article['description'] === null) {
                $output['data'][$key]['description'] = "No description available";
            }
        }
    } else {
        // If no results were found or there was an API error, return a 500 error
        $output['status']['code'] = "500";
        $output['status']['name'] = "error";
        $output['status']['description'] = "No results found or API response error.";
        $output['data'] = [];
    }
}


curl_close($ch);

header('Content-Type: application/json; charset=UTF-8');
echo json_encode($output);
?>
