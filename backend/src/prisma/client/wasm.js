
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.15.0
 * Query Engine version: 12e25d8d06f6ea5a0252864dd9a03b1bb51f3022
 */
Prisma.prismaVersion = {
  client: "5.15.0",
  engine: "12e25d8d06f6ea5a0252864dd9a03b1bb51f3022"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}

/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.Account_movementsScalarFieldEnum = {
  id: 'id',
  account_id: 'account_id',
  operation_id: 'operation_id',
  movement_type: 'movement_type',
  amount: 'amount',
  currency: 'currency',
  balance_before: 'balance_before',
  balance_after: 'balance_after',
  description: 'description',
  created_at: 'created_at'
};

exports.Prisma.AccountsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  account_type: 'account_type',
  currency: 'currency',
  initial_balance: 'initial_balance',
  current_balance: 'current_balance',
  min_threshold: 'min_threshold',
  account_number: 'account_number',
  description: 'description',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at'
};

exports.Prisma.Audit_logsScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  action: 'action',
  entity_type: 'entity_type',
  entity_id: 'entity_id',
  old_values: 'old_values',
  new_values: 'new_values',
  ip_address: 'ip_address',
  user_agent: 'user_agent',
  created_at: 'created_at'
};

exports.Prisma.ClientsScalarFieldEnum = {
  id: 'id',
  full_name: 'full_name',
  phone: 'phone',
  email: 'email',
  address: 'address',
  client_type: 'client_type',
  classification: 'classification',
  credit_limit: 'credit_limit',
  email_opt_in: 'email_opt_in',
  notes: 'notes',
  total_operations: 'total_operations',
  total_profit: 'total_profit',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at'
};

exports.Prisma.Exchange_ratesScalarFieldEnum = {
  id: 'id',
  base_currency: 'base_currency',
  target_currency: 'target_currency',
  rate: 'rate',
  created_by_user_id: 'created_by_user_id',
  created_at: 'created_at'
};

exports.Prisma.ExpensesScalarFieldEnum = {
  id: 'id',
  category: 'category',
  account_id: 'account_id',
  amount: 'amount',
  currency: 'currency',
  description: 'description',
  expense_date: 'expense_date',
  receipt_file: 'receipt_file',
  created_by_user_id: 'created_by_user_id',
  created_at: 'created_at',
  deleted_at: 'deleted_at'
};

exports.Prisma.Internal_transfersScalarFieldEnum = {
  id: 'id',
  source_account_id: 'source_account_id',
  destination_account_id: 'destination_account_id',
  source_amount: 'source_amount',
  destination_amount: 'destination_amount',
  exchange_rate: 'exchange_rate',
  notes: 'notes',
  transfer_date: 'transfer_date',
  created_by_user_id: 'created_by_user_id',
  created_at: 'created_at'
};

exports.Prisma.InvoicesScalarFieldEnum = {
  id: 'id',
  invoice_number: 'invoice_number',
  client_id: 'client_id',
  total_amount: 'total_amount',
  paid_amount: 'paid_amount',
  remaining_amount: 'remaining_amount',
  currency: 'currency',
  status: 'status',
  payment_method: 'payment_method',
  due_date: 'due_date',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at',
  sent_at: 'sent_at'
};

exports.Prisma.Invoice_itemsScalarFieldEnum = {
  id: 'id',
  invoice_id: 'invoice_id',
  operation_id: 'operation_id',
  description: 'description',
  quantity: 'quantity',
  unit_price: 'unit_price',
  total: 'total',
  created_at: 'created_at'
};

exports.Prisma.OperationsScalarFieldEnum = {
  id: 'id',
  operation_type: 'operation_type',
  product_id: 'product_id',
  client_id: 'client_id',
  source_account_id: 'source_account_id',
  destination_account_id: 'destination_account_id',
  created_by_user_id: 'created_by_user_id',
  validated_by_user_id: 'validated_by_user_id',
  amount_dzd: 'amount_dzd',
  foreign_amount: 'foreign_amount',
  foreign_currency: 'foreign_currency',
  exchange_rate: 'exchange_rate',
  operation_cost: 'operation_cost',
  profit: 'profit',
  status: 'status',
  notes: 'notes',
  attachment_url: 'attachment_url',
  operation_date: 'operation_date',
  created_at: 'created_at',
  updated_at: 'updated_at',
  deleted_at: 'deleted_at',
  invoice_id: 'invoice_id',
  invoiced: 'invoiced'
};

exports.Prisma.Operation_filesScalarFieldEnum = {
  id: 'id',
  operation_id: 'operation_id',
  filename: 'filename',
  path: 'path',
  mime_type: 'mime_type',
  size: 'size',
  created_at: 'created_at'
};

exports.Prisma.PaymentsScalarFieldEnum = {
  id: 'id',
  invoice_id: 'invoice_id',
  account_id: 'account_id',
  amount: 'amount',
  currency: 'currency',
  payment_method: 'payment_method',
  reference_number: 'reference_number',
  notes: 'notes',
  payment_date: 'payment_date',
  created_by_user_id: 'created_by_user_id',
  created_at: 'created_at',
  deleted_at: 'deleted_at'
};

exports.Prisma.Product_account_compatibilityScalarFieldEnum = {
  id: 'id',
  product_id: 'product_id',
  account_id: 'account_id',
  compatibility_type: 'compatibility_type',
  created_at: 'created_at'
};

exports.Prisma.ProductsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  category: 'category',
  description: 'description',
  buy_price: 'buy_price',
  sell_price: 'sell_price',
  is_active: 'is_active',
  created_at: 'created_at',
  deleted_at: 'deleted_at'
};

exports.Prisma.User_accountsScalarFieldEnum = {
  id: 'id',
  user_id: 'user_id',
  account_id: 'account_id',
  permission_level: 'permission_level',
  created_at: 'created_at'
};

exports.Prisma.UsersScalarFieldEnum = {
  id: 'id',
  keycloak_user_id: 'keycloak_user_id',
  local_password: 'local_password',
  role: 'role',
  force_password_change: 'force_password_change',
  login_attempts: 'login_attempts',
  locked_until: 'locked_until',
  last_login: 'last_login',
  full_name: 'full_name',
  email: 'email',
  phone: 'phone',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Meta_ads_accountsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  platform: 'platform',
  initial_credit: 'initial_credit',
  currency: 'currency',
  due_date: 'due_date',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Meta_ads_deductionsScalarFieldEnum = {
  id: 'id',
  account_id: 'account_id',
  amount: 'amount',
  deduction_date: 'deduction_date',
  description: 'description',
  invoice_ref: 'invoice_ref',
  created_at: 'created_at'
};

exports.Prisma.AlertsScalarFieldEnum = {
  id: 'id',
  type: 'type',
  severity: 'severity',
  message: 'message',
  entity_type: 'entity_type',
  entity_id: 'entity_id',
  is_resolved: 'is_resolved',
  resolved_at: 'resolved_at',
  created_at: 'created_at'
};

exports.Prisma.Alert_dismissalsScalarFieldEnum = {
  id: 'id',
  alert_id: 'alert_id',
  user_id: 'user_id',
  dismissed_at: 'dismissed_at'
};

exports.Prisma.SettingsScalarFieldEnum = {
  id: 'id',
  key_name: 'key_name',
  value_data: 'value_data',
  updated_by_user_id: 'updated_by_user_id',
  updated_at: 'updated_at'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.account_movements_movement_type = exports.$Enums.account_movements_movement_type = {
  IN: 'IN',
  OUT: 'OUT'
};

exports.account_movements_currency = exports.$Enums.account_movements_currency = {
  DZD: 'DZD',
  USD: 'USD',
  EUR: 'EUR',
  USDT: 'USDT'
};

exports.accounts_account_type = exports.$Enums.accounts_account_type = {
  CASH: 'CASH',
  CCP: 'CCP',
  PAYONEER: 'PAYONEER',
  PAYPAL: 'PAYPAL',
  REDOTPAY: 'REDOTPAY',
  BANK: 'BANK',
  ADS: 'ADS'
};

exports.accounts_currency = exports.$Enums.accounts_currency = {
  DZD: 'DZD',
  USD: 'USD',
  EUR: 'EUR',
  USDT: 'USDT'
};

exports.clients_client_type = exports.$Enums.clients_client_type = {
  NORMAL: 'NORMAL',
  VIP: 'VIP',
  RISK: 'RISK'
};

exports.exchange_rates_base_currency = exports.$Enums.exchange_rates_base_currency = {
  DZD: 'DZD',
  USD: 'USD',
  EUR: 'EUR',
  USDT: 'USDT'
};

exports.exchange_rates_target_currency = exports.$Enums.exchange_rates_target_currency = {
  DZD: 'DZD',
  USD: 'USD',
  EUR: 'EUR',
  USDT: 'USDT'
};

exports.expenses_currency = exports.$Enums.expenses_currency = {
  DZD: 'DZD',
  USD: 'USD',
  EUR: 'EUR',
  USDT: 'USDT'
};

exports.invoices_currency = exports.$Enums.invoices_currency = {
  DZD: 'DZD',
  USD: 'USD',
  EUR: 'EUR',
  USDT: 'USDT'
};

exports.invoices_status = exports.$Enums.invoices_status = {
  DRAFT: 'DRAFT',
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE'
};

exports.payments_payment_method = exports.$Enums.payments_payment_method = {
  CASH: 'CASH',
  CCP: 'CCP',
  PAYONEER: 'PAYONEER',
  PAYPAL: 'PAYPAL',
  REDOTPAY: 'REDOTPAY',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CRYPTO: 'CRYPTO'
};

exports.operations_operation_type = exports.$Enums.operations_operation_type = {
  SALE: 'SALE',
  PURCHASE: 'PURCHASE',
  TRANSFER: 'TRANSFER',
  EXPENSE: 'EXPENSE',
  PAYMENT: 'PAYMENT'
};

exports.operations_foreign_currency = exports.$Enums.operations_foreign_currency = {
  USD: 'USD',
  EUR: 'EUR',
  USDT: 'USDT'
};

exports.operations_status = exports.$Enums.operations_status = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

exports.payments_currency = exports.$Enums.payments_currency = {
  DZD: 'DZD',
  USD: 'USD',
  EUR: 'EUR',
  USDT: 'USDT'
};

exports.product_compatibility_type = exports.$Enums.product_compatibility_type = {
  SOURCE: 'SOURCE',
  DESTINATION: 'DESTINATION',
  BOTH: 'BOTH'
};

exports.products_category = exports.$Enums.products_category = {
  TIKTOK_COINS: 'TIKTOK_COINS',
  BUY_TIKTOK_USD: 'BUY_TIKTOK_USD',
  SELL_USDT: 'SELL_USDT',
  BUY_USDT: 'BUY_USDT',
  ADS_META: 'ADS_META',
  SERVICE: 'SERVICE'
};

exports.user_accounts_permission_level = exports.$Enums.user_accounts_permission_level = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  ACCOUNTANT: 'ACCOUNTANT',
  VIEWER: 'VIEWER'
};

exports.Prisma.ModelName = {
  account_movements: 'account_movements',
  accounts: 'accounts',
  audit_logs: 'audit_logs',
  clients: 'clients',
  exchange_rates: 'exchange_rates',
  expenses: 'expenses',
  internal_transfers: 'internal_transfers',
  invoices: 'invoices',
  invoice_items: 'invoice_items',
  operations: 'operations',
  operation_files: 'operation_files',
  payments: 'payments',
  product_account_compatibility: 'product_account_compatibility',
  products: 'products',
  user_accounts: 'user_accounts',
  users: 'users',
  meta_ads_accounts: 'meta_ads_accounts',
  meta_ads_deductions: 'meta_ads_deductions',
  alerts: 'alerts',
  alert_dismissals: 'alert_dismissals',
  settings: 'settings'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
