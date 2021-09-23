# Zesttee Setup Guide

## Tools we use

- Api use nodejs and hapi framework (https://hapi.dev/tutorials/?lang=en_US)
- Use joi for validation (https://github.com/hapijs/joi)
- Log rotation and log management using [Bunyan](https://github.com/trentm/node-bunyan)
- A super small and optimized [Docker](https://www.docker.com/) image based on Alpine image
- [Swagger](https://swagger.io/) API documentation based on JSDoc
- Continuous integration and delivery using [CircleCI](https://circleci.com/)
- Unit Test and Integration Test along with Mocha and Coverage using [Jest](https://facebook.github.io/jest/) testing framework

---

## Getting Started

```zsh
$ yarn
$ yarn start
```

## Commands

### Run

```zsh
# Setup postgresdb
# Run normally
$ yarn start
# Run the application with nodemon for development
$ yarn dev
```

### Use docker for development

```zsh
$ Install docker
$ Run docker-compose -f docker-compose.dev.yml build to build local docker project
$ Run docker-compose -f docker-compose.yml build up make docker run the stack
$ Run docker exec -it node-server bash to enter the node console
$ In it enter any command to run migration(npm run migrate, npm run seed, npm run rollback)
```

### Test

```zsh
# Test
$ yarn test                           # Run all test
$ yarn test:unit                      # Run only unit test
$ yarn test:integration               # Run only integration test
# Test (Watch Mode for development)
$ yarn test:watch                     # Run all test with watch mode
$ yarn test:watch:unit                # Run only unit test with watch mode
$ yarn test:watch:integration         # Run only integration test with watch mode
# Test Coverage
$ yarn test:coverage                  # Calculate the coverage of all test
$ yarn test:coverage:unit             # Calculate the coverage of unit test
$ yarn test:coverage:integration      # Calculate the coverage of integration test
# Test consistent coding style (Lint)
$ yarn lint                           # Lint all sourcecode
$ yarn lint:app                       # Lint app sourcecode
$ yarn lint:test                      # Lint test sourcecode
```

### Archive

```zsh
$ yarn pack
```

### Basic api query use for getAll resources. Only support normal query if need complex or advanced use cases (fulltextsearch, geolocation...) contact server developers to support more.

```zsh
$ Paginate with limit and offset. Ex: ?limit=5&offset=5
$ Order by fields and order reverse use prefix "-". Ex: ?orderBy=age,-name
$ Include other relate models(rare case caution on use). Ex: users?includes=books (user has many books)
$ Select field on query (Only use in single models). Ex: ?fields=age,name
$ Filter equal ?filter={"name": "Alex"}
$ Filter less than ?filter={"age": {"$lt": 40}}
$ Filter greater than ?filter={"age": {"$gt": 20}}
$ Filter less than and equal ?filter={"age": {"$lte": 40}}
$ Filter greater than equal ?filter={"age": {"$gte": 20}}
$ Filter field in many choice ?filter={"name": {"$in": ["Alex", "Doan"]}}
$ Filter array field is subset of parent array ?filter={"tags": {"$all": ["Tag1", "Tag2"]}}
```
