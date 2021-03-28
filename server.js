//load the express module
const express = require('express');
const PORT = 3000;
// Create  aserer apllication
const app = express();

//setup a route to handle
//handle the get request to the '/' path
app.get('/', handleRequest);

//Request are handle by callbacks
//express will pass parameter to the callbacks
/*
 *req / request => All the information about the request the server receive
 * res / response => method which can be called to create and send a response to the clint
*/
const handleRequest = (request, response) => {
  console.log(request.query);
  response.send('ok');
};

app.listen(PORT, () => {
  console.log('listen from app.listen');
});
