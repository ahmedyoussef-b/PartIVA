ALTER TABLE "parts" ADD COLUMN "search_vector" tsvector;

CREATE INDEX "parts_search_vector_idx" ON "parts" USING GIN ("search_vector");

CREATE FUNCTION parts_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW."ptvReference", '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW."partNumber", '')), 'A');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER parts_search_vector_trigger
BEFORE INSERT OR UPDATE ON "parts"
FOR EACH ROW EXECUTE FUNCTION parts_search_vector_update();

UPDATE "parts" SET "search_vector" =
  setweight(to_tsvector('french', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('french', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE("ptvReference", '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE("partNumber", '')), 'A');
