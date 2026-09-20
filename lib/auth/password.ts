// Shared with AuthForm (sign-up) and AccountSecurityForm (guest -> permanent
// account upgrade) so the two places a password is first set can't drift.
export const MIN_PASSWORD_LENGTH = 10;

export function validatePassword(pw: string): string | null {
  if (pw.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) {
    return "Password must include both letters and numbers.";
  }
  return null;
}
