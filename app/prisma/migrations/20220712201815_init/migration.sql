-- CreateTable
CREATE TABLE "ActiveShops" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SubscriptionContracts" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "nextBillingDate" TIMESTAMP(3) NOT NULL,
    "interval" TEXT NOT NULL,
    "intervalCount" TEXT NOT NULL,
    "paymentFailureCount" INTEGER NOT NULL DEFAULT 0,
    "contract" JSONB NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ActiveShops_id_key" ON "ActiveShops"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionContracts_id_key" ON "SubscriptionContracts"("id");
