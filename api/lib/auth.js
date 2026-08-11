import { createClient } from "../lib/supabase-rest.js";
class RequestAuthError extends Error {
  status;
  constructor(message, status = 401) {
    super(message);
    this.status = status;
    this.name = "RequestAuthError";
  }
}
const BEARER = /^Bearer\s+(.+)$/i;
function extractToken(req) {
  const header = req.headers["authorization"] || req.headers["Authorization"];
  if (!header) return null;
  const m = BEARER.exec(header.trim());
  return m ? m[1] : null;
}
async function getAuthorizedContext(req, allowAnonymous = false) {
  const supabase = createClient();
  const token = extractToken(req);
  if (!token) {
    if (allowAnonymous) return null;
    throw new RequestAuthError("Missing Authorization header");
  }
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    if (allowAnonymous) return null;
    throw new RequestAuthError("Invalid or expired token", 401);
  }
  const user = userData.user;
  const userId = user.id;
  let role = user?.app_metadata?.role ?? "leader";
  let organizationId = user?.app_metadata?.organization_id ?? null;
  let tier = null;
  try {
    const { data: profile, error: pErr } = await supabase.from("profiles").select("role, organization_id, tier, id, email").eq("id", userId).limit(1).maybeSingle();
    if (!pErr && profile) {
      if (profile.role) role = profile.role;
      if (profile.organization_id) organizationId = profile.organization_id;
      if (profile.tier) tier = profile.tier;
    }
  } catch {
  }
  return {
    userId,
    email: user.email ?? null,
    role,
    organizationId,
    tier
  };
}
function isAdminRole(role) {
  if (!role) return false;
  return ["admin", "lyc_admin", "super_admin"].includes(role);
}
function isConsultantRole(role) {
  if (!role) return false;
  return isAdminRole(role) || ["consultant", "lyc_consultant"].includes(role);
}
function isClientRole(role) {
  if (!role) return false;
  return ["client", "client_admin", "client_viewer"].includes(role);
}
function isInternalStaff(role) {
  return isConsultantRole(role) || isAdminRole(role);
}
function isLeaderRole(role) {
  if (!role) return true;
  return !isInternalStaff(role) && !isClientRole(role);
}
function enforceScope(ctx, opts) {
  const { allow = [], requireOrgMatchWith, ownerUserId } = opts;
  if (ownerUserId && ownerUserId === ctx.userId) return;
  let pass = false;
  for (const r of allow) {
    if (r === "admin" && isAdminRole(ctx.role)) pass = true;
    if (r === "consultant" && isConsultantRole(ctx.role)) pass = true;
    if (r === "client" && isClientRole(ctx.role)) pass = true;
    if ((r === "leader" || r === "candidate") && isLeaderRole(ctx.role)) pass = true;
  }
  if (!pass) {
    throw new RequestAuthError(
      `Role "${ctx.role}" not allowed for this endpoint`,
      403
    );
  }
  if (requireOrgMatchWith !== void 0 && isClientRole(ctx.role)) {
    if (!ctx.organizationId || String(requireOrgMatchWith) !== String(ctx.organizationId)) {
      throw new RequestAuthError("Organization scope mismatch", 403);
    }
  }
}
export {
  RequestAuthError,
  enforceScope,
  extractToken,
  getAuthorizedContext,
  isAdminRole,
  isClientRole,
  isConsultantRole,
  isInternalStaff,
  isLeaderRole
};
