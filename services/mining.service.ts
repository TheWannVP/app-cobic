import api from './api.client';

export interface MiningStatus {
  canMine: boolean;
  miningRate: string;
  baseMiningRate: string;
  userMiningRate: string;
  lastMiningTime: string;
  nextMiningTime: string;
  cooldownHours: number;
}

export interface MiningResult {
  amount: string;
  balance: string;
}

export interface MiningStats {
  totalMined: string;
  miningRate: string;
  miningCount: number;
  firstMiningTime: string;
  lastMiningTime: string;
}

export interface DailyCheckInResult {
  amount: string;
  balance: string;
}

export const miningService = {
  getMiningStatus: async (): Promise<MiningStatus> => {
    const response = await api.get('/mining/status');
    return response.data;
  },

  mine: async (): Promise<MiningResult> => {
    const response = await api.post('/mining/mine');
    return response.data;
  },

  getMiningStats: async (): Promise<MiningStats> => {
    const response = await api.get('/mining/stats');
    return response.data;
  },

  checkIn: async (): Promise<DailyCheckInResult> => {
    const response = await api.post('/mining/check-in');
    return response.data;
  }
}; 