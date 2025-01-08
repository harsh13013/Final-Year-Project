<?php
$geoJsonData = file_get_contents('countryBorders.geo.json'); 
$countryBorders = json_decode($geoJsonData, true);

$countries = array_map(function($feature) {
  return [
    'iso' => $feature['properties']['iso_a2'],
    'name' => $feature['properties']['name']
  ];
}, $countryBorders['features']);

header('Content-Type: application/json; charset=UTF-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
echo json_encode(['countries' => $countries]);
?>
