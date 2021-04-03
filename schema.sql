DROP TABLE IF NOT EXISTS city;

CREATE TABLE city(
    id SERIAL PRIMARY KEY NOT NULL,
    search_query VARCHAR(256),
    formatted_query VARCHAR(256),
    latitude VARCHAR(256),
    longitude VARCHAR(256) 
);
