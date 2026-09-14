/**
 * Builds an audit logger closure bound to the current request, so admin
 * handlers can record actions with a one-liner.
 */
export const makeAuditLogger = (auditRepo) => (req) => async ({
  action,
  entityType,
  entityId = null,
  oldValues = null,
  newValues = null,
}) => {
  try {
    await auditRepo.insert({
      actorId: req.user?.id ?? null,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress: req.ip || null,
      userAgent: (req.headers["user-agent"] || "").slice(0, 500),
    });
  } catch (err) {
    // Auditing must never take down the request that triggered it.
    console.error("[audit] failed to record:", err.message);
  }
};

export default makeAuditLogger;