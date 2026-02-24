import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  tenantName: z.string().min(1).max(255).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const selectAdAccountsSchema = z.object({
  adAccountIds: z.array(z.string().min(1)).min(1).max(50),
});

export const dashboardQuerySchema = z.object({
  ad_account_id: z.string().min(1),
  range: z.enum(["7", "14", "30"]).transform(Number),
});

export const alertsQuerySchema = z.object({
  ad_account_id: z.string().optional(),
  status: z.enum(["open", "resolved"]).optional(),
});

export const adsQuerySchema = z.object({
  ad_account_id: z.string().min(1),
  page_id: z.string().optional(),
  status: z.string().optional(),
});

export const pageDetailQuerySchema = z.object({
  ad_account_id: z.string().min(1),
  range: z.enum(["7", "14", "30"]).default("7").transform(Number),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SelectAdAccountsInput = z.infer<typeof selectAdAccountsSchema>;
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
export type AlertsQuery = z.infer<typeof alertsQuerySchema>;
export type AdsQuery = z.infer<typeof adsQuerySchema>;
export type PageDetailQuery = z.infer<typeof pageDetailQuerySchema>;
