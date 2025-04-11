<?php


header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);

// Check request method (GET or POST)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Retrieve 'passportCountry' and 'destinationCountry' from query parameters
    $passportCountry = isset($_GET['passportCountry']) ? $_GET['passportCountry'] : null;
    $destinationCountry = isset($_GET['destinationCountry']) ? $_GET['destinationCountry'] : null;
} else {
    // For POST request (if any), initialize the variables as null
    $passportCountry = null;
    $destinationCountry = null;
}

// If either 'passportCountry' or 'destinationCountry' is missing, return an error response
if (!$passportCountry || !$destinationCountry) {
    $output = [
        'status' => [
            'code' => "400",
            'name' => "error",
            'description' => "Missing 'passportCountry' or 'destinationCountry' parameter."
        ],
        'data' => []
    ];
    echo json_encode($output);
    exit;
}


$url = "https://rough-sun-2523.fly.dev/visa/$passportCountry/$destinationCountry";

// Initialize cURL session to make the API request
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Disable SSL verification (consider enabling in production)
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);  // Return the response as a string
curl_setopt($ch, CURLOPT_URL, $url); // Set the URL for the API request

// Execute the cURL request and store the response
$result = curl_exec($ch);

// If there's a cURL error, return the error in the response
if (curl_errno($ch)) {
    $output = [
        'status' => [
            'code' => "500",
            'name' => "error",
            'description' => "cURL Error: " . curl_error($ch)
        ],
        'data' => []
    ];
    echo json_encode($output);
    curl_close($ch);
    exit;
}


$decode = json_decode($result, true);


if (json_last_error() !== JSON_ERROR_NONE) {
    $output = [
        'status' => [
            'code' => "500",
            'name' => "error",
            'description' => "JSON decoding error: " . json_last_error_msg()
        ],
        'data' => []
    ];
    echo json_encode($output);
    curl_close($ch);
    exit;
}

// If the decoded data is empty, return an error response
if (empty($decode)) {
    $output = [
        'status' => [
            'code' => "500",
            'name' => "error",
            'description' => "No valid data returned from the API."
        ],
        'data' => []
    ];
    echo json_encode($output);
    curl_close($ch);
    exit;
}

// Prepare the successful response with the decoded data and execution time
$output = [
    'status' => [
        'code' => "200",
        'name' => "ok",
        'description' => "success",
        'returnedIn' => intval((microtime(true) - $executionStartTime) * 1000) . " ms"
    ],
    'data' => $decode
];


curl_close($ch);

// Return the response as JSON
header('Content-Type: application/json; charset=UTF-8');
echo json_encode($output);
?>
