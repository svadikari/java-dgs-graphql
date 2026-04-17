import {
  createReview,
  deleteReview,
  getReviewById,
  getReviews,
  updateReview
} from "./review-repository.js";

function ensureRatingInRange(rating) {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }
}

export const resolvers = {
  Query: {
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
