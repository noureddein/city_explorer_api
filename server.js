//load the express module
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Create a serer apllication
const app = express();

//create port to listen to the response
const PORT = process.env.PORT || 3000;

//for securty
app.use(cors());

//Request are handle by callbacks
//express will pass parameter to the callbacks
/*
 *req / request => All the information about the request the server receive
 * res / response => method which can be called to create and send a response to the clint
*/

app.get('/location', handleLocation);

function handleLocation(request, response) {
  let searchForCity = request.query.city;
  let createCityObj = getLocationInfo(searchForCity);
  try {
    response.status(200).send(createCityObj);
  } catch (error) {
    response.status(500).send(`There is somthing wrong ${error}`);
  }
}


//Build the Constructer function

function CreateLocationObj(city, display_name, latitude, longitude) {
  this.search_query = city;
  this.formatted_query = display_name;
  this.latitude = latitude;
  this.longitude = longitude;
}

function getLocationInfo(searchForCity) {
  const requireLocationData = require('./data/location.json');
  let name = requireLocationData[0].display_name;
  let latitude = requireLocationData[0].lat;
  let longitude = requireLocationData[0].lon;
  const obje = new CreateLocationObj(searchForCity, name, latitude, longitude);
  return obje;

}

app.listen(PORT, () => {
  console.log(`listen from app.listen Port No. ${PORT}`);
});
