# npm-machete
npm-machete is an npm registry search tool. When a search is performed against machete it will run a full text search against all public packages in the registry, searching the full body of the package.json file. This differs from a standard search at npmjs.org in that the body of readme.md is indexed and searched as well as the fields in the package.json.

npm-machete can be queried in a number of ways:

 1. An API over http
 1. A web page at http://npm-machete.com
 1. A CLI that is installed globally via npm
 1. A browser plugin that augments npm search results.

The API is our first class interface and the other methods are clients of that API.

## Backend Technologies
We will be using a locally hosted clone of the npm registry, sans attachments. That registry will be piped into Elasticsearch. The Elasticsearch index will be augmented with readme's from the package when they exist.

We will be using the hapi.js framework. We expect hapi to handle routing and caching of http requests to external resources (npm, github, etc).

## Scoring Results
Initially results will be scored with a predefined algorithm known as the "machete score". In later iterations of npm-machete we will add the ability for users to customize the algorithm used to arrive at a score, including a number of presets to match common use cases.

## resources

**npmsearch** - This [repo](https://github.com/solids/npmsearch) is the code that drives [http://npmsearch.com/](http://npmsearch.com/). They have already solved some of the problems we are facing such as piping registry data into Elasticsearch.

**Elasticsearch** - Real time search with analytics capabilities. [https://www.elastic.co/products/elasticsearch](https://www.elastic.co/products/elasticsearch).

**hapi.js** - Our framework of choice for routing and caching http requests [http://hapijs.com/](http://hapijs.com/).

**Crossrider** - Tools for creating extensions that work in all browsers [http://crossrider.com/developers](http://crossrider.com/developers)
