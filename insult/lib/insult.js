'use strict';

const bodyParser = require('body-parser');
const nounService = require('./noun-service');
const adjectiveService = require('./adjective-service');
const client = require('prom-client');

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({prefix: 'insult_'});
const durationMetric = new client.Histogram({
  name: 'duration',
  help: 'HTTP request response duration',
  buckets: [0.1, 5, 15, 50, 100, 500]
});

function get (req, res) {
  res.type('application/json');
  buildInsult()
    .then(insult => res.send(insult))
    .catch(error => {
      console.error(error.toString());
      console.error(error.stack);
      res.send({ error: error.toString() });
    });
}

function post (req, res) {
  res.type('application/json');
  buildInsult()
    .then(insult => Object.assign({ name: req.body.name }, insult))
    .then(insult => { res.status(201); res.send(insult); })
    .catch(error => {
      console.error(error.toString());
      console.error(error.stack);
      res.send({ error: error.toString() });
    });
}

function buildInsult () {
  const end = durationMetric.startTimer();
  // call adjective and noun services
  return Promise.all([
    adjectiveService.get(),
    adjectiveService.get(),
    nounService.get()
  ])
    .then(words => ({
      adj1: words[0],
      adj2: words[1],
      noun: words[2]
    }))
    .catch(e => console.error(`An unexpected error occurred: ${e}`))
    .finally(end);
}

module.exports = exports = function insultApi (router) {
  router.use(bodyParser.json());
  router.get('/insult', get);
  router.post('/insult', post);
  return router;
};
