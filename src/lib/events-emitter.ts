import { EventEmitter } from 'events';

// Global singleton event emitter across Next.js dev & prod server instances
declare global {
  var globalEventsEmitter: EventEmitter | undefined;
}

export const eventsEmitter = global.globalEventsEmitter || new EventEmitter();
eventsEmitter.setMaxListeners(200);

if (process.env.NODE_ENV !== 'production') {
  global.globalEventsEmitter = eventsEmitter;
}

export interface SystemEventPayload {
  type: 'PROFORMA_UPDATED' | 'PROFORMA_CONFIRMED' | 'INVOICE_CREATED' | 'STOCK_UPDATED' | 'CUSTOMER_UPDATED';
  id?: string;
  proformaNumber?: string;
  status?: string;
  data?: any;
  timestamp: string;
}

export function broadcastSystemEvent(payload: Omit<SystemEventPayload, 'timestamp'>) {
  const fullPayload: SystemEventPayload = {
    ...payload,
    timestamp: new Date().toISOString(),
  };
  eventsEmitter.emit('system-event', fullPayload);
  if (payload.id) {
    eventsEmitter.emit(`entity:${payload.id}`, fullPayload);
  }
}
