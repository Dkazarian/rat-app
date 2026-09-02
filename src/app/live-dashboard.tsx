"use client";

import { DashboardPage } from "@/components/dashboard-page/dashboard-page";
import { producePhaseFourDemoBatch } from "@/features/session/deterministic-capture";

export function LiveDashboard() {
  return <DashboardPage produceExpenseBatch={producePhaseFourDemoBatch} />;
}
