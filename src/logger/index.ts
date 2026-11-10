import winston from 'winston';

export class Logger {
  private winston: any;
  requestId: string = '';
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

  info(message: string, meta?: object) {
    this.winston.info(message, meta);
  }

  error(message: string, meta?: object) {
    this.winston.error(message, meta);
  }

  warn(message: string, meta?: object) {
    this.winston.warn(message, meta);
  }
}
