/**
* Dependencies.
*/
var Joi = require('joi');
var Boom = require('boom');
var elasticsearch = require('elasticsearch');

exports.register = function(server, options, next){

    var elasticsearchClient = new elasticsearch.Client({
        host: process.env.ELASTICSEARCH_URL
    });

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

                var query = request.query.q;
                var author = request.query.author;
                var keyword = request.query.keyword;
                var license = request.query.license;

                var elasticsearchQuery = {
                    filtered: {
                    }
                };

                if (query) {
                    elasticsearchQuery.filtered.query = {
                        multi_match: {
                            query: request.query.q,
                            fields: ['name', 'description', 'readme', 'keywords']
                        }
                    }
                }

                if (author || keyword || license) {

                    elasticsearchQuery.filtered.filter = {
                        and: [
                        ]
                    };

                    var filters = elasticsearchQuery.filtered.filter.and;

                    if (author) {
                        var authors = [].concat(author);
                        if (authors.length > 1) {
                            filters.push({ terms: { author: authors } });
                        } else {
                            filters.push({ term: { author: authors[0] } });
                        }
                    }

                    if (keyword) {
                        var keywords = [].concat(keyword);
                        if (keywords.length > 1) {
                            filters.push({ terms: { keywords: keywords } });
                        } else {
                            filters.push({ term: { keywords: keywords[0] } });
                        }
                    }

                    if (license) {
                        var licenses = [].concat(license);
                        if (licenses.length > 1) {
                            filters.push({ terms: { license: licenses } });
                        } else {
                            filters.push({ term: { license: licenses[0] } });
                        }
                    }

                }

                elasticsearchClient.search({
                    index: 'npmmachete',
                    size: 100,
                    body: {
                        query: elasticsearchQuery,
                        sort: { _score: 'desc'}
                    }
                }).then(function (body) {

                    var response = {
                        results: []
                    };

                    body.hits.hits.forEach(function(item, index){
                        response.results.push(item._source);
                    });

                    reply(response);

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
