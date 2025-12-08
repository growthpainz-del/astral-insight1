export function isUserAdmin(user) {
  if (!user) return false;

  // Primary check: platform role
  const hasAdminRole = user.role === "admin";

  // Optional email allowlist for extra safety (put your emails here if you want to restrict)
  const allowedAdmins = [
    // "you@yourdomain.com",
    // "cofounder@yourdomain.com",
  ];

  // If no allowlist is set, trust role only
  if (!allowedAdmins || allowedAdmins.length === 0) {
    return hasAdminRole;
  }

  // If allowlist exists, require both admin role and being in the allowlist
  const email = (user.email || "").toLowerCase();
  return hasAdminRole && allowedAdmins.includes(email);
}