import {sitePageByKeyQuery} from "./queries/pages";
import {fetchLocalized, type Locale} from "../i18n/config";

export interface SitePageContent {
  _id?: string;
  pageKey?: string;
  route?: string;
  title?: string;
  navigationLabel?: string;
  introduction?: string;
  effectiveDate?: string;
  hero?: {
    eyebrow?: string;
    heading?: string;
    subheading?: string;
    backgroundImage?: unknown;
    cta?: unknown;
  };
  sections?: unknown[];
  aboutFacts?: {
    yearsManufacturing?: VerifiedValue;
    unitsShipped?: VerifiedValue;
    countriesServed?: VerifiedValue;
    productPatents?: VerifiedValue;
    founderExperience?: VerifiedValue;
    founderFactoryRole?: VerifiedValue;
    founderClientRole?: VerifiedValue;
    factorySize?: VerifiedValue;
    machines?: VerifiedValue;
    productionLines?: VerifiedValue;
    annualCapacity?: VerifiedValue;
    milestones?: Array<{
      _key?: string;
      year?: string;
      title?: string;
      description?: string;
      confirmed?: boolean;
    }>;
  };
  factoryFacts?: {
    floorArea?: VerifiedValue;
    teamMembers?: VerifiedValue;
    productionLines?: VerifiedValue;
    manufacturingSteps?: VerifiedValue;
    manufacturingStages?: Array<{
      _key?: string;
      number?: string;
      title?: string;
      description?: string;
      tag?: string;
      image?: unknown;
    }>;
    cncTolerance?: VerifiedValue;
    annualCapacity?: VerifiedValue;
    productionTeam?: VerifiedValue;
    totalTeam?: VerifiedValue;
    certifications?: VerifiedValue[];
    dedicatedLines?: VerifiedValue;
    mutualNda?: VerifiedValue;
    nonSupplyCommitment?: VerifiedValue;
  };
  legalBody?: unknown[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: unknown;
  };
}

export interface VerifiedValue {
  value?: string;
  confirmed?: boolean;
  evidence?: string;
  confirmedBy?: string;
  confirmedAt?: string;
}

export function getConfirmedValue(
  fact: VerifiedValue | null | undefined,
): string | null {
  const value = fact?.value?.trim();
  return fact?.confirmed && value ? value : null;
}

/**
 * Fixed-page content is intentionally optional. Existing hardcoded page copy
 * remains the safe fallback until an operator creates and publishes the
 * corresponding singleton in Studio.
 */
export async function getSitePage(
  pageKey: string,
  locale: Locale = "en",
): Promise<SitePageContent | null> {
  try {
    return await fetchLocalized<SitePageContent | null>(
      sitePageByKeyQuery,
      {pageKey},
      locale,
    );
  } catch {
    return null;
  }
}
