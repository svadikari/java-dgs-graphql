const { ApolloServer } = require('apollo-server');
const {ApolloGateway, IntrospectAndCompose} = require('@apollo/gateway')

const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
        subgraphs: [
            { name: 'books', url: 'http://localhost:4001/graphql' },
            { name: 'reviews', url: 'http://localhost:4003/' },
            { name: 'users', url: 'http://localhost:4002/graphql' },
        ]
    })
});

const server = new ApolloServer({ gateway, subscriptions:false, tracing:true });
server.listen().then(r => console.log(`Server listening on port ${r.port}`));