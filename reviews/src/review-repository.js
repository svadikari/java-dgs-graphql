import { randomUUID } from "node:crypto";

import { pool } from "./db.js";

function mapReview(row) {
  return {
    id: row.id,
    entityId: row.entity_id,
    reviewer: row.reviewer,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at.toISOString()
  };
}

export async function getReviews(filters) {
  const whereClauses = [];
  const values = [];

  if (filters.entityId) {
    values.push(filters.entityId);
    whereClauses.push(`entity_id = $${values.length}`);
  }

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const { rows } = await pool.query({
    text: `
      SELECT id, entity_id, reviewer, rating, comment, created_at
      FROM reviews
      ${whereSql}
      ORDER BY created_at DESC
    `,
    values
  });
  return rows.map(mapReview);
}

export async function getReviewById(id) {
  const { rows } = await pool.query(
    `
      SELECT id, entity_id, reviewer, rating, comment, created_at
      FROM reviews
      WHERE id = $1
    `,
    [id]
  );

  return rows[0] ? mapReview(rows[0]) : null;
}

export async function createReview(input) {
  const review = {
    id: randomUUID(),
    entityId: input.entityId,
    reviewer: input.reviewer,
    rating: input.rating,
    comment: input.comment ?? null
  };

  const { rows } = await pool.query(
    `
      INSERT INTO reviews (id, entity_id, reviewer, rating, comment)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, entity_id, reviewer, rating, comment, created_at
    `,
    [
      review.id,
      review.entityId,
      review.reviewer,
      review.rating,
      review.comment
    ]
  );

  return mapReview(rows[0]);
}

export async function updateReview(id, input) {
  const updates = [];
  const values = [];

  if (typeof input.reviewer === "string") {
    values.push(input.reviewer);
    updates.push(`reviewer = $${values.length}`);
  }

  if (typeof input.rating === "number") {
    values.push(input.rating);
    updates.push(`rating = $${values.length}`);
  }

  if (Object.hasOwn(input, "comment")) {
    values.push(input.comment);
    updates.push(`comment = $${values.length}`);
  }

  if (updates.length === 0) {
    return getReviewById(id);
  }

  values.push(id);

  const { rows } = await pool.query(
    `
      UPDATE reviews
      SET ${updates.join(", ")}
      WHERE id = $${values.length}
      RETURNING id, entity_id, reviewer, rating, comment, created_at
    `,
    values
  );

  return rows[0] ? mapReview(rows[0]) : null;
}

export async function deleteReview(id) {
  const result = await pool.query(
    `
      DELETE FROM reviews
      WHERE id = $1
    `,
    [id]
  );

  return result.rowCount > 0;
}
