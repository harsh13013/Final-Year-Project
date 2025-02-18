<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);
$countryCode = $_POST['country'];
$language = 'en';
$url = "https://newsdata.io/api/1/news?apikey=pub_4988763a7b0cd1f178ebf51f1d813e9356eee&country=$countryCode&language=$language";


$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);
if(curl_errno($ch)) {
    $output['status']['code'] = "500";
    $output['status']['name'] = "error";
    $output['status']['description'] = curl_error($ch);
    $output['data'] = [];
} else {
    $decode = json_decode($result, true);
    if(isset($decode['results'])) {
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "success";
        $output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
        $output['data'] = $decode['results'];
    } else {
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
