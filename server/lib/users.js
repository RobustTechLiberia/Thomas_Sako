/** Strips sensitive fields before returning a user to clients. */
export const publicUser = (user) => {
  if (!user) return null;
  const { passwordHash, password_hash, ...rest } = user;
  return rest;
};

export default publicUser;
