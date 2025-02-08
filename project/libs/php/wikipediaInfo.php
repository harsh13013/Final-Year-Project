<?php

if (isset($_POST['country'])) {
    $country = urlencode($_POST['country']);
    $url = "https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles={$country}&redirects=1";

    $response = file_get_contents($url);

    if ($response !== false) {
        $data = json_decode($response, true);
        
        if (isset($data['query']['pages'])) {
            $pages = $data['query']['pages'];
            $page = reset($pages);
            
            $extractHtml = isset($page['extract']) ? $page['extract'] : "No information available.";
            $wikiTitle = isset($page['title']) ? $page['title'] : $_POST['country'];
            $wikiUrl = "https://en.wikipedia.org/wiki/" . urlencode($wikiTitle);

            echo json_encode([
                "status" => [
                    "name" => "ok",
                    "code" => 200,
                    "description" => "success"
                ],
                "data" => [
                    "extract_html" => $extractHtml,
                    "wiki_url" => $wikiUrl  
                ]
            ]);
        } else {
            echo json_encode([
                "status" => [
                    "name" => "error",
                    "code" => 404,
                    "description" => "No pages found"
                ]
            ]);
        }
    } else {
        echo json_encode([
            "status" => [
                "name" => "error",
                "code" => 500,
                "description" => "Unable to fetch data from Wikipedia"
            ]
        ]);
    }
} else {
    echo json_encode([
        "status" => [
            "name" => "error",
            "code" => 400,
            "description" => "No country specified"
        ]
    ]);
}

?>
