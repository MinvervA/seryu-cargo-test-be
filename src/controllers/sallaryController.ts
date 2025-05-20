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
    const { month, year, page_size, current, driver_code, status, name } =
      req.query;

    // Validasi parameter
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

    // Ambil konfigurasi gaji kehadiran
    const salaryConfig = await prisma.variableConfig.findUnique({
      where: { key: "DRIVER_MONTHLY_ATTENDANCE_SALARY" },
    });
    const attendanceSalaryPerDay = Number(salaryConfig?.value) || 0;

    // Ambil biaya pengiriman yang tidak dibatalkan
    const shipmentCost = await prisma.shipmentCost.groupBy({
      by: ["driverCode", "costStatus"],
      where: {
        shipment: {
          shipmentDate: {
            gte: new Date(yearNum, monthNum - 1, 1),
            lt: new Date(yearNum, monthNum, 1),
          },
          shipmentStatus: {
            not: "CANCELLED",
          },
        },
      },
      _sum: {
        totalCosts: true,
      },
    });

    // Ambil kehadiran pengemudi
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

    // Ambil daftar pengemudi dengan filter
    const driverWhere: any = {};
    if (driver_code) {
      driverWhere.driverCode = {
        contains: driver_code as string,
        mode: "insensitive",
      };
    }
    if (name) {
      driverWhere.name = {
        contains: name as string,
        mode: "insensitive",
      };
    }

    const drivers = await prisma.driver.findMany({
      where: driverWhere,
      skip: offset,
      take: limit,
      select: {
        driverCode: true,
        name: true,
      },
    });

    // Hitung total pengemudi yang sesuai dengan filter
    const totalRow = await prisma.driver.count({
      where: driverWhere,
    });

    // Proses data pengemudi
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

        // Hitung jumlah pengiriman unik
        const shipmentNos = await prisma.shipmentCost.findMany({
          where: {
            driverCode: driver.driverCode,
            shipment: {
              shipmentDate: {
                gte: new Date(yearNum, monthNum - 1, 1),
                lt: new Date(yearNum, monthNum, 1),
              },
              shipmentStatus: {
                not: "CANCELLED",
              },
            },
          },
          select: { shipmentNo: true },
        });

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

    // Filter hasil berdasarkan status
    let filteredResult = result.filter((r) => r.total_salary > 0);

    if (status === "PENDING") {
      filteredResult = filteredResult.filter((r) => r.total_pending > 0);
    } else if (status === "CONFIRMED") {
      filteredResult = filteredResult.filter((r) => r.total_confirmed > 0);
    } else if (status === "PAID") {
      filteredResult = filteredResult.filter((r) => r.total_paid > 0);
    } else if (status) {
      return res.status(400).json({
        message: `Invalid status filter. Allowed values: PENDING, CONFIRMED, PAID.`,
        isSuccess: false,
      });
    }

    return res.status(200).json({
      data: filteredResult,
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
