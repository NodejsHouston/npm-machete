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
                    // Executed in parallel
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

                    item.downloadsDay = pre.npmDownloadsDay[i] || pre.npmDownloadsDay[i] === 0 ? pre.npmDownloadsDay[i] : null;
                    item.downloadsWeek = pre.npmDownloadsWeek[i] || pre.npmDownloadsWeek[i] === 0 ? pre.npmDownloadsWeek[i] : null;
                    item.downloadsMonth = pre.npmDownloadsMonth[i] || pre.npmDownloadsMonth[i] === 0 ? pre.npmDownloadsMonth[i] : null;
                    item.stars = pre.elasticsearch[i].stars || pre.elasticsearch[i].stars === 0 ? pre.elasticsearch[i].stars : null;

                    item.github = {
                        repo: item.github || null,
                        age: pre.githubBase[i].created_at || null,
                        commitLast: pre.githubBase[i].updated_at || null,
                        contributors: pre.githubContributors[i] || pre.githubContributors[i] === 0 ? pre.githubContributors[i] : null,
                        commitsQuantity: pre.githubCommits[i] || pre.githubCommits[i] === 0 ? pre.githubCommits[i] : null,
                        forks: pre.githubBase[i].forks_count || pre.githubBase[i].forks_count === 0 ? pre.githubBase[i].forks_count : null,
                        issuesOpen: pre.githubBase[i].open_issues - pre.githubPulls[i] || null,
                        issuesQuantiy: pre.githubBase[i].open_issues || pre.githubBase[i].open_issues === 0 ? pre.githubBase[i].open_issues : null,
                        pullRequestsOpen: pre.githubPulls[i] || pre.githubPulls[i] === 0 ? pre.githubPulls[i] : null,
                        stars: pre.githubBase[i].stargazers_count || pre.githubBase[i].stargazers_count === 0 ? pre.githubBase[i].stargazers_count : null,
                        watchers: pre.githubBase[i].subscribers_count || pre.githubBase[i].subscribers_count === 0 ? pre.githubBase[i].subscribers_count : null
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
