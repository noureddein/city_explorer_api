//load the express module
const express = require('express');
const PORT = 3000;
// Create  aserer apllication
const app = express();



//Request are handle by callbacks
//express will pass parameter to the callbacks
/*
 *req / request => All the information about the request the server receive
 * res / response => method which can be called to create and send a response to the clint
*/
const handleRequest = (request, response) => {
  console.log(request.query);
  response.send('<h1>About<h1>');
};


//setup a route to handle
//handle the get request to the '/' path
//call the handle function
app.get('/about', handleRequest);

app.get('/locations', (req, res) => {
  const locations = require('./data/location.json');
  // console.log(req);
  res.json(locations);

});




app.listen(PORT, () => {
  console.log('listen from app.listen');
});
