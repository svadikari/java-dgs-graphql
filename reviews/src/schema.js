const federationDirective = `
  directive @key(fields: String!) repeatable on OBJECT | INTERFACE
`;

const reviewType = `
  type Review @key(fields: "id") {
    id: ID!
    entityId: ID!
    reviewer: String!
    rating: Int!
    comment: String
    createdAt: String!
  }
`;

const addReviewInput = `
  input AddReviewInput {
    entityId: ID!
    reviewer: String!
    rating: Int! = 1
    comment: String
  }
`;

const updateReviewInput = `
  input UpdateReviewInput {
    reviewer: String
    rating: Int
    comment: String
  }
`;

const mutationType = `
  type Mutation {
    addReview(input: AddReviewInput!): Review!
    updateReview(id: ID!, input: UpdateReviewInput!): Review!
    deleteReview(id: ID!): Boolean!
  }
`;

export const subgraphSdl = `#graphql
${federationDirective}

${reviewType}

${addReviewInput}

${updateReviewInput}

  type Query {
    reviews(entityId: ID): [Review!]!
    review(id: ID!): Review
  }

${mutationType}
`;

export const typeDefs = `#graphql
${federationDirective}

  scalar _Any

  union _Entity = Review

  type _Service {
    sdl: String!
  }

${reviewType}

${addReviewInput}

${updateReviewInput}

  type Query {
    _service: _Service!
    _entities(representations: [_Any!]!): [_Entity]!
    reviews(entityId: ID): [Review!]!
    review(id: ID!): Review
  }

${mutationType}
`;
