const ADMIN_PROFILE_KEY = "adminProfile";
const ADMIN_SECURITY_KEY = "adminSecurityMeta";
const ADMIN_DARK_MODE_KEY = "adminDarkMode";

const DEFAULT_ACCOUNT_CREATED_AT = "2026-01-08T09:00:00.000Z";
const DEFAULT_PASSWORD_UPDATED_AT = "2026-01-12T10:15:00.000Z";

export const DEFAULT_ADMIN_EMAIL = "lhadiberber@gmail.com";
export const DEFAULT_ADMIN_PASSWORD = "123";

function normalizeText(value, fallback = "") {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  return normalizedValue || fallback;
}

function splitFullName(fullName) {
  const parts = normalizeText(fullName, "Administrateur")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: "",
    };
  }

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function getStoredDarkModePreference() {
  try {
    return localStorage.getItem(ADMIN_DARK_MODE_KEY) === "true" ? "dark" : "light";
  } catch (_error) {
    return "light";
  }
}

function getAccountStorageScope(account = {}) {
  if (account?.id) {
    return `id-${account.id}`;
  }

  const email = normalizeText(account?.email).toLowerCase();
  if (email) {
    return `email-${email}`;
  }

  return "default";
}

function getProfileStorageKey(account) {
  return `${ADMIN_PROFILE_KEY}:${getAccountStorageScope(account)}`;
}

function getSecurityStorageKey(account) {
  return `${ADMIN_SECURITY_KEY}:${getAccountStorageScope(account)}`;
}

function formatRole(role) {
  if (role === "super_admin") return "Super administrateur";
  if (role === "admin") return "Administrateur";
  return normalizeText(role, "Administrateur");
}

export function getDefaultAdminProfile(account = {}) {
  const derivedName = splitFullName(
    `${normalizeText(account.prenom)} ${normalizeText(account.nom)}`.trim()
  );
  const firstName = normalizeText(account.prenom, derivedName.firstName || "Administrateur");
  const lastName = normalizeText(account.nom, derivedName.lastName);
  const fullName = normalizeText(`${firstName} ${lastName}`.trim(), "Administrateur");
  const service = normalizeText(
    account.assigned_department || account.university_scope,
    "Service des admissions"
  );

  return {
    userId: account.id || "",
    firstName,
    lastName,
    fullName,
    email: normalizeText(account.email, DEFAULT_ADMIN_EMAIL),
    phone: normalizeText(account.telephone),
    role: formatRole(account.role),
    service,
    universityScope: normalizeText(account.university_scope),
    assignedDepartment: normalizeText(account.assigned_department),
    accountCreatedAt: normalizeText(account.created_at, DEFAULT_ACCOUNT_CREATED_AT),
    notificationsEnabled: true,
    dailySummary: true,
    themePreference: getStoredDarkModePreference(),
  };
}

export function readStoredAdminProfile(account = {}) {
  const defaultProfile = getDefaultAdminProfile(account);

  try {
    const rawProfile = localStorage.getItem(getProfileStorageKey(account));
    if (!rawProfile) {
      return defaultProfile;
    }

    const parsedProfile = JSON.parse(rawProfile);
    const fallbackFullName = parsedProfile.fullName || defaultProfile.fullName;
    const derivedName = splitFullName(fallbackFullName);
    const firstName = normalizeText(parsedProfile.firstName, derivedName.firstName);
    const lastName = normalizeText(parsedProfile.lastName, derivedName.lastName);
    const fullName = normalizeText(
      `${firstName} ${lastName}`.trim(),
      normalizeText(parsedProfile.fullName, defaultProfile.fullName)
    );

    return {
      ...defaultProfile,
      ...parsedProfile,
      userId: defaultProfile.userId,
      firstName,
      lastName,
      fullName,
      email: normalizeText(parsedProfile.email, defaultProfile.email),
      phone: normalizeText(parsedProfile.phone, defaultProfile.phone),
      role: defaultProfile.role,
      service: normalizeText(
        parsedProfile.service || parsedProfile.organization,
        defaultProfile.service
      ),
      universityScope: defaultProfile.universityScope,
      assignedDepartment: defaultProfile.assignedDepartment,
      accountCreatedAt:
        normalizeText(parsedProfile.accountCreatedAt, "") || defaultProfile.accountCreatedAt,
      notificationsEnabled:
        typeof parsedProfile.notificationsEnabled === "boolean"
          ? parsedProfile.notificationsEnabled
          : typeof parsedProfile.notifyNewApplications === "boolean"
            ? parsedProfile.notifyNewApplications
            : defaultProfile.notificationsEnabled,
      dailySummary:
        typeof parsedProfile.dailySummary === "boolean"
          ? parsedProfile.dailySummary
          : defaultProfile.dailySummary,
      themePreference: normalizeText(
        parsedProfile.themePreference,
        defaultProfile.themePreference
      ),
    };
  } catch (_error) {
    return defaultProfile;
  }
}

export function writeStoredAdminProfile(profile, account = {}) {
  const defaultProfile = getDefaultAdminProfile(account);
  const safeProfile = {
    ...readStoredAdminProfile(account),
    ...profile,
  };

  safeProfile.userId = defaultProfile.userId;
  safeProfile.firstName = normalizeText(safeProfile.firstName, "Administrateur");
  safeProfile.lastName = normalizeText(safeProfile.lastName);
  safeProfile.fullName = normalizeText(
    `${safeProfile.firstName} ${safeProfile.lastName}`.trim(),
    safeProfile.fullName
  );
  safeProfile.email = normalizeText(safeProfile.email, defaultProfile.email);
  safeProfile.role = defaultProfile.role;
  safeProfile.service = normalizeText(safeProfile.service, defaultProfile.service);
  safeProfile.phone = normalizeText(safeProfile.phone);
  safeProfile.universityScope = defaultProfile.universityScope;
  safeProfile.assignedDepartment = defaultProfile.assignedDepartment;

  localStorage.setItem(getProfileStorageKey(account), JSON.stringify(safeProfile));
  localStorage.setItem(
    ADMIN_DARK_MODE_KEY,
    safeProfile.themePreference === "dark" ? "true" : "false"
  );
  window.dispatchEvent(new Event("admin:preferences-updated"));

  return safeProfile;
}

export function getDefaultAdminSecurity() {
  return {
    password: DEFAULT_ADMIN_PASSWORD,
    lastPasswordUpdatedAt: DEFAULT_PASSWORD_UPDATED_AT,
    lastLoginAt: "",
    lastLoginBrowser: "",
    accountStatus: "Actif",
  };
}

export function readAdminSecurity(account = {}) {
  const defaultSecurity = getDefaultAdminSecurity();

  try {
    const rawSecurity = localStorage.getItem(getSecurityStorageKey(account));
    if (!rawSecurity) {
      return defaultSecurity;
    }

    const parsedSecurity = JSON.parse(rawSecurity);
    return {
      ...defaultSecurity,
      ...parsedSecurity,
      password: normalizeText(parsedSecurity.password, defaultSecurity.password),
      accountStatus: normalizeText(parsedSecurity.accountStatus, defaultSecurity.accountStatus),
      lastLoginAt: normalizeText(parsedSecurity.lastLoginAt),
      lastLoginBrowser: normalizeText(parsedSecurity.lastLoginBrowser),
      lastPasswordUpdatedAt: normalizeText(
        parsedSecurity.lastPasswordUpdatedAt,
        defaultSecurity.lastPasswordUpdatedAt
      ),
    };
  } catch (_error) {
    return defaultSecurity;
  }
}

export function writeAdminSecurity(security, account = {}) {
  const safeSecurity = {
    ...readAdminSecurity(account),
    ...security,
  };

  safeSecurity.password = normalizeText(safeSecurity.password, DEFAULT_ADMIN_PASSWORD);
  safeSecurity.accountStatus = normalizeText(safeSecurity.accountStatus, "Actif");

  localStorage.setItem(getSecurityStorageKey(account), JSON.stringify(safeSecurity));
  window.dispatchEvent(new Event("admin:security-updated"));

  return safeSecurity;
}

export function isValidAdminCredentials(email, password, account = {}) {
  const adminProfile = readStoredAdminProfile(account);
  const adminSecurity = readAdminSecurity(account);

  return (
    normalizeText(email).toLowerCase() === adminProfile.email.toLowerCase() &&
    normalizeText(password) === adminSecurity.password
  );
}

export function registerAdminLogin(email, account = {}) {
  const adminProfile = readStoredAdminProfile(account);
  const adminSecurity = readAdminSecurity(account);
  const browserLabel =
    typeof navigator !== "undefined"
      ? navigator.userAgent.replace(/\s+/g, " ").slice(0, 120)
      : "Navigateur non detecte";

  if (normalizeText(email) && normalizeText(email) !== adminProfile.email) {
    writeStoredAdminProfile(
      {
        ...adminProfile,
        email: normalizeText(email, adminProfile.email),
      },
      account
    );
  }

  return writeAdminSecurity(
    {
      ...adminSecurity,
      lastLoginAt: new Date().toISOString(),
      lastLoginBrowser: browserLabel,
      accountStatus: "Actif",
    },
    account
  );
}

export function updateAdminPassword(currentPassword, nextPassword, account = {}) {
  const adminSecurity = readAdminSecurity(account);

  if (normalizeText(currentPassword) !== adminSecurity.password) {
    return {
      success: false,
      message: "Le mot de passe actuel est incorrect.",
    };
  }

  writeAdminSecurity(
    {
      ...adminSecurity,
      password: normalizeText(nextPassword),
      lastPasswordUpdatedAt: new Date().toISOString(),
    },
    account
  );

  return {
    success: true,
    message: "Mot de passe mis a jour.",
  };
}
