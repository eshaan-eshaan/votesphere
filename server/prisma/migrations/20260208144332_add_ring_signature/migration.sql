/*
  Warnings:

  - Added the required column `keyImage` to the `Vote` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ballotId" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "encryptedBallot" TEXT NOT NULL,
    "choiceId" TEXT NOT NULL,
    "voterIdHash" TEXT NOT NULL,
    "keyImage" TEXT NOT NULL,
    "ringSize" INTEGER NOT NULL DEFAULT 5,
    "signature" TEXT,
    "signingPublicKey" TEXT,
    "castAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Vote" ("ballotId", "castAt", "choiceId", "electionId", "encryptedBallot", "id", "signature", "signingPublicKey", "voterIdHash") SELECT "ballotId", "castAt", "choiceId", "electionId", "encryptedBallot", "id", "signature", "signingPublicKey", "voterIdHash" FROM "Vote";
DROP TABLE "Vote";
ALTER TABLE "new_Vote" RENAME TO "Vote";
CREATE UNIQUE INDEX "Vote_ballotId_key" ON "Vote"("ballotId");
CREATE UNIQUE INDEX "Vote_keyImage_key" ON "Vote"("keyImage");
CREATE INDEX "Vote_electionId_idx" ON "Vote"("electionId");
CREATE INDEX "Vote_voterIdHash_idx" ON "Vote"("voterIdHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
