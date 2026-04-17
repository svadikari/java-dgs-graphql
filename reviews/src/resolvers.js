import { GraphQLScalarType, Kind } from "graphql";

import {
  createReview,
  deleteReview,
  getReviewById,
  getReviews,
  updateReview
} from "./review-repository.js";
import { subgraphSdl } from "./schema.js";

function ensureRatingInRange(rating) {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }
}

function parseAnyLiteral(ast) {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
    case Kind.ENUM:
      return ast.value;
    case Kind.INT:
      return Number.parseInt(ast.value, 10);
    case Kind.FLOAT:
      return Number.parseFloat(ast.value);
    case Kind.NULL:
      return null;
    case Kind.LIST:
      return ast.values.map(parseAnyLiteral);
    case Kind.OBJECT:
      return Object.fromEntries(
        ast.fields.map((field) => [field.name.value, parseAnyLiteral(field.value)])
      );
    default:
      return null;
  }
}

const anyScalar = new GraphQLScalarType({
  name: "_Any",
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: parseAnyLiteral
});

export const resolvers = {
  _Any: anyScalar,
  _Entity: {
    __resolveType(entity) {
      return entity?.id ? "Review" : null;
    }
  },
  Query: {
    _service: () => ({ sdl: subgraphSdl }),
    _entities: async (_, { representations }) =>
      Promise.all(
        representations.map(async (representation) => {
          if (representation?.__typename !== "Review" || !representation.id) {
            return null;
          }

          return getReviewById(String(representation.id));
        })
      ),
    reviews: async (_, { entityId }) => getReviews({ entityId }),
    review: async (_, { id }) => getReviewById(id)
  },
  Mutation: {
    addReview: async (_, { input }) => {
      ensureRatingInRange(input.rating);
      return createReview(input);
    },
    updateReview: async (_, { id, input }) => {
      if (typeof input.rating === "number") {
        ensureRatingInRange(input.rating);
      }

      const review = await updateReview(id, input);

      if (!review) {
        throw new Error(`Review ${id} was not found.`);
      }

      return review;
    },
    deleteReview: async (_, { id }) => deleteReview(id)
  }
};
