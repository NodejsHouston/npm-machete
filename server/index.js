/**
 * Load Environment Variables
 */
var Dotenv = require('dotenv');
var env = process.env.NODE_ENV || 'development';
Dotenv.config({ path: './env/' + env + '/.env' });

/**
* Dependencies.
*/
var Hapi = require('hapi');
var Good = require('good');
var GoodConsole = require('good-console');
var Boom = require('boom');
var Search = require('./search');
var Elasticsearch = require('./search/elasticsearch');
var Github = require('./search/github');
var Npm = require('./search/npm');

// Create a new server
var server = new Hapi.Server();

// Setup the server with a host and port
server.connection({
    port: parseInt(process.env.PORT, 10) || 3000,
    host: '0.0.0.0',
    router: {
        stripTrailingSlash: true
    }
});

server.route({
    method: 'GET',
    path: '/{path}',
    config: {
        handler: function(request, reply){
            reply(Boom.notFound());
        }
    }
});

/*
    Load all plugins and then start the server.
    First: community/npm plugins are loaded
    Second: project specific plugins are loaded
 */
server.register([
    {
        register: Good,
        options: {
            reporters: [{
                reporter: GoodConsole,
                events: { ops: '*', request: '*', log: '*', response: '*', 'error': '*' }
            }]
        }
    },
    {
        register: Elasticsearch
    },
    {
        register: Github
    },
    {
        register: Npm
    },
    {
        register: Search
    }
], function () {
    //Start the server
    server.start(function() {
        //Log to the console the host and port info
        console.log('Server started at: ' + server.info.uri);
    });
});
