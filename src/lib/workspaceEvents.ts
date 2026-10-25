export type WorkspaceAction = "run" | "submit" | "assistant";

const actionEvents: Record<WorkspaceAction, string> = {
  run: "codearena:workspace-run",
  submit: "codearena:workspace-submit",
  assistant: "codearena:workspace-assistant",
};
export const WORKSPACE_BUSY_EVENT = "codearena:workspace-busy";
export const ACTIVITY_RECORDED_EVENT = "codearena:activity-recorded";

export function dispatchWorkspaceAction(action: WorkspaceAction): void {
  window.dispatchEvent(new Event(actionEvents[action]));
}

export function workspaceActionEvent(action: WorkspaceAction): string {
  return actionEvents[action];
}
