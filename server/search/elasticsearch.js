/**
* Dependencies.
*/
var elasticsearch = require('elasticsearch');

exports.register = function(server, options, next){

    var elasticsearchClient = new elasticsearch.Client({
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
                size: 500,
                body: {
                    query: elasticsearchQuery,
                    sort: { _score: 'desc'}
                }
            }).then(function (body) {

                var response = {
                    results: []
                };

                body.hits.hits.forEach(function(item, index){
                    var result = {
                        name: item._source.name,
                        description: item._source.description,
                        version: item._source.version,
                        maintainers: item._source.maintainers,
                        author: item._source.author,
                        license: item._source.license,
                        repository: item._source.repository,
                        keywords: item._source.keywords
                    };

                    response.results.push(result);
                });

                next(null, response);

            }).catch(function(error){
                next(error);
            });

        },
        options: {
            cache: {
                expiresIn: 10000 * 10, // ten minutes
                staleIn: 7000 * 10, // 7 minutes
                staleTimeout: 100,
                generateTimeout: 10000
            }
        }
    });

    next();
};

exports.register.attributes = {
    name: 'elasticsearch-cache'
};
