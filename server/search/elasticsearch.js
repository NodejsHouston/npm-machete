/**
* Dependencies.
*/
var Elasticsearch = require('elasticsearch');
var Boom = require('boom');
var Promise = require('bluebird');
var ParseGitUrl = require('github-url-from-git');

exports.register = function(server, options, next){

    var elasticsearchClient = new Elasticsearch.Client({
        host: process.env.ELASTICSEARCH_URL
    });

    server.method({name: 'elasticsearch',
        method: function (requestQuery, next) {

            requestQuery = JSON.parse(requestQuery);

            var query = requestQuery.q;
            var author = requestQuery.author;
            var keyword = requestQuery.keyword;
            var license = requestQuery.license;

            var elasticsearchQuery = {
                filtered: {
                }
            };

            if (query) {
                elasticsearchQuery.filtered.query = {
                    'multi_match': {
                        query: query,
                        fields: ['name', 'description', 'readme', 'keywords']
                    }
                };
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
                index: 'npm',
                size: process.env.RESULTSIZE,
                body: {
                    query: elasticsearchQuery,
                    sort: { _score: 'desc'}
                }
            }).then(function (body) {

                var results = [];

                body.hits.hits.forEach(function(item, index){

                    var githubFullUrl = ParseGitUrl(item._source.repository) || ''; // 'https://github.com/username/repo'
                    var githubUserAndRepo = githubFullUrl.replace(/https:\/\/github.com/g, ''); // '/username/repo'

                    var result = {
                        _score: {
                            text: item._score
                        },
                        name: item._source.name,
                        description: item._source.description,
                        version: item._source.version,
                        author: item._source.author,
                        license: item._source.license,
                        github: githubUserAndRepo,
                        keywords: item._source.keywords,
                        stars: item._source.stars
                    };

                    results.push(result);
                });

                next(null, results);

            }).catch(function(error){
                next(error);
            });

        },
        options: {
            cache: {
                expiresIn: 36 * 60 * 60 * 1000, // 36 hours
                staleIn: 22 * 60 * 60 * 1000, // 22 hours
                staleTimeout: 100,
                generateTimeout: 10000
            }
        }
    });

    var elasticsearchPromise = Promise.promisify(server.methods.elasticsearch);

    server.expose('handler', function(request, reply){

        elasticsearchPromise(JSON.stringify(request.query)).spread(function(results){
            reply(results);
        }).catch(function (error) {
            reply(Boom.badData());
            request.log('error', error.message);
        });

    });

    next();
};

exports.register.attributes = {
    name: 'elasticsearch'
};
