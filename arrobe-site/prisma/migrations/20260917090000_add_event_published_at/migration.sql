-- AlterTable
-- Date de première publication d'un événement, sur le modèle des
-- articles. Sert à n'annoncer un événement qu'une fois à la newsletter.
ALTER TABLE "events" ADD COLUMN "publishedAt" TIMESTAMP(3);

-- Rattrapage des événements DÉJÀ publiés : sans date, ils seraient
-- pris pour des nouveautés à leur prochaine modification dans
-- l'administration, et annoncés à tous les abonnés. La date de
-- création est la meilleure approximation disponible.
UPDATE "events" SET "publishedAt" = "createdAt" WHERE "status" = 'PUBLISHED';
