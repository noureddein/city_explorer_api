DROP TABLE cityLocation;

CREATE TABLE IF NOT EXISTS
cityLocation(
  id SERIAL PRIMARY KEY NOT NULL,
  search_query VARCHAR(256) NOT NULL,
  formatted_query VARCHAR(256) NOT NULL,
  latitude VARCHAR(256) NOT NULL,
  longitude VARCHAR(256) NOT NULL,
);