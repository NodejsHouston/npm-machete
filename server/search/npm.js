/**
* Dependencies.
*/
var Wreck = require('wreck');
var Promise = require('bluebird');

exports.register = function(server, options, next){

    server.method({
        name: 'httpNpmCache',
        method: function (url, next) {

            Wreck.get(url, function (err, res, payload) {
                if (err) {
                    server.log(['error', 'wreck'], err);
                    return next(err);
                }

                return next(null, JSON.parse(payload));
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

    var httpNpmCachePromise = Promise.promisify(server.methods.httpNpmCache);

    var downloadsDayHandler = function(request, reply){
        reply(Promise.all(Promise.map(request.pre.elasticsearch, function(item){
            return httpNpmCachePromise('https://api.npmjs.org/downloads/point/last-day/' + item.name)
            .spread(function(result){
                if (result.error === 'no stats for this package for this period (0002)') {
                    return 0;
                }
                return result.downloads;
            });
        })));
    };

    server.expose('downloadsDayHandler', downloadsDayHandler);

    var downloadsWeekHandler = function(request, reply){
        reply(Promise.all(Promise.map(request.pre.elasticsearch, function(item){
            return httpNpmCachePromise('https://api.npmjs.org/downloads/point/last-week/' + item.name)
            .spread(function(result){
                if (result.error === 'no stats for this package for this period (0002)') {
                    return 0;
                }
                return result.downloads;
            });
        })));
    };

    server.expose('downloadsWeekHandler', downloadsWeekHandler);

    var downloadsMonthHandler = function(request, reply){
        reply(Promise.all(Promise.map(request.pre.elasticsearch, function(item){
            return httpNpmCachePromise('https://api.npmjs.org/downloads/point/last-month/' + item.name)
            .spread(function(result){
                if (result.error === 'no stats for this package for this period (0002)') {
                    return 0;
                }
                return result.downloads;
            });
        })));
    };

    server.expose('downloadsMonthHandler', downloadsMonthHandler);

    next();
};

exports.register.attributes = {
    name: 'npm'
};
