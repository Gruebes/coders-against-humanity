import log from 'roarr';
import { serializeError } from 'serialize-error';

export default class Logger {
  constructor(startingContext) {
    this.context = { ...startingContext };
    this.log = log;
  }

  child(additionalContext = {}) {
    return this.log.child({ ...this.context, ...additionalContext });
  }

  // addContext(additionalContext) {
  //   this.context = { ...this.context, ...additionalContext };
  // }

  // getContext(message, additionalContext = {}) {
  //   return this.log.getContext({ ...this.context, ...additionalContext }, message);
  // }

  // trace(message, additionalContext = {}) {
  //   this.log.trace({ ...this.context, ...additionalContext }, message);
  // }

  // debug(message, additionalContext = {}) {
  //   this.log.debug({ ...this.context, ...additionalContext }, message);
  // }

  // info(message, additionalContext = {}) {
  //   debugger;
  //   this.log.info({ ...this.context, ...additionalContext }, message);
  // }

  // warn(message, additionalContext = {}) {
  //   this.log.warn({ ...this.context, ...additionalContext }, message);
  // }

  error(err, message) {
    this.log.error(
      {
        error: serializeError(err),
      },
      message
    );
  }

  // fatal(additionalContext, message) {
  //   this.log.fatal({ ...this.context, ...additionalContext, message });
  // }
}

export const logger = new Logger({ application: 'coders-against-humanity' });
