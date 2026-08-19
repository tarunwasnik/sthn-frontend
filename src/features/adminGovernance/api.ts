import api from "../../api/axios"; import type { ActionDefinition, ActionResult, AdminActionLog, AdminGovernanceTarget, AuditLog, Pagination } from "./types";
type Envelope<T>={data:T;meta?:Pagination};
export const getTarget=(id:string)=>api.get<Envelope<AdminGovernanceTarget>>(`/v1/admin/governance/targets/${encodeURIComponent(id)}`).then(r=>r.data.data);
export const getRegistry=()=>api.get<Envelope<ActionDefinition[]>>("/v1/admin/actions/registry").then(r=>r.data.data);
export const executeAction=(body:{key:string;targetId:string;params:Record<string,unknown>;reason:string;dryRun:boolean;confirmationToken?:string})=>api.post<Envelope<ActionResult>>("/v1/admin/actions/execute",body).then(r=>r.data.data);
export const getActionLogs=(targetId:string)=>api.get<Envelope<AdminActionLog[]>>("/v1/admin/actions/logs",{params:{targetId,page:1,limit:20}}).then(r=>({items:r.data.data,page:r.data.meta}));
export const getAuditLogs=(entityId:string)=>api.get<{logs:AuditLog[];pagination:Pagination}>("/v1/admin/audit-logs",{params:{entityId,page:1,limit:20}}).then(r=>r.data);
