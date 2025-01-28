<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $passportCountry = $_GET['passportCountry'] ?? null;
    $destinationCountry = $_GET['destinationCountry'] ?? null;
} else {
    $passportCountry = null;
    $destinationCountry = null;
}


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


$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);

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

header('Content-Type: application/json; charset=UTF-8');
echo json_encode($output);
?>
