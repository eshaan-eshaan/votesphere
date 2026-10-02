-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionKey" (
    "electionId" TEXT NOT NULL,
    "encryptedPrivateKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElectionKey_pkey" PRIMARY KEY ("electionId")
);

-- CreateTable
CREATE TABLE "Election" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "ringHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Election_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "membershipNo" TEXT NOT NULL,
    "unitLabel" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "flatNo" TEXT NOT NULL,
    "bhk" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "jointOwnerName" TEXT,
    "aadhaarMasked" TEXT NOT NULL,
    "phoneMasked" TEXT NOT NULL,
    "ownership" TEXT NOT NULL,
    "occupancy" TEXT NOT NULL,
    "memberSince" INTEGER NOT NULL,
    "duesCleared" BOOLEAN NOT NULL,
    "titleDisputed" BOOLEAN NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "codeHmac" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RingMember" (
    "id" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,

    CONSTRAINT "RingMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "ballotId" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "encryptedBallot" TEXT NOT NULL,
    "keyImage" TEXT NOT NULL,
    "ringSize" INTEGER NOT NULL,
    "signature" TEXT NOT NULL,
    "castAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_membershipNo_key" ON "Member"("membershipNo");

-- CreateIndex
CREATE UNIQUE INDEX "Member_unitLabel_key" ON "Member"("unitLabel");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_codeHmac_key" ON "Credential"("codeHmac");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_electionId_memberId_key" ON "Credential"("electionId", "memberId");

-- CreateIndex
CREATE INDEX "RingMember_electionId_idx" ON "RingMember"("electionId");

-- CreateIndex
CREATE UNIQUE INDEX "RingMember_electionId_publicKey_key" ON "RingMember"("electionId", "publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_ballotId_key" ON "Vote"("ballotId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_keyImage_key" ON "Vote"("keyImage");

-- CreateIndex
CREATE INDEX "Vote_electionId_idx" ON "Vote"("electionId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_adminId_idx" ON "RefreshToken"("adminId");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

