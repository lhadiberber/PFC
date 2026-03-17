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
  const parts = normalizeText(fullName, "Administrateur PFC")
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
  } catch (error) {
    return "light";
  }
}

export function getDefaultAdminProfile() {
  return {
    firstName: "Lhadi",
    lastName: "Berber",
    fullName: "Lhadi Berber",
    email: DEFAULT_ADMIN_EMAIL,
    phone: "+213 555 12 34 56",
    role: "Administrateur",
    service: "Service des admissions",
    accountCreatedAt: DEFAULT_ACCOUNT_CREATED_AT,
    notificationsEnabled: true,
    dailySummary: true,
    themePreference: getStoredDarkModePreference(),
  };
}

export function readStoredAdminProfile() {
  const defaultProfile = getDefaultAdminProfile();

  try {
    const rawProfile = localStorage.getItem(ADMIN_PROFILE_KEY);
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
      firstName,
      lastName,
      fullName,
      email: normalizeText(parsedProfile.email, defaultProfile.email),
      phone: normalizeText(parsedProfile.phone, defaultProfile.phone),
      role: normalizeText(parsedProfile.role, defaultProfile.role),
      service: normalizeText(
        parsedProfile.service || parsedProfile.organization,
        defaultProfile.service
      ),
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
  } catch (error) {
    return defaultProfile;
  }
}

export function writeStoredAdminProfile(profile) {
  const safeProfile = {
    ...readStoredAdminProfile(),
    ...profile,
  };

  safeProfile.firstName = normalizeText(safeProfile.firstName, "Administrateur");
  safeProfile.lastName = normalizeText(safeProfile.lastName);
  safeProfile.fullName = normalizeText(
    `${safeProfile.firstName} ${safeProfile.lastName}`.trim(),
    safeProfile.fullName
  );
  safeProfile.email = normalizeText(safeProfile.email, DEFAULT_ADMIN_EMAIL);
  safeProfile.role = normalizeText(safeProfile.role, "Administrateur");
  safeProfile.service = normalizeText(safeProfile.service, "Service des admissions");
  safeProfile.phone = normalizeText(safeProfile.phone);

  localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(safeProfile));
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

export function readAdminSecurity() {
  const defaultSecurity = getDefaultAdminSecurity();

  try {
    const rawSecurity = localStorage.getItem(ADMIN_SECURITY_KEY);
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
  } catch (error) {
    return defaultSecurity;
  }
}

export function writeAdminSecurity(security) {
  const safeSecurity = {
    ...readAdminSecurity(),
    ...security,
  };

  safeSecurity.password = normalizeText(safeSecurity.password, DEFAULT_ADMIN_PASSWORD);
  safeSecurity.accountStatus = normalizeText(safeSecurity.accountStatus, "Actif");

  localStorage.setItem(ADMIN_SECURITY_KEY, JSON.stringify(safeSecurity));
  window.dispatchEvent(new Event("admin:security-updated"));

  return safeSecurity;
}

export function isValidAdminCredentials(email, password) {
  const adminProfile = readStoredAdminProfile();
  const adminSecurity = readAdminSecurity();

  return (
    normalizeText(email).toLowerCase() === adminProfile.email.toLowerCase() &&
    normalizeText(password) === adminSecurity.password
  );
}

export function registerAdminLogin(email) {
  const adminProfile = readStoredAdminProfile();
  const adminSecurity = readAdminSecurity();
  const browserLabel =
    typeof navigator !== "undefined"
      ? navigator.userAgent.replace(/\s+/g, " ").slice(0, 120)
      : "Navigateur non detecte";

  if (normalizeText(email) && normalizeText(email) !== adminProfile.email) {
    writeStoredAdminProfile({
      ...adminProfile,
      email: normalizeText(email, adminProfile.email),
    });
  }

  return writeAdminSecurity({
    ...adminSecurity,
    lastLoginAt: new Date().toISOString(),
    lastLoginBrowser: browserLabel,
    accountStatus: "Actif",
  });
}

export function updateAdminPassword(currentPassword, nextPassword) {
  const adminSecurity = readAdminSecurity();

  if (normalizeText(currentPassword) !== adminSecurity.password) {
    return {
      success: false,
      message: "Le mot de passe actuel est incorrect.",
    };
  }

  writeAdminSecurity({
    ...adminSecurity,
    password: normalizeText(nextPassword),
    lastPasswordUpdatedAt: new Date().toISOString(),
  });

  return {
    success: true,
    message: "Mot de passe mis a jour.",
  };
}
