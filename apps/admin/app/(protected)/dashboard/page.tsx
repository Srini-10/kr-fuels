
import { unstable_rethrow } from "next/navigation";
import DashboardClient from "./DashboardClient";
import type { FuelPrices, DashboardData } from "@/types";
import { serverFetch } from "@/lib/server-fetch";

export const dynamic = 'force-dynamic';

// Fetch initial prices server-side
async function getFuelPrices(): Promise<FuelPrices> {
    try {
        const res = await serverFetch("/dashboard/fuel-prices");
        return res.data;
    }
    catch(error: any) {
        unstable_rethrow(error); // let serverFetch's expired-session redirect through
        console.error("Error fetching fuel prices:", error);
        return { 
            diesel: 0, 
            petrol: 0, 
            autoLPG: 0,
            verified: undefined
        };
    }
}

async function getDashboardData(): Promise<DashboardData> {
    try {
        const res = await serverFetch("/dashboard");
        return res.data;
    } 
    catch(error) {
        unstable_rethrow(error); // let serverFetch's expired-session redirect through
        console.error("Error fetching dashboard data:", error);
        return {
            stations: { total: 0, active: 0, inactive: 0 },
            feedback: {
                total: 0,
                pending: 0,
                inProgress: 0,
                resolved: 0,
                avgRating: 0,
                safetyAwarenessPercent: 0,
                resolutionRate: 0,
                byCategory: {},
                byStation: []
            },
            enquiries: { total: 0, thisMonth: 0 },
            products: { total: 0, active: 0, categories: 0, byCategory: {} },
            recentFeedback: [],
            recentEnquiries: []
        };
    }
}

export default async function DashboardPageRoute() {
    const [prices, dashboardData] = await Promise.all([
        getFuelPrices(),
        getDashboardData()
    ]);

    return <DashboardClient initialPrices={prices} initialDashboardData={dashboardData} />;
}