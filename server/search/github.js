/**
* Dependencies.
*/
var Wreck = require('wreck');
var Promise = require('bluebird');

exports.register = function(server, options, next){

    var httpGithubCache = server.cache({
        expiresIn: 36 * 60 * 60 * 1000, // 36 hours
        staleIn: 22 * 60 * 60 * 1000, // 22 hours
        staleTimeout: 100,
        generateTimeout: 30000,
        segment: 'github',
        generateFunc: function (id, next) {

            var httpGithubRequest = function (url, next) {

                Wreck.get(url, {
                    headers: {
                        'User-Agent': 'NodejsHouston/npm-machete',
                        Accept: 'application/vnd.github.v3+json',
                        Authorization: 'token ' + process.env.GITHUBTOKEN
                    }
                }, function (err, res, payload) {
                    if (err) {
                        server.log(['error', 'wreck'], err);
                        return next(err);
                    }

                    return next(null, JSON.parse(payload));
                });

            };

            httpGithubRequest(id.url, next);
        }
    });

    server.method({
        name: 'httpGithubCache',
        method: function(url, next){

            httpGithubCache.get({
                id: url,
                url: url
            },
            function (error, result, cached, log) {
                if (error) {
                    server.log(['error', 'wreck'], error);
                    return next(error);
                }

                return next(null, result, cached, log);
            });

        }
    });

    var httpGithubCachePromise = Promise.promisify(server.methods.httpGithubCache);

    var baseHandler = function(request, reply){
        reply(Promise.all(Promise.map(request.pre.elasticsearch, function(item){
            return httpGithubCachePromise('https://api.github.com/repos' + item.github)
                .spread(function(result){
                    return result;
                });
        })));
    };

    server.expose('baseHandler', baseHandler);

    var pullsHandler = function(request, reply){
        reply(Promise.all(Promise.map(request.pre.elasticsearch, function(item){
            return httpGithubCachePromise('https://api.github.com/repos' + item.github + '/pulls')
                .spread(function(result){
                    return result.length;
                });
        })));
    };

    server.expose('pullsHandler', pullsHandler);

    var commitsHandler = function(request, reply){
        reply(Promise.all(Promise.map(request.pre.elasticsearch, function(item){
            return httpGithubCachePromise('https://api.github.com/repos' + item.github + '/commits')
                .spread(function(result){
                    return result.length;
                });
        })));
    };

    server.expose('commitsHandler', commitsHandler);

    var contributorsHandler = function(request, reply){
        reply(Promise.all(Promise.map(request.pre.elasticsearch, function(item){
            return httpGithubCachePromise('https://api.github.com/repos' + item.github + '/contributors')
                .spread(function(result){
                    return result.length;
                });
        })));
    };

    server.expose('contributorsHandler', contributorsHandler);

    next();
};

exports.register.attributes = {
    name: 'github'
};
