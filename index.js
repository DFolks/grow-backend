'use strict';

const express = require('express');
const request = require('request');
const rp = require('request-promise');

const app = express();
const morgan = require('morgan');
app.use(express.static('public'));

app.use(express.json());
app.use(morgan('dev'));

app.get('/api/people', (req, res, next) => {
  const { sortBy } = req.query;
  let people = [];
  let nextPage = 'https://swapi.co/api/people';
  function paginate(nextPage) {
    if (nextPage === null) {
      if (sortBy === 'name') {
        people.sort((a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0));
      } else if (sortBy === 'height') {
        people.sort((a, b) =>
          a.height > b.height ? 1 : b.height > a.height ? -1 : 0
        );
      } else if (sortBy === 'mass') {
        people.sort((a, b) => (a.mass > b.mass ? 1 : b.mass > a.mass ? -1 : 0));
      } else {
        console.log(people.length);
      }
      return res.json(people);
    } else {
      request(nextPage, { json: true }, function(error, response, body) {
        if (!error && response.statusCode === 200) {
          nextPage = body.next;
          people = [...people, ...body.results];
          paginate(nextPage);
        }
      });
    }
  }
  paginate(nextPage);
});

app.get('/api/planets', (req, res, next) => {
  let planets = [];
  let nextPage = 'https://swapi.co/api/planets';
  let residentList;
  async function paginatePlanets(nextPage) {
    if (nextPage === null) {
      for (let i = 0; i < planets.length; i++) {
        residentList = await planets[i].residents.map(async url => {
          let name;
          let options = {
            uri: url,
            json: true
          };
          return rp(options).then(res => {
            name = res.name;
            return name;
          });
        });
        await Promise.all(residentList).then(list => {
          planets[i].residents = list;
        });
      }
      return res.json(planets);
    } else {
      request(nextPage, { json: true }, function(error, response, body) {
        if (!error && response.statusCode === 200) {
          nextPage = body.next;
          planets = [...planets, ...body.results];
          paginatePlanets(nextPage);
        }
      });
    }
  }
  paginatePlanets(nextPage);
});

app
  .listen(8080, function() {
    console.info(`Server listening on ${this.address().port}`);
  })
  .on('error', err => console.error(err));
