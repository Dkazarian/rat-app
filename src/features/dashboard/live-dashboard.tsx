"use client";

import { DashboardPage } from "@/features/dashboard/components/dashboard-page/dashboard-page";
import { producePhaseFourDemoBatch } from "@/features/dashboard/deterministic-capture";

export function LiveDashboard() {
  return <DashboardPage produceExpenseBatch={producePhaseFourDemoBatch} />;
}
