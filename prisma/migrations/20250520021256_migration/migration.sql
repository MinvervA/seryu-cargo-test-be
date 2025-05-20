-- CreateTable
CREATE TABLE "Driver" (
    "id" SERIAL NOT NULL,
    "driverCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverAttendance" (
    "id" SERIAL NOT NULL,
    "driverCode" TEXT NOT NULL,
    "attendaceDate" TIMESTAMP(3) NOT NULL,
    "attendaceStatus" BOOLEAN NOT NULL,

    CONSTRAINT "DriverAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentCost" (
    "id" SERIAL NOT NULL,
    "driverCode" TEXT NOT NULL,
    "shipmentNo" TEXT NOT NULL,
    "totalCosts" DOUBLE PRECISION NOT NULL,
    "costStatus" TEXT NOT NULL,

    CONSTRAINT "ShipmentCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "shipmentNo" TEXT NOT NULL,
    "shipmentDate" TIMESTAMP(3) NOT NULL,
    "shipmentStatus" TEXT NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("shipmentNo")
);

-- CreateTable
CREATE TABLE "VariableConfig" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "VariableConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Driver_driverCode_key" ON "Driver"("driverCode");

-- CreateIndex
CREATE UNIQUE INDEX "VariableConfig_key_key" ON "VariableConfig"("key");

-- AddForeignKey
ALTER TABLE "DriverAttendance" ADD CONSTRAINT "DriverAttendance_driverCode_fkey" FOREIGN KEY ("driverCode") REFERENCES "Driver"("driverCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentCost" ADD CONSTRAINT "ShipmentCost_driverCode_fkey" FOREIGN KEY ("driverCode") REFERENCES "Driver"("driverCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentCost" ADD CONSTRAINT "ShipmentCost_shipmentNo_fkey" FOREIGN KEY ("shipmentNo") REFERENCES "Shipment"("shipmentNo") ON DELETE RESTRICT ON UPDATE CASCADE;
