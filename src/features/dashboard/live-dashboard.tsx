"use client";

import { DashboardPage } from "@/features/dashboard/components/dashboard-page/dashboard-page";
import { produceMockExpenseBatch } from "@/features/dashboard/mock-expense-capture";

export function LiveDashboard() {
  return <DashboardPage produceExpenseBatch={produceMockExpenseBatch} />;
}
