/**
* Dependencies.
*/
var Wreck = require('wreck');
var Promise = require('bluebird');
var Redis = require('redis');

exports.register = function(server, options, next){

    Promise.promisifyAll(Redis.RedisClient.prototype);
    Promise.promisifyAll(Redis.Multi.prototype);

    var redisClient = Redis.createClient({
        host: process.env.REDIS_HOST
    });

    redisClient.on('error', function (error) {
        if (error) {
            server.log(['error', 'redis'], error);
        }
    });

    var serverMethodName = 'httpGithubCache';
    server.method({
        name: serverMethodName,
        method: function(url, next){

            var headers = {
                'User-Agent': 'NodejsHouston/npm-machete',
                Accept: 'application/vnd.github.v3+json',
                Authorization: 'token ' + process.env.GITHUB_TOKEN
            };

            var cacheKey = process.env.CACHE_NAME + ':' + encodeURIComponent('#' + serverMethodName) + ':' + encodeURIComponent(encodeURIComponent(url));

            redisClient.getAsync(cacheKey)
                .then(function(response){

                    var cache;
                    if (response) {
                        cache = JSON.parse(response);
                        headers['If-None-Match'] = cache.item.etag;
                    }

                    Wreck.get(url, {
                        headers: headers
                    }, function (err, res, payload) {
                        if (err) {
                            server.log(['error', 'wreck'], err);
                            return next(err);
                        }

                        if (res.statusCode === 304) {

                            return next(null, {
                                etag: res.headers.etag,
                                data: cache.item.data
                            });

                        } else {

                            var data = JSON.parse(payload);

                            if (Array.isArray(data)) {
                                if (data.length) {
                                    data = data.length;
                                } else {
                                    data = 0;
                                }
                            }

                            return next(null, {
                                etag: res.headers.etag,
                                data: data
                            });
                        }

                    });

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

    var httpGithubCachePromise = Promise.promisify(server.methods.httpGithubCache);

    var baseHandler = function(request, reply){
        reply(Promise.all(Promise.map(request.pre.elasticsearch, function(item){
            return httpGithubCachePromise('https://api.github.com/repos' + item.github)
                .spread(function(result){
                    return result.data;
                });
        })));
    };

    server.expose('baseHandler', baseHandler);

    var pullsHandler = function(request, reply){
        reply(Promise.all(Promise.map(request.pre.elasticsearch, function(item){
            return httpGithubCachePromise('https://api.github.com/repos' + item.github + '/pulls')
                .spread(function(result){
                    return result.data;
                });
        })));
    };

    server.expose('pullsHandler', pullsHandler);

    var commitsHandler = function(request, reply){
        reply(Promise.all(Promise.map(request.pre.elasticsearch, function(item){
            return httpGithubCachePromise('https://api.github.com/repos' + item.github + '/commits')
                .spread(function(result){
                    return result.data;
                });
        })));
    };

    server.expose('commitsHandler', commitsHandler);

    var contributorsHandler = function(request, reply){
        reply(Promise.all(Promise.map(request.pre.elasticsearch, function(item){
            return httpGithubCachePromise('https://api.github.com/repos' + item.github + '/contributors')
                .spread(function(result){
                    return result.data;
                });
        })));
    };

    server.expose('contributorsHandler', contributorsHandler);

    redisClient.once('connect', function () {
        next();
    });
};

exports.register.attributes = {
    name: 'github'
};
