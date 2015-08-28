var Joi = require('joi');

exports.register = function(server, options, next){

    server.route({
        method: 'GET',
        path: '/search',
        config: {
            id: 'search',
            validate: {
                query: {
                    q: Joi.string(),
                    author: [Joi.string(), Joi.array(Joi.string())],
                    keywords: [Joi.string(), Joi.array(Joi.string())],
                    license: Joi.string(),
                    weights: Joi.object().keys({
                        age: Joi.number().integer().min(0).max(10).default(5), // GITHUB https://api.github.com/repos/user/repo created_at
                        commitLast: Joi.number().integer().min(0).max(10).default(5), // GITHUB https://api.github.com/repos/user/repo updated_at
                        commitsPerContributor: Joi.number().integer().min(0).max(10).default(5),
                        commitsQuantity: Joi.number().integer().min(0).max(10).default(5),
                        dependencies: Joi.number().integer().min(0).max(10).default(5),
                        dependents: Joi.number().integer().min(0).max(10).default(5),
                        downloadsDay: Joi.number().integer().min(0).max(10).default(5),
                        downloadsMonth: Joi.number().integer().min(0).max(10).default(5),
                        downloadsWeek: Joi.number().integer().min(0).max(10).default(5),
                        forks: Joi.number().integer().min(0).max(10).default(5), // GITHUB https://api.github.com/repos/user/repo forks
                        issuesOpen: Joi.number().integer().min(0).max(10).default(5), // GITHUIB https://api.github.com/repos/user/repo open_issues_count
                        issuesQuantiy: Joi.number().integer().min(0).max(10).default(5),
                        issuesResponseTime: Joi.number().integer().min(0).max(10).default(5),
                        issuesThreadLength: Joi.number().integer().min(0).max(10).default(5),
                        pullRequestsOpen: Joi.number().integer().min(0).max(10).default(5),
                        releases: Joi.number().integer().min(0).max(10).default(5),
                        stars: Joi.number().integer().min(0).max(10).default(5), // GITHUB https://api.github.com/repos/user/repo stargazers_count
                        tests: Joi.number().integer().min(0).max(10).default(5),
                        watchers: Joi.number().integer().min(0).max(10).default(5) // GITHUB https://api.github.com/repos/user/repo subscribers_count
                    })
                }
            },
            handler: function(request, reply){
                reply(request.query);
            }
        }
    });

    next();
};

exports.register.attributes = {
    name: 'search'
};
