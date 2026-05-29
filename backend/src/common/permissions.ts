export type Role = 'ADMIN' | 'EMPLOYEE' | 'ACCOUNTANT';

export const PERMISSIONS: Record<string, Role[]> = {
  // USERS
  'users.create': ['ADMIN'],
  'users.edit': ['ADMIN'],
  'users.delete': ['ADMIN'],
  'users.view': ['ADMIN', 'ACCOUNTANT'],
  'users.changeRole': ['ADMIN'],
  'users.viewAuditLogs': ['ADMIN', 'ACCOUNTANT'],

  // CLIENTS
  'clients.create': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'clients.edit': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'clients.delete': ['ADMIN'],
  'clients.viewHistory': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'clients.changeClassification': ['ADMIN', 'ACCOUNTANT'],
  'clients.setCreditLimit': ['ADMIN', 'ACCOUNTANT'],

  // PRODUCTS
  'products.create': ['ADMIN'],
  'products.edit': ['ADMIN'],
  'products.delete': ['ADMIN'],
  'products.activate': ['ADMIN'],
  'products.view': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],

  // ACCOUNTS
  'accounts.create': ['ADMIN'],
  'accounts.edit': ['ADMIN'],
  'accounts.delete': ['ADMIN'],
  'accounts.viewBalances': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'accounts.viewMovements': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],

  // OPERATIONS
  'operations.create': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'operations.editDraft': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'operations.editCompleted': ['ADMIN'],
  'operations.delete': ['ADMIN'],
  'operations.cancel': ['ADMIN', 'ACCOUNTANT'],
  'operations.view': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'operations.uploadAttachments': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],

  // INVOICES
  'invoices.view': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'invoices.create': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'invoices.editDraft': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'invoices.delete': ['ADMIN'],
  'invoices.markPaid': ['ADMIN', 'ACCOUNTANT'],
  'invoices.sendEmail': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'invoices.bulkGenerate': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'invoices.exportPdf': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],

  // PAYMENTS
  'payments.record': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'payments.edit': ['ADMIN', 'ACCOUNTANT'],
  'payments.delete': ['ADMIN'],
  'payments.view': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],

  // META ADS
  'metaAds.create': ['ADMIN'],
  'metaAds.edit': ['ADMIN'],
  'metaAds.recordDeduction': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'metaAds.deleteDeduction': ['ADMIN'],
  'metaAds.view': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],

  // EXPENSES
  'expenses.create': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'expenses.edit': ['ADMIN', 'ACCOUNTANT'],
  'expenses.delete': ['ADMIN'],
  'expenses.view': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],

  // INTERNAL TRANSFERS
  'transfers.create': ['ADMIN', 'ACCOUNTANT'],
  'transfers.delete': ['ADMIN'],
  'transfers.view': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],

  // TREASURY
  'treasury.view': ['ADMIN', 'ACCOUNTANT'],
  'treasury.forecast': ['ADMIN', 'ACCOUNTANT'],
  'treasury.export': ['ADMIN', 'ACCOUNTANT'],

  // ALERTS
  'alerts.view': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'alerts.dismiss': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'alerts.configure': ['ADMIN'],

  // SETTINGS
  'settings.editCompany': ['ADMIN'],
  'settings.manageRates': ['ADMIN', 'ACCOUNTANT'],
  'settings.viewRatesHistory': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'settings.configureThresholds': ['ADMIN'],
  'settings.manageNumbering': ['ADMIN'],

  // REPORTS & EXPORTS
  'reports.exportTable': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'reports.viewProfitLoss': ['ADMIN', 'ACCOUNTANT'],
  'reports.viewClientProfitability': ['ADMIN', 'ACCOUNTANT'],
  'reports.viewDashboard': ['ADMIN', 'EMPLOYEE', 'ACCOUNTANT'],
  'reports.viewKpiFinancial': ['ADMIN', 'ACCOUNTANT'],
};

export function hasPermission(role: string | undefined, action: string): boolean {
  if (!role) return false;
  const upperRole = role.toUpperCase() as Role;
  const allowedRoles = PERMISSIONS[action];
  if (!allowedRoles) return false;
  return allowedRoles.includes(upperRole);
}
