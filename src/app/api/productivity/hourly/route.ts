import { NextResponse } from "next/server";
import { calculateAndUpdateProductivity } from "../client";

export async function GET() {
  try {
    // Start the productivity calculation process in the background
    calculateAndUpdateProductivity().catch(error => {
      console.error("Background productivity calculation failed:", error);
    });

    // Immediately return success response
    return NextResponse.json({
      message: "Productivity calculation triggered successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error triggering productivity calculation:", error);
    return NextResponse.json(
      { error: `Failed to trigger productivity calculation: ${error}` },
      { status: 500 }
    );
  }
} 