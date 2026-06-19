// Shared configuration for all applications

export const API_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const AUTH_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBER: true,
  PASSWORD_REQUIRE_SPECIAL: true,
  SESSION_TIMEOUT: 3600000, // 1 hour in milliseconds
  MAX_CONCURRENT_SESSIONS: 5,
} as const;

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const GEO_CONFIG = {
  DEFAULT_ZOOM: 13,
  GPS_ACCURACY_THRESHOLD: 30, // meters
  MOVEMENT_THRESHOLD: 10, // meters
  GEOFENCE_COOLDOWN: 120000, // 2 minutes in milliseconds
} as const;

export const WEIGHT_CONFIG = {
  SAFE_THRESHOLD: 80, // percentage
  WARNING_THRESHOLD: 95, // percentage
  NEAR_CAPACITY_THRESHOLD: 100, // percentage
  OVERLOADED_THRESHOLD: 100, // percentage
} as const;

export const SLA_CONFIG = {
  DELIVERY_HOURS: 12,
  AT_RISK_HOURS: 11,
  BREACH_THRESHOLD: 12, // hours
} as const;

export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const;

export type Environment = typeof ENVIRONMENTS[keyof typeof ENVIRONMENTS];
