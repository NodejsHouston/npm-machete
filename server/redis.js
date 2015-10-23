/**
* Dependencies.
*/
var Promise = require('bluebird');
var Redis = require('redis');


exports.register = function(server, options, next){

    Promise.promisifyAll(Redis.RedisClient.prototype);
    Promise.promisifyAll(Redis.Multi.prototype);

    var client = Redis.createClient({
        host: '127.0.0.1'
    });


    client.on('error', function (error) {
        if (error) {
            server.log(['error', 'redis'], error);
        }
    });

    client.once('connect', function () {
        server.expose('client', client);
        next();
    });

};

exports.register.attributes = {
    name: 'redis'
};
