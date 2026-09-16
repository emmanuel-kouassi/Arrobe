-- CreateTable
-- Abonnés à la newsletter. `unsubscribeToken` n'a pas de valeur par
-- défaut côté base : c'est le client Prisma qui le génère
-- (@default(uuid()) → crypto.randomUUID()).
CREATE TABLE "subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "unsubscribeToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_email_key" ON "subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_unsubscribeToken_key" ON "subscribers"("unsubscribeToken");
