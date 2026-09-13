/**
 * Example: Get User Profile API Route
 * Demonstrates proper backend/frontend separation with security
 */

import { NextRequest } from "next/server";
import { createApiHandler } from "@/lib/api/handlers";
import { getSession } from "@/lib/auth/server";
import { userRepository } from "@/lib/db/repository";

export const GET = createApiHandler(
  async (request: NextRequest) => {
    // Get authenticated user's session
    const session = await getSession();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Fetch user data
    const user = await userRepository.getUserById(session.user.id);
    if (!user) {
      throw new Error("User not found");
    }

    // Return sanitized user data (no sensitive fields)
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  },
  {
    requireAuth: true,
    methods: ["GET"],
    description: "Get current user's profile",
  }
);
