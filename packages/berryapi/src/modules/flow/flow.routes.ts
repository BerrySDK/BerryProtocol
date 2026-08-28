import { createRouteSchema } from "../../docs/schema.js";
import { FlowController } from "./flow.controller.js";
import { FlowService } from "./flow.service.js";
import type { InstanceManager } from "../../managers/InstanceManager.js";

export const registerFlowRoutes = async (app: any, manager: InstanceManager) => {
  const controller = new FlowController(new FlowService(manager));

  app.get("/studio/api/capabilities", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Get Berry Studio capabilities",
      description: "Loads node types, message types and defaults used by Berry Studio.",
    }),
  }, controller.getCapabilities);

  app.get("/studio/api/instances", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "List Studio instances",
      description: "Loads BerryAPI instances for Studio execution.",
    }),
  }, controller.listInstances);

  app.post("/studio/api/instances", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Create Studio instance",
      description: "Creates a new BerryAPI instance from the Studio UI.",
    }),
  }, controller.createInstance);

  app.post("/studio/api/instances/:instanceName/connect", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Connect Studio instance",
      description: "Starts a connection flow for a Studio instance.",
    }),
  }, controller.connectInstance);

  app.get("/studio/api/flows", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "List Berry Studio flows",
    }),
  }, controller.listFlows);

  app.post("/studio/api/flows", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Create Berry Studio flow",
    }),
  }, controller.createFlow);

  app.get("/studio/api/flows/:flowId", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Get Berry Studio flow",
    }),
  }, controller.getFlow);

  app.put("/studio/api/flows/:flowId", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Update Berry Studio flow",
    }),
  }, controller.updateFlow);

  app.post("/studio/api/flows/:flowId/status", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Update Berry Studio flow status",
    }),
  }, controller.updateFlowStatus);

  app.delete("/studio/api/flows/:flowId", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Delete Berry Studio flow",
    }),
  }, controller.deleteFlow);

  app.post("/studio/api/flows/:flowId/duplicate", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Duplicate Berry Studio flow",
    }),
  }, controller.duplicateFlow);

  app.post("/studio/api/flows/:flowId/publish", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Publish Berry Studio flow",
    }),
  }, controller.publishFlow);

  app.post("/studio/api/flows/validate", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Validate Berry Studio flow",
    }),
  }, controller.validateFlow);

  app.get("/studio/api/analytics", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Get Studio analytics",
    }),
  }, controller.getAnalytics);

  app.post("/studio/api/analytics/reset", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Reset Studio analytics",
    }),
  }, controller.resetAnalytics);

  app.get("/studio/api/notifications", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "List Studio notifications",
    }),
  }, controller.listNotifications);

  app.post("/studio/api/simulate/start", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Start Berry Studio simulation",
    }),
  }, controller.simulateStart);

  app.post("/studio/api/simulate/continue", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Continue Berry Studio simulation",
    }),
  }, controller.simulateContinue);

  app.post("/studio/api/execute/start", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Start real flow execution",
    }),
  }, controller.executeStart);

  app.post("/studio/api/execute/continue", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Continue real flow execution",
    }),
  }, controller.executeContinue);

  app.post("/studio/api/instances/:instanceName/restart", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Restart Studio instance",
    }),
  }, controller.restartInstance);

  app.post("/studio/api/instances/:instanceName/logout", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Logout Studio instance",
    }),
  }, controller.logoutInstance);

  app.delete("/studio/api/instances/:instanceName", {
    schema: createRouteSchema({
      tags: ["Berry Studio"],
      summary: "Delete Studio instance",
    }),
  }, controller.deleteInstance);
};
