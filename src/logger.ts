import debug from "debug";

/** Modified from Original */
const logger = debug("DirtRoad:KMS:");

export const trace = (namespace: string) => logger.extend(`trace:${namespace}`);
export const info = (namespace: string) => logger.extend(`info:${namespace}`);
export const error = (namespace: string) => logger.extend(`error:${namespace}`);

export const getLogger = (namespace: string) => ({
    trace: trace(namespace),
    info: info(namespace),
    error: error(namespace),
});
