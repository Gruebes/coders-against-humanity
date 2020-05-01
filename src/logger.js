import log from 'roarr';
import serializeError from 'serialize-error';

export default class Logger {
  constructor(startingContext) {
    this.context = { ...startingContext };
    this.log = log;
  }
  adopt(additionalContext, message) {
    this.log.adopt({ ...this.context, ...additionalContext }, message);
  }

  child(additionalContext, message) {
    this.log.child({ ...this.context, ...additionalContext }, message);
  }

  addContext(additionalContext) {
    this.context = { ...this.context, ...additionalContext };
  }

  getContext(additionalContext, message) {
    this.log.getContext({ ...this.context, ...additionalContext }, message);
  }

  trace(additionalContext, message) {
    this.log.trace({ ...this.context, ...additionalContext }, message);
  }

  debug(additionalContext, message) {
    this.log.debug({ ...this.context, ...additionalContext }, message);
  }

  info(additionalContext, message) {
    this.log.info({ ...this.context, ...additionalContext }, message);
  }

  warn(additionalContext, message) {
    this.log.warn({ ...this.context, ...additionalContext }, message);
  }

  error(err, message) {
    this.log.error(
      {
        error: serializeError(err),
      },
      message
    );
  }

  fatal(additionalContext, message) {
    this.log.fatal({ ...this.context, ...additionalContext, message });
  }
}
