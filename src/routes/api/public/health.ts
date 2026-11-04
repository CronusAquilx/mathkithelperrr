import { createFileRoute } from "@tanstack/react-router";
import { deploymentHealth } from "@/lib/deployment-health";

export const Route = createFileRoute("/api/public/health")({
  server: { handlers: { GET: () => deploymentHealth() } },
});
