export interface LoyaltyAccount {
  _id: string
  userId: string
  totalCoinsEarned: number
  totalCoinsRedeemed: number
  currentBalance: number
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM"
  streakCount: number
  lastActivityDate: string
  createdAt: string
  updatedAt: string
  __v: number
}

export interface CoinsTransaction {
  _id: string
  userId: string
  transactionType: "EARN" | "REDEEM" | "BONUS" | "EXPIRE"
  amount: number
  reason: string
  source: "MANUAL" | "SIGNUP" | "ORDER" | "REFERRAL" | "STREAK"
  metadata?: {
    awardedBy?: string
    orderId?: string
    referralCode?: string
  }
  balanceAfter: number
  expiresAt?: string
  createdAt: string
  updatedAt: string
  __v: number
}

export interface RedemptionOption {
  _id: string
  ruleId: string
  name: string
  description: string
  ruleType: "REDEMPTION"
  redemptionType: "DISCOUNT" | "FREE_ITEM"
  coinsCost: number
  discountValue: number
  minimumOrderForRedemption: number
  coinsExpiryDays: number
  expiryType: "ROLLING" | "FIXED"
  isActive: boolean
  priority: number
  validFrom: string
  conditions: {
    dayOfWeek: string[]
    userTier: string[]
    outletIds: string[]
  }
  createdAt: string
  updatedAt: string
  __v: number
}

export interface TierProgress {
  currentTier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM"
  currentThreshold: number
  nextTier: "SILVER" | "GOLD" | "PLATINUM" | null
  nextThreshold: number
  progress: number
  coinsNeeded: number
}

export interface LoyaltyData {
  account: LoyaltyAccount
  recentTransactions: CoinsTransaction[]
  redemptionOptions: RedemptionOption[]
  tierProgress: TierProgress
}

export interface CoinsApiResponse {
  message: string
  data: LoyaltyData
}

export type CoinsFilter = "all" | "expiring_soon" | "expired"
