/**
 * Example: Create Chat Thread API Route
 * Demonstrates data validation and proper response format
 */

import { createApiHandler, validateRequestBody } from "@/lib/api/handlers";
import { getSession } from "@/lib/auth/server";
import { chatRepository } from "@/lib/db/repository";
import { z } from "zod";

// Input validation schema
const CreateChatThreadSchema = z.object({
  title: z.string().min(1).max(200),
  systemPrompt: z.string().optional(),
});

export const POST = createApiHandler(
  async (request) => {
    // Validate request body
    const validation = await validateRequestBody(request, CreateChatThreadSchema);

    if (!validation.success) {
      throw new Error(validation.error);
    }

    // Get authenticated user
    const session = await getSession();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const { title } = validation.data;

    // Create thread in database
    const thread = await chatRepository.insertThread({
      id: crypto.randomUUID(),
      title,
      userId: session.user.id,
    });

    return {
      id: thread.id,
      title: thread.title,
      createdAt: thread.createdAt,
    };
  },
  {
    requireAuth: true,
    methods: ["POST"],
    description: "Create a new chat thread",
  }
);

export const GET = createApiHandler(
  async () => {
    // Get authenticated user
    const session = await getSession();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Fetch user's threads
    const threads = await chatRepository.selectThreadsByUserId(session.user.id);

    return {
      count: threads.length,
      threads: threads.map((t) => ({
        id: t.id,
        title: t.title,
        lastMessageAt: t.lastMessageAt,
        createdAt: t.createdAt,
      })),
    };
  },
  {
    requireAuth: true,
    methods: ["GET"],
    description: "Get user's chat threads",
  }
);
