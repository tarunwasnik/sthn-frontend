import api from "../../api/axios"; import type {DataResponse,RevenueCurrencyDto,RevenueEntriesDto} from "./types";
const base="/v1/admin/financial/platform-revenue";
export async function getRevenue(){return (await api.get<DataResponse<{currencies:RevenueCurrencyDto[]}>>(base)).data.data;}
export async function getRevenueEntries(page:number){return (await api.get<DataResponse<RevenueEntriesDto>>(`${base}/entries`,{params:{page,limit:25}})).data.data;}
