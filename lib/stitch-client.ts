import { StitchToolClient } from "@google/stitch-sdk";

/**
 * Authenticated MCP client for Stitch.
 * Uses the Project ID from your Stitch URL.
 */
export const stitchClient = new StitchToolClient({
  apiKey: process.env.STITCH_API_KEY,
  projectId: "14173284532756628243",
});

export default stitchClient;