import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ServiceNowConfig, ServiceNowQueryResult } from './service-now.types';

@Injectable()
export class ServiceNowClient {
  private client: AxiosInstance | null = null;
  private config: ServiceNowConfig | null = null;

  configure(config: ServiceNowConfig) {
    this.config = config;
    const baseURL = `${config.instanceUrl}/api/now/table`;

    this.client = axios.create({
      baseURL,
      auth: {
        username: config.username,
        password: config.password,
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (config.clientId && config.clientSecret) {
      this.client.interceptors.request.use((cfg) => {
        return this.getAccessToken().then((token) => {
          cfg.headers.Authorization = `Bearer ${token}`;
          return cfg;
        });
      });
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!this.config) throw new Error('ServiceNow not configured');

    const response = await axios.post(
      `${this.config.instanceUrl}/oauth_token.do`,
      null,
      {
        params: {
          grant_type: 'password',
          username: this.config.username,
          password: this.config.password,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        },
      }
    );

    return response.data.access_token;
  }

  async query(table: string, params: {
    sysparm_limit?: number;
    sysparm_offset?: number;
    sysparm_query?: string;
    sysparm_fields?: string;
  } = {}): Promise<ServiceNowQueryResult> {
    if (!this.client) throw new Error('ServiceNow client not initialized');

    const response = await this.client.get(`/${table}`, {
      params: {
        sysparm_limit: params.sysparm_limit || 1000,
        sysparm_offset: params.sysparm_offset || 0,
        sysparm_query: params.sysparm_query,
        sysparm_fields: params.sysparm_fields,
      },
    });

    return {
      result: response.data.result,
      totalCount: parseInt(response.headers['x-total-count'] || '0', 10),
    };
  }

  async getRecord(table: string, sysId: string): Promise<any> {
    if (!this.client) throw new Error('ServiceNow client not initialized');

    const response = await this.client.get(`/${table}/${sysId}`);
    return response.data.result;
  }

  async updateRecord(table: string, sysId: string, data: any): Promise<any> {
    if (!this.client) throw new Error('ServiceNow client not initialized');

    const response = await this.client.patch(`/${table}/${sysId}`, data);
    return response.data.result;
  }

  async createRecord(table: string, data: any): Promise<any> {
    if (!this.client) throw new Error('ServiceNow client not initialized');

    const response = await this.client.post(`/${table}`, data);
    return response.data.result;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.client) return { success: false, message: 'Client not initialized' };

    try {
      await this.client.get('/cmdb_ci?sysparm_limit=1');
      return { success: true, message: 'Connection successful' };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.error?.message || error.message || 'Connection failed',
      };
    }
  }
}