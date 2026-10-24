BEGIN;
-- Remove the faker-generated places (random names, random coordinates, picsum photos)
DELETE FROM "Attraction" WHERE "coverImage" LIKE '%picsum.photos%';
-- Put the real seeded places back in their own city
UPDATE "Attraction" a SET "cityId" = c.id
FROM (VALUES ('jemaa-el-fnaa','marrakech'),('koutoubia-mosque','marrakech'),('medina-of-fez','fez'),
             ('blue-city-streets','chefchaouen'),('hassan-ii-mosque','casablanca'),
             ('essaouira-beach','essaouira'),('ait-benhaddou-kasbah','ouarzazate')) AS m(slug, city)
JOIN "City" c ON c.slug = m.city
WHERE a.slug = m.slug;
-- Stock photos in attraction galleries -> the place's own cover image
UPDATE "AttractionMedia" am SET url = a."coverImage", type = 'PHOTO'
FROM "Attraction" a WHERE am."attractionId" = a.id AND am.url LIKE '%picsum.photos%';
COMMIT;
