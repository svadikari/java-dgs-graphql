export const typeDefs = `#graphql
  type Review {
    id: ID!
    entityId: ID!
    reviewer: String!
    rating: Int!
    comment: String
    createdAt: String!
  }

  input AddReviewInput {
    entityId: ID!
    reviewer: String!
    rating: Int! = 1
    comment: String
  }

  input UpdateReviewInput {
    reviewer: String
    rating: Int
    comment: String
  }

  type Query {
    reviews(entityId: ID): [Review!]!
    review(id: ID!): Review
  }

  type Mutation {
    addReview(input: AddReviewInput!): Review!
    updateReview(id: ID!, input: UpdateReviewInput!): Review!
    deleteReview(id: ID!): Boolean!
  }
`;
