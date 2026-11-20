// Frontend collection is independent of the backend's STHN_VISITOR_MONITOR_ENABLED gate.
export const visitorMonitorEnabled = import.meta.env.VITE_VISITOR_MONITOR_ENABLED === "true";
