import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

interface ResultItem {
  driver_code: string;
  name: string;
  total_pending: number;
  total_confirmed: number;
  total_paid: number;
  total_attendance_salary: number;
  total_salary: number;
  count_shipment: number;
}

export const getDriverSalaries = async (req: Request, res: Response) => {
  try {
    const { month, year, page_size, current } = req.query;

    if (!month || !year) {
      return res
        .status(400)
        .json({ message: "Month and year are required", isSuccess: false });
    }

    const monthNum = Number(month);
    const yearNum = Number(year);

    if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
      return res
        .status(400)
        .json({ message: "Invalid month or year", isSuccess: false });
    }

    const limit = parseInt(page_size as string) || 10;
    const currentPage = parseInt(current as string) || 1;
    const offset = (currentPage - 1) * limit;

    const salaryConfig = await prisma.variableConfig.findUnique({
      where: { key: "DRIVER_MONTHLY_ATTENDANCE_SALARY" },
    });
    const attendanceSalaryPerDay = Number(salaryConfig?.value) || 0;

    const shipmentCost = await prisma.shipmentCost.groupBy({
      by: ["driverCode", "costStatus"],
      where: {
        shipment: {
          shipmentDate: {
            gte: new Date(yearNum, monthNum - 1, 1),
            lt: new Date(yearNum, monthNum, 1),
          },
        },
      },
      _sum: {
        totalCosts: true,
      },
    });

    const attendanceByDriver = await prisma.driverAttendance.groupBy({
      by: ["driverCode"],
      where: {
        attendanceDate: {
          gte: new Date(yearNum, monthNum - 1, 1),
          lt: new Date(yearNum, monthNum, 1),
        },
        attendanceStatus: true,
      },
      _count: {
        attendanceStatus: true,
      },
    });

    const drivers = await prisma.driver.findMany({
      skip: offset,
      take: limit,
      select: {
        driverCode: true,
        name: true,
      },
    });

    const totalRow = await prisma.driver.count();

    const result: ResultItem[] = await Promise.all(
      drivers.map(async (driver) => {
        const costs = shipmentCost.filter(
          (cost) => cost.driverCode === driver.driverCode
        );
        const attendance = attendanceByDriver.find(
          (a) => a.driverCode === driver.driverCode
        );

        const total_pending =
          costs.find((c) => c.costStatus === "PENDING")?._sum.totalCosts || 0;
        const total_confirmed =
          costs.find((c) => c.costStatus === "CONFIRMED")?._sum.totalCosts || 0;
        const total_paid =
          costs.find((c) => c.costStatus === "PAID")?._sum.totalCosts || 0;
        const total_attendance_salary =
          (attendance?._count.attendanceStatus || 0) * attendanceSalaryPerDay;

        const total_salary =
          total_pending +
          total_confirmed +
          total_paid +
          total_attendance_salary;

        const shipmentNos = await prisma.shipmentCost.findMany({
          where: {
            driverCode: driver.driverCode,
            shipment: {
              shipmentDate: {
                gte: new Date(yearNum, monthNum - 1, 1),
                lt: new Date(yearNum, monthNum, 1),
              },
            },
          },
          select: { shipmentNo: true },
          distinct: ["shipmentNo"], // coba ini jika didukung, kalau error hapus
        });

        // Hitung jumlah unik shipmentNo secara manual
        const count_shipment = new Set(shipmentNos.map((s) => s.shipmentNo))
          .size;

        return {
          driver_code: driver.driverCode,
          name: driver.name,
          total_pending,
          total_confirmed,
          total_paid,
          total_attendance_salary,
          total_salary,
          count_shipment,
        };
      })
    );

    return res.status(200).json({
      data: result,
      total_row: totalRow,
      current: currentPage,
      page_size: limit,
      isSuccess: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      isSuccess: false,
    });
  }
};
