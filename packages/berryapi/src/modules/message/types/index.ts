export type MediaLikeInput = {
  url?: string;
  path?: string;
  base64?: string;
  mimetype?: string;
  fileName?: string;
  caption?: string;
};

export type CommonMessageInput = {
  to: string;
  quoted?: {
    remoteJid: string;
    id: string;
    fromMe?: boolean;
    participant?: string;
  };
  mentions?: string[];
  contextInfo?: Record<string, unknown>;
  forwardingScore?: number;
  ephemeralExpiration?: number;
  statusJidList?: string[];
};
