import api from "../../api/axios";
import type { AdminDisputeDetail, AdminDisputeFilters, AdminDisputeInvestigation, AdminDisputeList, DirectEvidenceAudience, InvestigationTarget } from "./types";
const base = "/v1/admin/disputes";
export async function getAdminDisputes(filters: AdminDisputeFilters) { return (await api.get<AdminDisputeList>(base, { params: filters })).data; }
export async function getAdminDispute(disputeId: string) { return (await api.get<AdminDisputeDetail>(`${base}/${encodeURIComponent(disputeId)}`)).data; }
export async function closeDisputeNoAction(disputeId: string, note?: string) { return api.patch(`${base}/${encodeURIComponent(disputeId)}/resolve`, { action: "NO_ACTION", note: note || undefined }); }
export async function getAdminDisputeInvestigation(disputeId:string) { return (await api.get<AdminDisputeInvestigation>(`${base}/${encodeURIComponent(disputeId)}/investigation`)).data; }
export async function setDisputeInput(disputeId:string, participantRole:"CUSTOMER"|"CREATOR", state:"OPEN"|"CLOSED") { return api.patch(`${base}/${encodeURIComponent(disputeId)}/input-access`,{participantRole,state}); }
export async function requestDisputeInfo(disputeId:string,target:InvestigationTarget,text:string) { return api.post(`${base}/${encodeURIComponent(disputeId)}/requests`,{target,text}); }
export async function shareDisputeSubmission(disputeId:string,submissionReference:string) { return api.post(`${base}/${encodeURIComponent(disputeId)}/share`,{submissionReference}); }
export async function uploadAdminDisputeEvidence(disputeId:string,type:"IMAGE"|"DOCUMENT",file:File,audience:DirectEvidenceAudience,note:string) { const body=new FormData(); body.set("file",file); body.set("audience",audience); if(note.trim()) body.set("note",note.trim()); return api.post(`${base}/${encodeURIComponent(disputeId)}/evidence/${type==="IMAGE"?"images":"documents"}`,body); }
export async function addDisputeFinding(disputeId:string,payload:{subject:"CUSTOMER"|"CREATOR"|"BOTH";category:string;conclusion:"SUPPORTED"|"NOT_SUPPORTED"|"INCONCLUSIVE";summary:string}) { return api.post(`${base}/${encodeURIComponent(disputeId)}/findings`,payload); }
export async function finalizeDisputeInvestigation(disputeId:string,payload:{customerOutcome:string;customerSummary:string;creatorOutcome:string;creatorSummary:string;summary:string;financialReviewRequired:boolean;governanceReviewRequired:boolean}) { return api.post(`${base}/${encodeURIComponent(disputeId)}/finalize`,payload); }
