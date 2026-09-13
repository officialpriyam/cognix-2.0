/**
 * Example: Migrating Chat Component to Use New API Structure
 * Shows before/after of component using API separation
 */

// ============================================
// BEFORE: Using Server Actions directly
// ============================================
/*
"use client";

import { generateTitleFromUserMessageAction } from "@/app/api/chat/actions";

export function ChatComponent() {
  const handleGenerateTitle = async (message) => {
    try {
      const title = await generateTitleFromUserMessageAction({
        message,
        model,
      });
      setTitle(title);
    } catch (error) {
      setError(error.message);
    }
  };

  return <button onClick={handleGenerateTitle}>Generate Title</button>;
}
*/

// ============================================
// AFTER: Using new API structure
// ============================================

"use client";

import { useApiPost } from "@/hooks/useApi";
import { useCallback, useState } from "react";

interface ChatThreadInput {
  title: string;
  model: string;
  systemPrompt?: string;
}

export function ChatComponent() {
  const { loading, error, post } = useApiPost<
    { id: string; title: string; createdAt: string },
    ChatThreadInput
  >("/api/v1/chat/threads");

  const [title, setTitle] = useState("");

  const handleCreateThread = useCallback(async () => {
    const response = await post({
      title: "New Chat",
      model: "gpt-4",
    });

    if (response.success && response.data) {
      setTitle(response.data.title);
    }
  }, [post]);

  return (
    <div>
      <button onClick={handleCreateThread} disabled={loading}>
        {loading ? "Creating..." : "Create Thread"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {title && <p>Thread created: {title}</p>}
    </div>
  );
}

// ============================================
// MIGRATION STEPS
// ============================================

/*
1. IDENTIFY SERVER ACTIONS
   - Look for "use server" in /src/app/api/*/actions.ts
   - Identify which ones should be API endpoints

2. CREATE API ROUTES
   - Create route.ts in /src/app/api/v1/...
   - Use createApiHandler() wrapper
   - Implement the same logic as server action

3. CONVERT COMPONENTS
   - Change "use client" if needed
   - Replace server action calls with useApi* hooks
   - Add proper error handling

4. UPDATE ENVIRONMENT
   - Add NEXT_PUBLIC_API_URL if using separate backend
   - Add NEXT_PUBLIC_ALLOWED_ORIGINS for CORS

5. TEST
   - Test API endpoints directly with curl/Postman
   - Test components with hooks
   - Verify authentication flows

6. REMOVE SERVER ACTIONS
   - Delete @/app/api/*/actions.ts files after migration
   - Update any remaining imports

EXAMPLE: Chat Actions Migration

OLD (/src/app/api/chat/actions.ts):
  export async function getUserId() {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) throw new Error("User not found");
    return userId;
  }

  export async function generateTitleFromUserMessageAction({
    message,
    model,
  }: {
    message: UIMessage;
    model: LanguageModel;
  }) {
    // ... implementation
  }

NEW (/src/app/api/v1/chat/generate-title/route.ts):
  import { createApiHandler, validateRequestBody } from "@/lib/api/handlers";
  import { z } from "zod";

  const GenerateTitleSchema = z.object({
    message: z.object({
      role: z.string(),
      content: z.string(),
    }),
    model: z.string(),
  });

  export const POST = createApiHandler(
    async (request: NextRequest) => {
      const validation = await validateRequestBody(
        request,
        GenerateTitleSchema
      );

      if (!validation.success) {
        throw new Error(validation.error);
      }

      // ... same implementation as before
      return { title: generatedTitle };
    },
    {
      requireAuth: true,
      methods: ["POST"],
      description: "Generate chat title from message",
    }
  );

COMPONENT USAGE:
  import { useApiPost } from "@/hooks/useApi";

  export function ChatComponent() {
    const { loading, error, post } = useApiPost(
      "/api/v1/chat/generate-title"
    );

    const handleGenerate = async (message, model) => {
      const response = await post({ message, model });
      if (response.success) {
        // Use response.data
      }
    };

    return <button onClick={handleGenerate}>Generate</button>;
  }
*/
