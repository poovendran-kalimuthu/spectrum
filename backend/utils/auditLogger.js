import AuditLog from '../models/AuditLog.js';

export const logAudit = async (action, details, userId, targetModel = null, targetId = null, payload = null, rawIp = null, targetName = null) => {
  try {
    let ipAddress = rawIp;

    // Convert loopback addresses to a more readable format for local development
    if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
      ipAddress = '127.0.0.1 (Localhost)';
    }

    await AuditLog.create({
      action,
      details,
      user: userId,
      targetModel,
      targetId,
      payload,
      ipAddress,
      targetName
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
};
