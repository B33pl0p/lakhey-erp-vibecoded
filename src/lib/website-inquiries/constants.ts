export const WEBSITE_INQUIRY_STATUSES = ["new", "contacted", "quoted", "closed"] as const;

export type WebsiteInquiryStatus = typeof WEBSITE_INQUIRY_STATUSES[number];
