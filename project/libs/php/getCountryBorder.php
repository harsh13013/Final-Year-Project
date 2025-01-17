<?php

header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$geoJsonData = file_get_contents('countryBorders.geo.json');
if ($geoJsonData === false) {
    echo json_encode(['error' => 'Unable to read GeoJSON file.']);
    exit;
}

$countryBorders = json_decode($geoJsonData, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['error' => 'Error decoding JSON data.']);
    exit;
}

$countryCode = $_GET['country'] ?? '';


if (empty($countryCode) || !preg_match('/^[A-Z]{2}$/', $countryCode)) {
    echo json_encode(['error' => 'Invalid or missing country code.']);
    exit;
}

$borderData = null;
foreach ($countryBorders['features'] as $feature) {
    if ($feature['properties']['iso_a2'] === $countryCode) {
        $borderData = $feature;
        break;
    }
}

if ($borderData) {
    echo json_encode($borderData);
} else {
    echo json_encode(['error' => 'Country border data not found.']);
}
?>
