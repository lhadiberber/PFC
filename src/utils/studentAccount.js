const STUDENT_ACCOUNT_KEY = "studentAccountMeta";

function normalizeText(value, fallback = "") {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  return normalizedValue || fallback;
}

function readStoredProfileFallback() {
  try {
    const rawProfile = localStorage.getItem("studentProfile");
    if (!rawProfile) {
      return {
        nom: "",
        prenom: "",
        email: "",
      };
    }

    const parsedProfile = JSON.parse(rawProfile);
    return {
      nom: normalizeText(parsedProfile.nom),
      prenom: normalizeText(parsedProfile.prenom),
      email: normalizeText(parsedProfile.email),
    };
  } catch (error) {
    return {
      nom: "",
      prenom: "",
      email: "",
    };
  }
}

function getBrowserLabel() {
  if (typeof navigator === "undefined") {
    return "Navigateur non detecte";
  }

  const userAgent = navigator.userAgent;

  if (userAgent.includes("Edg")) {
    return "Microsoft Edge";
  }

  if (userAgent.includes("Chrome")) {
    return "Google Chrome";
  }

  if (userAgent.includes("Firefox")) {
    return "Mozilla Firefox";
  }

  if (userAgent.includes("Safari")) {
    return "Safari";
  }

  return userAgent.replace(/\s+/g, " ").slice(0, 120);
}

export function getDefaultStudentAccount() {
  const fallbackProfile = readStoredProfileFallback();

  return {
    firstName: fallbackProfile.prenom || "",
    lastName: fallbackProfile.nom || "",
    email: fallbackProfile.email || normalizeText(localStorage.getItem("userEmail")),
    password: "",
    accountCreatedAt: "",
    lastLoginAt: "",
    lastLoginBrowser: "",
    lastPasswordUpdatedAt: "",
    accountStatus: "Actif",
  };
}

export function readStoredStudentAccount() {
  const defaultAccount = getDefaultStudentAccount();

  try {
    const rawAccount = localStorage.getItem(STUDENT_ACCOUNT_KEY);
    if (!rawAccount) {
      return defaultAccount;
    }

    const parsedAccount = JSON.parse(rawAccount);
    return {
      ...defaultAccount,
      ...parsedAccount,
      firstName: normalizeText(parsedAccount.firstName, defaultAccount.firstName),
      lastName: normalizeText(parsedAccount.lastName, defaultAccount.lastName),
      email: normalizeText(parsedAccount.email, defaultAccount.email),
      password: normalizeText(parsedAccount.password),
      accountCreatedAt: normalizeText(parsedAccount.accountCreatedAt, defaultAccount.accountCreatedAt),
      lastLoginAt: normalizeText(parsedAccount.lastLoginAt),
      lastLoginBrowser: normalizeText(parsedAccount.lastLoginBrowser),
      lastPasswordUpdatedAt: normalizeText(
        parsedAccount.lastPasswordUpdatedAt,
        defaultAccount.lastPasswordUpdatedAt
      ),
      accountStatus: normalizeText(parsedAccount.accountStatus, defaultAccount.accountStatus),
    };
  } catch (error) {
    return defaultAccount;
  }
}

export function writeStoredStudentAccount(account) {
  const nextAccount = {
    ...readStoredStudentAccount(),
    ...account,
  };

  nextAccount.firstName = normalizeText(nextAccount.firstName);
  nextAccount.lastName = normalizeText(nextAccount.lastName);
  nextAccount.email = normalizeText(nextAccount.email, normalizeText(localStorage.getItem("userEmail")));
  nextAccount.password = normalizeText(nextAccount.password);
  nextAccount.accountStatus = normalizeText(nextAccount.accountStatus, "Actif");

  localStorage.setItem(STUDENT_ACCOUNT_KEY, JSON.stringify(nextAccount));
  window.dispatchEvent(new Event("student:account-updated"));

  return nextAccount;
}

export function registerStudentAccount({ email, password, firstName = "", lastName = "" }) {
  const currentAccount = readStoredStudentAccount();
  const now = new Date().toISOString();

  return writeStoredStudentAccount({
    ...currentAccount,
    email: normalizeText(email, currentAccount.email),
    password: normalizeText(password, currentAccount.password),
    firstName: normalizeText(firstName, currentAccount.firstName),
    lastName: normalizeText(lastName, currentAccount.lastName),
    accountCreatedAt: currentAccount.accountCreatedAt || now,
    lastPasswordUpdatedAt: normalizeText(password) ? now : currentAccount.lastPasswordUpdatedAt,
    accountStatus: "Actif",
  });
}

export function syncStudentAccountProfile(profile) {
  const currentAccount = readStoredStudentAccount();
  const now = new Date().toISOString();

  return writeStoredStudentAccount({
    ...currentAccount,
    firstName: normalizeText(profile.prenom, currentAccount.firstName),
    lastName: normalizeText(profile.nom, currentAccount.lastName),
    email: normalizeText(profile.email, currentAccount.email),
    accountCreatedAt: currentAccount.accountCreatedAt || now,
    accountStatus: "Actif",
  });
}

export function isValidStudentCredentials(email, password) {
  const account = readStoredStudentAccount();
  const normalizedEmail = normalizeText(email).toLowerCase();
  const accountEmail = normalizeText(account.email).toLowerCase();

  if (accountEmail && normalizedEmail !== accountEmail) {
    return false;
  }

  if (account.password) {
    return normalizeText(password) === account.password;
  }

  return Boolean(normalizedEmail);
}

export function registerStudentLogin(email) {
  const currentAccount = readStoredStudentAccount();

  return writeStoredStudentAccount({
    ...currentAccount,
    email: normalizeText(email, currentAccount.email),
    accountCreatedAt: currentAccount.accountCreatedAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    lastLoginBrowser: getBrowserLabel(),
    accountStatus: "Actif",
  });
}

export function updateStudentPassword(currentPassword, nextPassword) {
  const currentAccount = readStoredStudentAccount();
  const normalizedCurrentPassword = normalizeText(currentPassword);

  if (currentAccount.password && normalizedCurrentPassword !== currentAccount.password) {
    return {
      success: false,
      message: "Le mot de passe actuel est incorrect.",
    };
  }

  writeStoredStudentAccount({
    ...currentAccount,
    password: normalizeText(nextPassword),
    lastPasswordUpdatedAt: new Date().toISOString(),
    accountStatus: "Actif",
  });

  return {
    success: true,
    message: currentAccount.password
      ? "Mot de passe mis a jour."
      : "Mot de passe enregistre.",
  };
}
