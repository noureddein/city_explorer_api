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
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;
const YELP_API_KEY = process.env.YELP_API_KEY;

//Route Definitions
app.get('/', welcomeHomePage);
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/parks', parksHandler);
app.get('/movies', movieHandler);
app.get('/yelp', yelpHandler);
app.get('*', errorHandler);

//----------------------------------------------

//Location Handler

function welcomeHomePage(req, res) {
  res.status(200).send('Welcome To My Home Page :)');
}

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

//Movie Handler function

function movieHandler(req, res) {
  const city = req.query.search_query;
  console.log(city);
  const url = 'https://api.themoviedb.org/3/movie/top_rated';
  let queryValues = {
    query: city,
    api_key: MOVIE_API_KEY,
  };
  superAgent.get(url, queryValues).then(dataBack => {
    const data = dataBack.body.results;
    let resData = data.map(item => new Movies(item));
    res.send(resData);
  }).catch(error => res.status(500).send(`Something went wrong ${error}`));
}

//constructor Function
function Movies(data) {
  this.title = data.title;
  this.overview = data.overview;
  this.average_votes = data.vote_average;
  this.total_votes = data.vote_count;
  this.image_url = 'https://image.tmdb.org/t/p/w500' + data.poster_path;
  this.popularity = data.popularity;
  this.released_on = data.release_da;

}

//---------------------------------------------------------

/*
[
  {
    "name": "Pike Place Chowder",
    "image_url": "https://s3-media3.fl.yelpcdn.com/bphoto/ijju-wYoRAxWjHPTCxyQGQ/o.jpg",
    "price": "$$   ",
    "rating": "4.5",
    "url": "https://www.yelp.com/biz/pike-place-chowder-seattle?adjust_creative=uK0rfzqjBmWNj6-d3ujNVA&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=uK0rfzqjBmWNj6-d3ujNVA"
  },
  {
    "name": "Umi Sake House",
    "image_url": "https://s3-media3.fl.yelpcdn.com/bphoto/c-XwgpadB530bjPUAL7oFw/o.jpg",
    "price": "$$   ",
    "rating": "4.0",
    "url": "https://www.yelp.com/biz/umi-sake-house-seattle?adjust_creative=uK0rfzqjBmWNj6-d3ujNVA&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=uK0rfzqjBmWNj6-d3ujNVA"
  },
]

*/


//Yelp Handler Function
function yelpHandler(req, res) {
  const city = req.query.search_query;
  const url = 'https://api.yelp.com/v3/businesses/search';
  const yelpValues = {
    location: city,
    term: 'restaurants'
  };
  console.log(yelpValues);

  superAgent.get(url, yelpValues).set('Authorization', `Bearer ${YELP_API_KEY}`).then(dataBack => {
    let apiData = dataBack.body.businesses;
    let data = [];
    for (let i = 1; i <= 5; i++) {
      data.push(new Yelp(apiData[i]));
    }
    res.status(200).send(data);

  }).catch((error => {
    res.status(404).send(`Something went wrong ${error}`);

  }));
}
//Constructor Function

function Yelp(data) {
  this.name = data.name;
  this.image_url = data.image_url;
  this.price = data.price;
  this.rating = data.rating;
  this.url = data.url;
}




//----------------------------------------------------------

//Error Handler function
function errorHandler(req, res) {
  res.status(500).send('Sorry, something went wrong');
}

//----------------------------------------------------------





client.connect().then(() => {
  console.log('Connected to DB');
  app.listen(PORT, () => {
    console.log(`Open Port ${PORT}`);
  });
}
);
