export interface RevenueCurrencyDto { currency:string; customerPlatformFeeRevenue:number; creatorCommissionRevenue:number; totalPlatformRevenue:number; }
export interface RevenueEntryDto { bookingReference?:string; paymentReference?:string; category:"CUSTOMER_PLATFORM_FEE"|"CREATOR_COMMISSION"; currency:string; amount:number; recognizedAt:string; }
export interface RevenueEntriesDto { items:RevenueEntryDto[]; pagination:{page:number;limit:number;total:number}; }
export interface DataResponse<T>{success:boolean;data:T}
