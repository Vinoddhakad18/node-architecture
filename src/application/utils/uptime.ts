/**
 * Server uptime tracking utility
 */

let serverStartTime: Date;

/**
 * Initialize server start time
 */
export const initializeServerStartTime = (): void => {
  serverStartTime = new Date();
};

/**
 * Get server start time
 */
export const getServerStartTime = (): Date => {
  if (!serverStartTime) {
    throw new Error('Server start time not initialized');
  }
  return serverStartTime;
};

/**
 * Get server uptime in seconds
 */
export const getServerUptimeInSeconds = (): number => {
  return process.uptime();
};

/**
 * Get server uptime in a human-readable format
 */
export const getFormattedServerUptime = (): string => {
  const uptimeInSeconds = getServerUptimeInSeconds();
  const days = Math.floor(uptimeInSeconds / 86400);
  const hours = Math.floor((uptimeInSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeInSeconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(' ');
};

/**
 * Get complete uptime information
 */
export const getUptimeInfo = () => {
  return {
    startTime: getServerStartTime(),
    uptimeSeconds: getServerUptimeInSeconds(),
    uptimeFormatted: getFormattedServerUptime(),
  };
};
