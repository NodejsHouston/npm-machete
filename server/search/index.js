/**
* Dependencies.
*/
var Joi = require('joi');

exports.register = function(server, options, next){

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
            pre: [
                { assign: 'elasticsearch', method: server.plugins.elasticsearch.handler },
                [
                //     // Executed in parallel
                    { assign: 'githubBase', method: server.plugins.github.baseHandler },
                    { assign: 'githubPulls', method: server.plugins.github.pullsHandler },
                    { assign: 'githubCommits', method: server.plugins.github.commitsHandler },
                    { assign: 'githubContributors', method: server.plugins.github.contributorsHandler },
                    { assign: 'npmDownloadsDay', method: server.plugins.npm.downloadsDayHandler },
                    { assign: 'npmDownloadsWeek', method: server.plugins.npm.downloadsWeekHandler },
                    { assign: 'npmDownloadsMonth', method: server.plugins.npm.downloadsMonthHandler }
                ]
            ],
            handler: function(request, reply){

                var pre = request.pre;

                var results = pre.elasticsearch.map(function(item, i){

                    item.downloadsDay = pre.npmDownloadsDay[i] || 0;
                    item.downloadsWeek = pre.npmDownloadsWeek[i] || 0;
                    item.downloadsMonth = pre.npmDownloadsMonth[i] || 0;
                    item.stars = pre.elasticsearch[i].stars || 0;

                    item.github = {
                        repo: item.github || null,
                        age: pre.githubBase[i].created_at || null,
                        commitLast: pre.githubBase[i].updated_at || null,
                        contributors: pre.githubContributors[i] || 0,
                        commitsQuantity: pre.githubCommits[i] || 0,
                        forks: pre.githubBase[i].forks_count || 0,
                        issuesOpen: pre.githubBase[i].open_issues - pre.githubPulls[i] || 0,
                        issuesQuantiy: pre.githubBase[i].open_issues || 0,
                        pullRequestsOpen: pre.githubPulls[i] || 0,
                        stars: pre.githubBase[i].stargazers_count || 0,
                        watchers: pre.githubBase[i].subscribers_count || 0
                    };

                    return item;

                });

                reply({results: results});

            }
        }
    });

    next();
};

exports.register.attributes = {
    name: 'search'
};
