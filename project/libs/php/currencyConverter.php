<?php

if (isset($_POST['currency'])) {
    $currency = strtoupper(trim($_POST['currency']));
    $apiKey = '29f407edc38e251b2c3a1bb3'; 
    $url = "https://v6.exchangerate-api.com/v6/$apiKey/latest/$currency";

    $response = file_get_contents($url);

    if ($response !== false) {
        echo $response;
    } else {
        echo json_encode(["error" => "Unable to fetch currency data"]);
    }
} else {
    echo json_encode(["error" => "No currency specified"]);
}

?>
