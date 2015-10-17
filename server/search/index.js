/**
* Dependencies.
*/
var Joi = require('joi');
var Boom = require('boom');
var Promise = require('bluebird');

exports.register = function(server, options, next){

    var elasticsearch = Promise.promisify(server.methods.elasticsearch);

    server.route({
        method: 'GET',
        path: '/api/1/search',
        config: {
            id: 'search',
            validate: {
                query: {
                    q: Joi.string().lowercase(),
                    author: [Joi.string().lowercase(), Joi.array().items(Joi.string().lowercase())],
                    keyword: [Joi.string().lowercase(), Joi.array().items(Joi.string().lowercase())],
                    license: [Joi.string().lowercase(), Joi.array().items(Joi.string().lowercase())],
                }
            },
            handler: function(request, reply){

                elasticsearch(JSON.stringify(request.query)).spread(function(results){
                    reply(results);
                }).catch(function (error) {
                    reply(Boom.badData());
                    request.log('error', error.message);
                    console.trace(error.message);
                });

            }
        }
    });

    next();
};

exports.register.attributes = {
    name: 'search'
};
