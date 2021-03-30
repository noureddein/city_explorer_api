// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
// const superagent = require('superagent');

// Application Setup
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());


//Route Definitions
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('*', errorHandler);

//Location Handler
function locationHandler(req, res) {
  let getCity = req.query.city;
  res.status(200).send(getLocationData(getCity));

}

//Constructor function for location
function City(search_query, formatted_query, latitude, longitude) {
  this.search_query = search_query;
  this.formatted_query = formatted_query;
  this.latitude = latitude;
  this.longitude = longitude;
}

// Prepare location data and make it Object
function getLocationData(cityName) {
  //Get the data from the JSON file
  const locationData = require('./data/location.json');
  const exact_City_Name = locationData[0].display_name;
  const latitude = locationData[0].lat;
  const longitude = locationData[0].lat;
  //Make the date and return it as object
  const reqLocationData = new City(cityName, exact_City_Name, latitude, longitude);
  return reqLocationData;
}

//-------------------------------------------------

//Weather handler
async function weatherHandler(req, res) {
  let getCity = req.query.city;
  let key = process.env.WEATHER_API_KEY;
  let url = `https://api.weatherbit.io/v2.0/current?lat=35.7796&lon=-78.6382&key=${key}&include=minutely`;
  const weatherData = await superagent.get(url);
  console.log(weatherData);
  res.json(weatherData.text);
}


//Constructor function for weather
function CityWeather(search_qury, forecast, time) {
  this.search_qury = search_qury;
  this.forecast = forecast;
  this.time = time;
}

function getWeatherData(cityName) {
  const locationData = require('./data/weather.json');
  let weatherObjects = [];
  for (let i = 0; i < 5; i++) {
    let date = new Date(locationData.data[i].datetime).toString();
    let weatherData = locationData.data[i].weather['description'];
    weatherObjects.push(
      new CityWeather(cityName, weatherData, date.match(/[A-Za-z].+[0-9].(2020)/g).join()));
  }
  return weatherObjects;
}

//Error Handler function
function errorHandler(req, res) {
  res.status(500).send('Sorry, something went wrong');
}


app.listen(PORT, () => {
  console.log(`Open Port ${PORT}`);
});
