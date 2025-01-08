<?php
if (isset($_POST['lat']) && isset($_POST['lng'])) {
    $lat = $_POST['lat'];
    $lng = $_POST['lng'];
    $username = 'manpreet11'; 

    $url = "http://api.geonames.org/findNearbyPlaceNameJSON?lat=${lat}&lng=${lng}&username=${username}";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_URL, $url);
    
    $result = curl_exec($ch);
    curl_close($ch);
    
    $decode = json_decode($result, true);

    if (isset($decode['geonames'])) {
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
    $output['status']['code'] = "400";
    $output['status']['name'] = "fail";
    $output['status']['description'] = "Invalid input";
    $output['data'] = [];

    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($output);
}
?>
