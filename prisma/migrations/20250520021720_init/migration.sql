/*
  Warnings:

  - You are about to drop the column `attendaceDate` on the `DriverAttendance` table. All the data in the column will be lost.
  - You are about to drop the column `attendaceStatus` on the `DriverAttendance` table. All the data in the column will be lost.
  - Added the required column `attendanceDate` to the `DriverAttendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `attendanceStatus` to the `DriverAttendance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DriverAttendance" DROP COLUMN "attendaceDate",
DROP COLUMN "attendaceStatus",
ADD COLUMN     "attendanceDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "attendanceStatus" BOOLEAN NOT NULL;
