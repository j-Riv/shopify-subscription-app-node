/*
  Warnings:

  - Changed the type of `intervalCount` on the `SubscriptionContracts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "SubscriptionContracts" DROP COLUMN "intervalCount",
ADD COLUMN     "intervalCount" INTEGER NOT NULL;
