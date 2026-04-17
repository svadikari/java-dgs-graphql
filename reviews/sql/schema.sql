CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  reviewer TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS entity_id TEXT;

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS entityId TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'reviews'
      AND column_name = 'entity_type'
  ) THEN
    EXECUTE '
      UPDATE reviews
      SET entityId = CONCAT(entity_type, '':'', entity_id)
      WHERE entityId IS NULL
        AND entity_type IS NOT NULL
        AND entity_id IS NOT NULL
    ';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'reviews'
      AND column_name = 'book_id'
  ) THEN
    EXECUTE '
      UPDATE reviews
      SET entityId = CONCAT(''book'', '':'', book_id)
      WHERE entityId IS NULL AND book_id IS NOT NULL
    ';
  END IF;
END $$;

UPDATE reviews
SET entity_id = entityId
WHERE entityId IS NOT NULL
  AND entity_id IS DISTINCT FROM entityId;

ALTER TABLE reviews
ALTER COLUMN entity_id SET NOT NULL;

DROP INDEX IF EXISTS reviews_book_id_idx;

DROP INDEX IF EXISTS reviews_entity_lookup_idx;

DROP INDEX IF EXISTS reviews_entityId_idx;

CREATE INDEX IF NOT EXISTS reviews_entity_id_idx
ON reviews (entity_id);

ALTER TABLE reviews
DROP COLUMN IF EXISTS entity_type;

ALTER TABLE reviews
DROP COLUMN IF EXISTS entityId;

ALTER TABLE reviews
DROP COLUMN IF EXISTS book_id;
