import { NextRequest } from "next/server";
import { addSSEClient, removeSSEClient } from "@/app/api/leads/route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(`data: connected\n\n`);

      // Register this client
      addSSEClient(controller);

      // Cleanup when client disconnects
      req.signal.addEventListener("abort", () => {
        removeSSEClient(controller);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}