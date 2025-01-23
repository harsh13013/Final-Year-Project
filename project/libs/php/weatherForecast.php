<?php
if (isset($_POST['lat']) && isset($_POST['lon'])) {
    $lat = $_POST['lat'];
    $lon = $_POST['lon'];
    $apiKey = '17108cbb5dc9737769530350662988ec'; 


    $url = "http://api.openweathermap.org/data/2.5/forecast?lat=$lat&lon=$lon&units=metric&appid=$apiKey";

    $response = file_get_contents($url);
    if ($response) {
        echo $response;
    } else {
        echo json_encode(['error' => 'Unable to fetch forecast data']);
    }
} else {
    echo json_encode(['error' => 'Invalid coordinates']);
}
?>
