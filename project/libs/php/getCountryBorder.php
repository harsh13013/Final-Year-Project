<?php

// Set headers for JSON response and allow cross-origin requests
header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Read GeoJSON file containing country borders
$geoJsonData = file_get_contents('countryBorders.geo.json');
if ($geoJsonData === false) {
    echo json_encode(['error' => 'Unable to read GeoJSON file.']);
    exit;
}

// Decode the GeoJSON data into an associative array
$countryBorders = json_decode($geoJsonData, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['error' => 'Error decoding JSON data.']);
    exit;
}

// Get country code from query parameter
$countryCode = $_GET['country'] ?? '';

// Validate country code (must be 2 uppercase letters)
if (empty($countryCode) || !preg_match('/^[A-Z]{2}$/', $countryCode)) {
    echo json_encode(['error' => 'Invalid or missing country code.']);
    exit;
}

// Find the border data for the specified country code
$borderData = null;
foreach ($countryBorders['features'] as $feature) {
    if ($feature['properties']['iso_a2'] === $countryCode) {
        $borderData = $feature;
        break;
    }
}

// Return the border data or an error message if not found
if ($borderData) {
    echo json_encode($borderData);
} else {
    echo json_encode(['error' => 'Country border data not found.']);
}
?>
