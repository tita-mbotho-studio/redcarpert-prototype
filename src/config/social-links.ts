/**
 * Client-supplied social profile handles (17 November 2026).
 * Keep profile targets centralized; footer icons are generated from this list.
 * URLs follow public platform profile patterns, not independently confirmed
 * account ownership or profile availability.
 */
export const OFFICIAL_SOCIAL_LINKS = [
  {
    platform: "Instagram",
    handle: "@Redcarpert_wedding_dresses",
    url: "https://www.instagram.com/Redcarpert_wedding_dresses/",
    icon: "instagram",
  },
  {
    platform: "TikTok",
    handle: "@Redcarpertweddingdresses",
    url: "https://www.tiktok.com/@Redcarpertweddingdresses",
    icon: "tiktok",
  },
  {
    platform: "TikTok",
    handle: "@redcarpertweddinggowns",
    url: "https://www.tiktok.com/@redcarpertweddinggowns",
    icon: "tiktok",
  },
  {
    platform: "Facebook",
    handle: "@redcarpertcouture_bridal",
    url: "https://www.facebook.com/redcarpertcouture_bridal/",
    icon: "facebook-f",
  },
] as const;
