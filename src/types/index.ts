import { Customer as PrismaCustomer, Package as PrismaPackage, Invoice as PrismaInvoice, SystemSettings as PrismaSettings, SystemLog as PrismaLog } from '@prisma/client';

export type Customer = PrismaCustomer;
export type Package = PrismaPackage;
export type Invoice = PrismaInvoice;
export type SystemSettings = PrismaSettings;
export type SystemLog = PrismaLog;

export type CustomerWithPackage = Customer & {
  package: Package;
  invoices?: Invoice[];
};

export type InvoiceWithCustomer = Invoice & {
  customer: Customer & {
    package?: Package;
  };
};

export interface MikrotikSettings {
  mikrotikHost: string;
  mikrotikPort: number;
  mikrotikUsername: string;
  mikrotikPassword: string;
  mikrotikIsolirProfile?: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
}
