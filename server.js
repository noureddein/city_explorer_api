// Application Dependencies
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superAgent = require('superagent');
const { json } = require('express');
const pg = require('pg');

// Application Setup
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const app = express();
app.use(cors());
const client = new pg.Client(DATABASE_URL);

//KEYS
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const PARK_KEY = process.env.PARK_KEY;

//Route Definitions
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/parks', parksHandler);
app.get('*', errorHandler);

//----------------------------------------------

//Location Handler
function locationHandler(req, res) {
  //get city from query
  let getCity = req.query.city;

  // use city to request data from Database
  const search_city_DB = 'SELECT * FROM city WHERE search_query = $1;'; //Here we don't use ${city} because of security issus
  const sqlArray = [getCity];

  client.query(search_city_DB, sqlArray)
    .then(getDataFromDB => {
      let url = `https://eu1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${getCity}&format=json`;
      if (getDataFromDB.rowCount === 0) {
        superAgent.get(url).then(data => {
          console.log(data);
          res.send('hi');
          // const geoData = data.text;

          // const apiData = JSON.parse(geoData);

          // res.status(200).send(new City(getCity, 
          //   apiData[0].display_name, apiData[0].lat, apiData[0].lon));

        }).catch(error => {
          res.status(404).send(`Something went wrong in LOCATION route ${error}`);
        });
      } else {
        const data = getDataFromDB.rows[0];
        const city_location = new City(getCity, data.formatted_query, data.latitude, data.longitude);
      }
    });


}

//Constructor function for location
function City(search_query, formatted_query, latitude, longitude) {
  this.search_query = search_query;
  this.formatted_query = formatted_query;
  this.latitude = latitude;
  this.longitude = longitude;
}

//-------------------------------------------------

function weatherHandler(req, res) {
  let getCity = req.query.search_query;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${getCity}&key=${WEATHER_API_KEY}`;
  superAgent.get(url).then(data => {
    const weatherData = JSON.parse(data.text).data;
    const weatherArray = weatherData.map(eachDay => new CityWeather(eachDay.weather.description, eachDay.datetime));
    res.status(200).send(weatherArray);
  }).catch((error) => res.status(500).send(`Something want wrong in ${error}`));

}

//Constructor function for weather
function CityWeather(description, time) {
  this.forecast = description;
  this.time = time;
}


//-------------------------------------------------------

//Parks handler function
function parksHandler(req, res) {
  const getCity = req.query.search_query;
  const url = `https://developer.nps.gov/api/v1/parks?api_key=${PARK_KEY}&q=${getCity}`;
  superAgent.get(url).then(data => {
    const parksData = data.body.data;
    const allParks = parksData.map(eachPark => new Parks(eachPark.fullName, eachPark.addresses[0].line1, eachPark.description, eachPark.url));
    res.status(200).send(allParks);
  }).catch(error => {
    res.status(500).send(`Something went wrong in PARKS route ${error}`);
  });

}

// Parks constructor
function Parks(name, address, description, url) {
  this.name = name;
  this.address = address;
  this.fee = '0.00';
  this.description = description;
  this.url = url;
}


//---------------------------------------------------------

//Error Handler function
function errorHandler(req, res) {
  res.status(500).send('Sorry, something went wrong');
}

//-------------------------------------


app.listen(PORT, () => {
  console.log(`Open Port ${PORT}`);
});
