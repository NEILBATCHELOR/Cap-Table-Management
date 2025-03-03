import { Investor } from "@/types/investor";
import { TokenType, Currency } from "@/types/token";

// Generate a random Ethereum address
const generateWalletAddress = () => {
  return `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
};

// Generate a random subscription ID
const generateSubscriptionId = () => {
  return `SUB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
};

// Generate a random transaction hash
const generateTxHash = () => {
  return `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
};

// Generate a random date within the last year
const generateRandomDate = (monthsAgo = 12) => {
  const date = new Date();
  date.setMonth(date.getMonth() - Math.floor(Math.random() * monthsAgo));
  return date;
};

// Generate a KYC expiry date (6 months from a random date)
const generateKYCExpiryDate = (status: string) => {
  if (status === "Verified") {
    const date = new Date();
    // Random between 1-7 months in the future (some about to expire)
    const monthsToAdd = Math.floor(Math.random() * 7) + 1;
    date.setMonth(date.getMonth() + monthsToAdd);
    return date;
  } else if (status === "Expired") {
    const date = new Date();
    // Random between 1-3 months in the past
    const monthsToSubtract = Math.floor(Math.random() * 3) + 1;
    date.setMonth(date.getMonth() - monthsToSubtract);
    return date;
  }
  return undefined;
};

// Generate sample token subscriptions
const generateSubscriptions = (count: number, investorType: string) => {
  const subscriptions = [];
  const tokenTypes: TokenType[] = ["ERC-20", "ERC-1400", "ERC-3525"];
  const currencies: Currency[] = ["USD", "EUR", "GBP"];

  for (let i = 0; i < count; i++) {
    const confirmed = Math.random() > 0.2; // 80% chance of being confirmed
    const allocated = confirmed && Math.random() > 0.3; // 70% chance of being allocated if confirmed
    const distributed = allocated && Math.random() > 0.4; // 60% chance of being distributed if allocated

    const tokenType = tokenTypes[Math.floor(Math.random() * tokenTypes.length)];
    const currency = currencies[Math.floor(Math.random() * currencies.length)];

    // Institutions typically have larger investments
    const baseAmount = investorType === "Institution" ? 50000 : 5000;
    const fiatAmount = baseAmount + Math.floor(Math.random() * baseAmount);

    // Token allocation is roughly proportional to fiat amount
    const tokenAllocation = allocated ? Math.floor(fiatAmount / 10) : undefined;

    subscriptions.push({
      id: `sub-${i}-${Date.now()}`,
      subscriptionId: generateSubscriptionId(),
      tokenType: allocated ? tokenType : undefined,
      fiatSubscription: {
        amount: fiatAmount,
        currency: currency,
      },
      tokenAllocation: tokenAllocation,
      tokenAllocationId: allocated ? `alloc-${i}-${Date.now()}` : undefined,
      confirmed: confirmed,
      allocated: allocated,
      distributed: distributed,
    });
  }

  return subscriptions;
};

// Generate sample investors
export const generateSampleInvestors = (count: number): Investor[] => {
  const investors: Investor[] = [];
  const institutionalTypes = [
    "Pension Fund",
    "Sovereign Wealth Fund",
    "Insurance Company",
    "Endowment & Foundation",
    "Asset Manager & Mutual Fund",
    "Hedge Fund",
    "Private Equity & Venture Capital",
    "Family Office",
    "Bank & Investment Firm",
  ];
  const retailTypes = ["High-Net-Worth Individual", "Mass Affluent Investor"];
  const corporateTypes = [
    "Corporate & Conglomerate",
    "Private Company & Holding",
    "Strategic Investor",
  ];
  const governmentTypes = [
    "Sovereign Wealth Fund",
    "Development Finance Institution",
    "Government Investment Vehicle",
    "Multilateral Institution",
  ];
  const alternativeTypes = [
    "Real Estate Investment Trust",
    "Infrastructure Investor",
    "Commodities & Natural Resources Fund",
    "Distressed & Special Situations Investor",
    "Quantitative & Algorithmic Investor",
  ];
  const cryptoTypes = ["Institutional Crypto Investor"];

  // Combine all types for random selection
  const allTypes = [
    ...institutionalTypes,
    ...retailTypes,
    ...corporateTypes,
    ...governmentTypes,
    ...alternativeTypes,
    ...cryptoTypes,
    "Individual",
    "Institution",
  ];

  const kycStatuses = ["Verified", "Pending", "Expired"];
  const firstNames = [
    "John",
    "Jane",
    "Michael",
    "Sarah",
    "David",
    "Emma",
    "Robert",
    "Olivia",
    "William",
    "Sophia",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Miller",
    "Davis",
    "Garcia",
    "Rodriguez",
    "Wilson",
  ];
  const companyNames = [
    "Acme Capital",
    "Venture Partners",
    "Global Investments",
    "Horizon Fund",
    "Summit Ventures",
    "Pinnacle Equity",
    "Frontier Capital",
    "Quantum Holdings",
    "Atlas Investments",
    "Meridian Group",
  ];

  for (let i = 0; i < count; i++) {
    const type = allTypes[
      Math.floor(Math.random() * allTypes.length)
    ] as InvestorType;
    const kycStatus = kycStatuses[
      Math.floor(Math.random() * kycStatuses.length)
    ] as "Verified" | "Expired" | "Pending";

    let name;
    let email;

    if (type === "Individual") {
      const firstName =
        firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      name = `${firstName} ${lastName}`;
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    } else {
      const companyName =
        companyNames[Math.floor(Math.random() * companyNames.length)];
      name = companyName;
      email = `investments@${companyName.toLowerCase().replace(/\s+/g, "")}.com`;
    }

    // Generate 1-3 subscriptions per investor
    const subscriptionCount = Math.floor(Math.random() * 3) + 1;

    investors.push({
      id: `inv-${i}-${Date.now()}`,
      name: name,
      email: email,
      type: type,
      kycStatus: kycStatus,
      wallet: generateWalletAddress(),
      selected: false,
      kycExpiryDate: generateKYCExpiryDate(kycStatus),
      country: "USA",
      accreditationStatus: "Accredited",
      investorId: `INV${1000 + i}`,
      subscriptions: generateSubscriptions(subscriptionCount, type),
    });
  }

  return investors;
};

// Export a fixed set of sample data
export const sampleInvestors = generateSampleInvestors(20);
