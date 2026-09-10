-- AlterTable
-- Compte rendu d'un événement passé. Nullable : les événements déjà
-- en base restent valides, aucune valeur par défaut n'est nécessaire.
ALTER TABLE "events" ADD COLUMN "recap" TEXT;
