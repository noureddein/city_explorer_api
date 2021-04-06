// Application Dependencies
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superAgent = require('superagent');
const pg = require('pg');//done

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
  let getCity = req.query.city;

  const selectSQL = `SELECT * FROM cityLocation WHERE search_query = '${getCity}'`;
  const url = `https://eu1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${getCity}&format=json`;

  client.query(selectSQL).then(result => {
    let dataFromDB = result.rowCount;
    if (dataFromDB) {
      res.send(result.rows[0]);
      console.log('data from DB ', dataFromDB);
    } else {
      superAgent.get(url).then(data => {
        const geoData = data.text;
        const apiData = JSON.parse(geoData);
        res.send(new City(getCity, apiData[0].display_name, apiData[0].lat, apiData[0].lon));
        const addToSQLTable = 'INSERT INTO cityLocation (search_query , formatted_query , latitude, longitude) VALUES ($1,$2,$3,$4) RETURNING *';
        const insertValues = [getCity, apiData[0].display_name, apiData[0].lat, apiData[0].lon];
        client.query(addToSQLTable, insertValues).then(data => {
          console.log('Added data from API', data);
        });
      }).catch(error => {

        res.status(404).send(`Something went wrong in LOCATION route ${error}`);
      });
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



client.connect().then(() => {
  console.log('Connected to DB');
  app.listen(PORT, () => {
    console.log(`Open Port ${PORT}`);
  });
}
);
