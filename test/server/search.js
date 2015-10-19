/**
 * Load Environment Variables
 */
var Dotenv = require('dotenv');
var env = process.env.NODE_ENV || 'development';
Dotenv.config({ path: './env/' + env + '/.env' });

/**
* Dependencies.
*/
var Hapi = require('hapi');
var Code = require('code');
var Lab = require('lab');

var Elasticsearch = require('../../server/search/elasticsearch');
var Github = require('../../server/search/github');
var Npm = require('../../server/search/npm');
var Search = require('../../server/search');

// Test shortcuts
var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.experiment;
var it = lab.test;
var before = lab.before;
var server;

describe('Search API', function(){

    before('Sets up plugins', function(done){

        server = new Hapi.Server();
        server.connection();

        server.register([
            {
                register: Elasticsearch
            },
            {
                register: Github
            },
            {
                register: Npm
            },
            {
                register: Search
            }
        ], function (err) {

            expect(err).to.not.exist();
            done();

        });

    });

    it('url is working', function(done) {

        var request = {
            method: 'GET',
            url: '/api/1/search'
        };

        server.inject(request, function(response){

            console.log(response.statusCode);
            expect(response.statusCode).to.equal(200);
            done();

        });

    });

    it('text search finds a framework', function(done) {

        var request = {
            method: 'GET',
            url: '/api/1/search?q=hapi'
        };

        server.inject(request, function(response){
            var payload = JSON.parse(response.payload);

            expect(response.statusCode).to.equal(200);
            expect(payload.results.length).to.be.above(0);
            expect(payload.results[0].name).to.include('hapi');

            done();

        });

    });

    it('filters by author', function(done) {

        var request = {
            method: 'GET',
            url: '/api/1/search?author=hueniverse'
        };

        server.inject(request, function(response){
            var payload = JSON.parse(response.payload);

            expect(response.statusCode).to.equal(200);
            expect(payload.results.length).to.be.above(0);
            expect(payload.results[0].author).to.include('hueniverse');

            done();

        });

    });

    it('filters by multiple authors', function(done) {

        var request = {
            method: 'GET',
            url: '/api/1/search?author=hueniverse&author=jdalton'
        };

        server.inject(request, function(response){
            var payload = JSON.parse(response.payload);

            var authors = [];
            payload.results.forEach(function(item){
                authors.push(item.author);
            });

            expect(response.statusCode).to.equal(200);
            expect(payload.results.length).to.be.above(0);
            expect(authors).to.part.include(['hueniverse', 'jdalton']);

            done();

        });

    });

    it('filters by keyword', function(done) {

        var request = {
            method: 'GET',
            url: '/api/1/search?keyword=view'
        };

        server.inject(request, function(response){
            var payload = JSON.parse(response.payload);

            var keywords = [];
            payload.results.forEach(function(item){
                keywords = keywords.concat(item.keywords);
            });

            expect(response.statusCode).to.equal(200);
            expect(payload.results.length).to.be.above(0);
            expect(keywords).to.include('view');

            done();

        });

    });

    it('filters by multiple keywords', function(done) {

        var request = {
            method: 'GET',
            url: '/api/1/search?keyword=view&keyword=http'
        };

        server.inject(request, function(response){
            var payload = JSON.parse(response.payload);

            var keywords = [];
            payload.results.forEach(function(item){
                keywords = keywords.concat(item.keywords);
            });

            expect(response.statusCode).to.equal(200);
            expect(payload.results.length).to.be.above(0);
            expect(keywords).to.part.include(['view', 'http']);

            done();

        });

    });

    it('filters by license', function(done) {

        var request = {
            method: 'GET',
            url: '/api/1/search?license=MIT'
        };

        server.inject(request, function(response){
            var payload = JSON.parse(response.payload);

            expect(response.statusCode).to.equal(200);
            expect(payload.results.length).to.be.above(0);
            expect(payload.results[0].license).to.include('MIT');

            done();

        });

    });

    it('filters by multiple licenses', function(done) {

        var request = {
            method: 'GET',
            url: '/api/1/search?license=MIT&license=Apache'
        };

        server.inject(request, function(response){
            var payload = JSON.parse(response.payload);

            var licenses = [];
            payload.results.forEach(function(item){
                licenses = licenses.concat(item.license);
            });

            expect(response.statusCode).to.equal(200);
            expect(payload.results.length).to.be.above(0);
            expect(licenses).to.part.include(['MIT', 'BSD']);

            done();

        });

    });

    it('shows github info', function(done) {

        var request = {
            method: 'GET',
            url: '/api/1/search?q=hapi'
        };

        server.inject(request, function(response){
            var payload = JSON.parse(response.payload);

            expect(response.statusCode).to.equal(200);
            expect(payload.results.length).to.be.above(0);
            expect(payload.results[0].meta.age).to.exist();
            expect(payload.results[0].meta.commitLast).to.exist();
            expect(payload.results[0].meta.forks).to.exist();
            expect(payload.results[0].meta.issuesOpen).to.exist();
            expect(payload.results[0].meta.issuesQuantiy).to.exist();
            expect(payload.results[0].meta.stars).to.exist();
            expect(payload.results[0].meta.watchers).to.exist();
            expect(payload.results[0].meta.contributors).to.exist();
            expect(payload.results[0].meta.commitsQuantity).to.exist();
            expect(payload.results[0].meta.issuesOpen).to.exist();
            expect(payload.results[0].meta.pullRequestsOpen).to.exist();

            done();

        });

    });

    it('shows npm download info', function(done) {

        var request = {
            method: 'GET',
            url: '/api/1/search?q=hapi'
        };

        server.inject(request, function(response){
            var payload = JSON.parse(response.payload);

            expect(response.statusCode).to.equal(200);
            expect(payload.results.length).to.be.above(0);
            expect(payload.results[0].meta.downloadsDay).to.exist();
            expect(payload.results[0].meta.downloadsWeek).to.exist();
            expect(payload.results[0].meta.downloadsMonth).to.exist();

            done();

        });

    });

});
