
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

export interface LogoConfig {
  serverName: string;
  style: string;
  colorScheme: string;
  symbol: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
