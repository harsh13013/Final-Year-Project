<?php

// Check if 'country' parameter is passed in the POST request
if (isset($_POST['country'])) {
    // URL-encode the country name to ensure proper formatting for the API request
    $country = urlencode($_POST['country']);
    

    $url = "https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles={$country}&redirects=1";

    // Fetch the response from Wikipedia API
    $response = file_get_contents($url);

    // Check if the response is valid (not false)
    if ($response !== false) {
        // Decode the JSON response into a PHP associative array
        $data = json_decode($response, true);

        // Check if the 'pages' field exists in the response
        if (isset($data['query']['pages'])) {
            // Get the page data (the first page in case there are redirects or multiple entries)
            $pages = $data['query']['pages'];
            $page = reset($pages); // Get the first element from the array
            
          
            $extractHtml = isset($page['extract']) ? $page['extract'] : "No information available.";

            // Get the title of the Wikipedia page
            $wikiTitle = isset($page['title']) ? $page['title'] : $_POST['country'];

            // Construct the URL to the full Wikipedia article
            $wikiUrl = "https://en.wikipedia.org/wiki/" . urlencode($wikiTitle);

            // Return the results as a JSON response
            echo json_encode([
                "status" => [
                    "name" => "ok",
                    "code" => 200,
                    "description" => "success"
                ],
                "data" => [
                    "extract_html" => $extractHtml, // Extracted introductory content
                    "wiki_url" => $wikiUrl  // Wikipedia article URL
                ]
            ]);
        } else {
            // If no pages are found, return an error response
            echo json_encode([
                "status" => [
                    "name" => "error",
                    "code" => 404,
                    "description" => "No pages found"
                ]
            ]);
        }
    } else {
        // If the API request fails, return a server error
        echo json_encode([
            "status" => [
                "name" => "error",
                "code" => 500,
                "description" => "Unable to fetch data from Wikipedia"
            ]
        ]);
    }
} else {
    // If 'country' parameter is not set, return a client error
    echo json_encode([
        "status" => [
            "name" => "error",
            "code" => 400,
            "description" => "No country specified"
        ]
    ]);
}

?>
