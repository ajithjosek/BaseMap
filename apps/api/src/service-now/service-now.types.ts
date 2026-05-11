export interface ServiceNowConfig {
  instanceUrl: string;
  username: string;
  password: string;
  clientId?: string;
  clientSecret?: string;
}

export interface ServiceNowRecord {
  sys_id: string;
  name?: string;
  short_description?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  cmdb_ci?: { display_value: string; value: string };
  install_status?: { display_value: string; value: string };
  u_business_owner?: { display_value: string; value: string };
  u_cost_center?: { display_value: string; value: string };
  u_vendor?: { display_value: string; value: string };
  u_annual_cost?: string;
  u_license_count?: string;
  u_environment?: { display_value: string; value: string };
  [key: string]: any;
}

export interface ServiceNowQueryResult {
  result: ServiceNowRecord[];
  totalCount?: number;
}

export interface ServiceNowFieldMapping {
  sourceField: string;
  targetField: string;
  transform?: 'none' | 'uppercase' | 'lowercase' | 'date' | 'number';
  defaultValue?: string;
}