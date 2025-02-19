<?php
ini_set('display_errors', 'On');
error_reporting(E_ALL);

$executionStartTime = microtime(true);

$countryCode = isset($_POST['country']) ? trim($_POST['country']) : '';


if (empty($countryCode)) {
    $output['status']['code'] = "400";
    $output['status']['name'] = "error";
    $output['status']['description'] = "Invalid country code provided";
    $output['data'] = [];
    echo json_encode($output);
    exit;
}

$language = 'en';


$apiKey = "pub_4988763a7b0cd1f178ebf51f1d813e9356eee"; 


$url = "https://newsdata.io/api/1/news?apikey=" . urlencode($apiKey) . 
       "&country=" . urlencode($countryCode) . 
       "&language=" . urlencode($language);


error_log("API URL: " . $url);

$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL, $url);

$result = curl_exec($ch);

if (curl_errno($ch)) {
    $output['status']['code'] = "500";
    $output['status']['name'] = "error";
    $output['status']['description'] = curl_error($ch);
    $output['data'] = [];
} else {
    $decode = json_decode($result, true);
    

    error_log("API Response: " . $result);
    
    if (isset($decode['status']) && $decode['status'] === 'error') {
        $output['status']['code'] = "400";
        $output['status']['name'] = "error";
        $output['status']['description'] = isset($decode['message']) ? $decode['message'] : "API returned an error";
        $output['data'] = [];
    } 
    else if (isset($decode['results']) && is_array($decode['results'])) {
        $output['status']['code'] = "200";
        $output['status']['name'] = "ok";
        $output['status']['description'] = "success";
        $output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
  
        $maxArticles = 10;
        $output['data'] = array_slice($decode['results'], 0, $maxArticles);
        
    
        foreach ($output['data'] as $key => $article) {
            if (isset($article['description']) && $article['description'] === null) {
                $output['data'][$key]['description'] = "No description available";
            }
        }
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