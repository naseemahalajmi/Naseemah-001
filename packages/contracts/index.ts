export type UserPublic = {
  id: string;
  email: string;
  displayName: string;
};

export type CreateUserRequest = {
  displayName: string;
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type CompletePasswordResetRequest = {
  token: string;
  password: string;
};

export type ApiError = {
  error: string;
};

export type KuwaitRate = {
  currencyCode: string;
  currencyName: string;
  filsPerUnit: string;
};

export type KuwaitRatesSnapshot = {
  sourceUrl: string;
  publishedLabel: string | null;
  fetchedAt: string | null;
  nextRefreshAt: string | null;
  rates: KuwaitRate[];
};
