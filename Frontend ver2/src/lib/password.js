// Password rules, the same ones the backend checks (app/api/routes/users.py → _check_password).
// Used by the Forgot password screen and the Add/Edit user form.

export const PASSWORD_EXAMPLE = 'Infirmary#2026';

export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { id: 'upper', label: 'One capital letter (A–Z)', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'number', label: 'One number (0–9)', test: (pw) => /[0-9]/.test(pw) },
  { id: 'symbol', label: 'One symbol, such as ! # @ $', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

/** True when the password passes every rule. */
export const meetsPasswordRules = (pw) => PASSWORD_RULES.every((r) => r.test(pw));
