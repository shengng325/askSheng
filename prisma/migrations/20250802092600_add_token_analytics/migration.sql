-- CreateTable
CREATE TABLE "token_analytics" (
    "id" TEXT NOT NULL,
    "failureReason" TEXT,
    "tokenString" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "accessType" TEXT,
    "fullUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_analytics_pkey" PRIMARY KEY ("id")
);