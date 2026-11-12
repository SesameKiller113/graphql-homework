import winston from 'winston';

export class Logger {
  private winston: any;
  requestId: string = '';
  client: string | null = null;
  constructor() {
    this.winston = winston.createLogger({
      level: 'info',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      transports: [new winston.transports.Console()],
    });
  }

  setRequestId(requestId: string) {
    this.requestId = requestId;
  }

  setClient(client: string | null) {
    this.client = client;
  }

  info(message: string, meta?: object) {
    this.winston.info(message, { ...meta, requestId: this.requestId, client: this.client });
  }

  error(message: string, meta?: object) {
    this.winston.error(message, { ...meta, requestId: this.requestId, client: this.client });
  }

  warn(message: string, meta?: object) {
    this.winston.warn(message, { ...meta, requestId: this.requestId, client: this.client });
  }
}
