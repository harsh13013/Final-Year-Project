<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$lat = $_POST['lat'] ?? ''; 
$lon = $_POST['lon'] ?? ''; 
$apiKey = '17108cbb5dc9737769530350662988ec'; 

$url = "https://api.openweathermap.org/data/2.5/weather?lat=$lat&lon=$lon&appid=$apiKey&units=metric";

$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);

if ($result === false) {
    echo json_encode(['error' => 'Curl error: ' . curl_error($ch)]);
    curl_close($ch);
    exit;
}

curl_close($ch);

$decode = json_decode($result, true);

if (isset($decode['cod']) && $decode['cod'] != 200) {
    echo json_encode(['error' => 'Weather API error: ' . $decode['message']]);
    exit;
}

$output = [
    'temp' => $decode['main']['temp'],
    'weather' => $decode['weather'][0]['main'],
    'humidity' => $decode['main']['humidity'],
    'windSpeed' => $decode['wind']['speed'],
    'description' => $decode['weather'][0]['description']
];

header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
echo json_encode($output);
?>
