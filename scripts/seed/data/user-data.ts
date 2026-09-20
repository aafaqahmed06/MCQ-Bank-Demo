import type { UserProfile } from "@/types";

export type CollegeSeed = {
  name: string;
  city: string;
  /**
   * Curated, verified common acronym. Omit when a college has no
   * well-established public acronym rather than inventing one -- seed-mcqs.ts
   * falls back to a mechanical initials-based short name (and dedupes any
   * collisions) for every entry without one.
   */
  shortName?: string;
};

/**
 * Every PMDC-recognized (Pakistan Medical & Dental Council) MBBS-granting
 * medical college, public and private, fetched from the regulator's own
 * site (pmdc.pk/Colleges/PublicMedicalColleges,
 * pmdc.pk/Colleges/PrivateMedicalColleges) plus a cross-check against NUMS's
 * (National University of Medical Sciences) own affiliated-college list,
 * which surfaced one PMDC-listed-but-missing-here entry (Fazaia Ruth Pfau
 * Medical College) now included below. Acronyms are only set where they are
 * genuinely well-known/commonly used -- see CollegeSeed above.
 */
export const PAKISTAN_MEDICAL_COLLEGES: CollegeSeed[] = [
  // ── Public sector ──────────────────────────────────────────────────
  { name: "Azad Jammu & Kashmir Medical College", city: "Muzaffarabad", shortName: "AJKMC" },
  { name: "Mohtarma Benazir Bhutto Shaheed Medical College", city: "Mirpur" },
  { name: "Poonch Medical College", city: "Rawalakot" },
  { name: "Bolan Medical College", city: "Quetta", shortName: "BMC" },
  { name: "Jhalawan Medical College", city: "Khuzdar" },
  { name: "Loralai Medical College", city: "Loralai" },
  { name: "Makran Medical College", city: "Turbat" },
  { name: "Ayub Medical College", city: "Abbottabad" },
  { name: "Bacha Khan Medical College", city: "Mardan" },
  { name: "Bannu Medical College", city: "Bannu" },
  { name: "Gajju Khan Medical College", city: "Swabi" },
  { name: "Gomal Medical College", city: "Dera Ismail Khan", shortName: "GMC" },
  { name: "Khyber Girls Medical College", city: "Peshawar", shortName: "KGMC" },
  { name: "Khyber Medical College", city: "Peshawar", shortName: "KMC" },
  { name: "KMU Institute of Medical Sciences", city: "Kohat" },
  { name: "Nowshera Medical College", city: "Nowshera" },
  { name: "Saidu Medical College", city: "Swat" },
  { name: "Allama Iqbal Medical College", city: "Lahore", shortName: "AIMC" },
  { name: "Ameer-ud-Din Medical College (PGMI)", city: "Lahore" },
  { name: "Army Medical College", city: "Rawalpindi", shortName: "AMC" },
  { name: "D.G. Khan Medical College", city: "Dera Ghazi Khan" },
  { name: "Fatima Jinnah Medical College for Women", city: "Lahore", shortName: "FJMC" },
  { name: "Federal Medical College", city: "Islamabad" },
  { name: "Gujranwala Medical College", city: "Gujranwala" },
  { name: "Khawaja Muhammad Safdar Medical College", city: "Sialkot" },
  { name: "King Edward Medical University", city: "Lahore", shortName: "KEMU" },
  { name: "Narowal Medical College", city: "Narowal" },
  { name: "Nawaz Sharif Medical College", city: "Gujrat" },
  { name: "Nishtar Medical College", city: "Multan", shortName: "NMC" },
  { name: "Punjab Medical College", city: "Faisalabad", shortName: "PMC" },
  { name: "Quaid-e-Azam Medical College", city: "Bahawalpur", shortName: "QAMC" },
  { name: "Rawalpindi Medical College", city: "Rawalpindi", shortName: "RMC" },
  { name: "Sahiwal Medical College", city: "Sahiwal" },
  { name: "Sargodha Medical College", city: "Sargodha" },
  { name: "Services Institute of Medical Sciences", city: "Lahore", shortName: "SIMS" },
  { name: "Shaikh Khalifa Bin Zayed Al-Nahyan Medical & Dental College", city: "Lahore" },
  { name: "Sheikh Zayed Medical College", city: "Rahim Yar Khan", shortName: "SZMC" },
  { name: "Bilawal Medical College", city: "Jamshoro" },
  { name: "Chandka Medical College", city: "Larkana", shortName: "CMC" },
  { name: "Dow International Medical College", city: "Karachi", shortName: "DIMC" },
  { name: "Dow Medical College", city: "Karachi", shortName: "DMC" },
  { name: "Gambat Medical College", city: "Gambat" },
  { name: "Ghulam Muhammad Mahar Medical College", city: "Sukkur" },
  { name: "Karachi Medical & Dental College", city: "Karachi", shortName: "KMDC" },
  { name: "Liaquat University of Medical & Health Sciences", city: "Jamshoro", shortName: "LUMHS" },
  { name: "Peoples University of Medical & Health Sciences for Women", city: "Nawabshah", shortName: "PUMHSW" },
  { name: "Shaheed Mohtarma Benazir Bhutto Medical College", city: "Lyari, Karachi" },
  { name: "Sindh Medical College", city: "Karachi", shortName: "SMC" },
  { name: "Khairpur Medical College", city: "Khairpur Mirs" },
  { name: "Liaquat Institute of Medical & Health Sciences", city: "Thatta", shortName: "LIMHS" },

  // ── Private sector ─────────────────────────────────────────────────
  { name: "Mohiuddin Islamic Medical College", city: "Mirpur" },
  { name: "Quetta Institute of Medical Sciences", city: "Quetta Cantt", shortName: "QIMS" },
  { name: "Abbottabad International Medical College", city: "Abbottabad" },
  { name: "Frontier Medical College", city: "Abbottabad" },
  { name: "Jinnah Medical College", city: "Peshawar" },
  { name: "Kabir Medical College", city: "Peshawar" },
  { name: "Muhammad College of Medicine", city: "Peshawar" },
  { name: "Northwest School of Medicine", city: "Peshawar" },
  { name: "Pak International Medical College", city: "Peshawar" },
  { name: "Peshawar Medical College", city: "Peshawar" },
  { name: "Rehman Medical College", city: "Peshawar" },
  { name: "Women Medical College", city: "Abbottabad" },
  { name: "Abu Umara Medical & Dental College", city: "Lahore" },
  { name: "Abwa Medical College", city: "Faisalabad" },
  { name: "Akhtar Saeed Medical & Dental College, Lahore", city: "Lahore" },
  { name: "Akhtar Saeed Medical & Dental College, Rawalpindi", city: "Rawalpindi" },
  { name: "Al Aleem Medical College", city: "Lahore" },
  { name: "Al-Nafees Medical College", city: "Islamabad" },
  { name: "Amna Inayat Medical College", city: "Lahore" },
  { name: "Avicenna Medical College", city: "Lahore" },
  { name: "Aziz Fatimah Medical & Dental College", city: "Faisalabad" },
  { name: "Azra Naheed Medical College", city: "Lahore" },
  { name: "Bakhtawar Amin Medical & Dental College", city: "Multan" },
  { name: "Central Parks Medical College", city: "Lahore", shortName: "CPMC" },
  { name: "CMH Kharian Medical College", city: "Kharian Cantt" },
  { name: "CMH Lahore Medical College", city: "Lahore Cantt" },
  { name: "CMH Institute of Medical Sciences", city: "Bahawalpur" },
  { name: "CMH Multan Institute of Medical Sciences", city: "Multan Cantt", shortName: "CIMS" },
  { name: "Continental Medical College", city: "Lahore" },
  { name: "Fazaia Medical College", city: "Islamabad" },
  { name: "Fazaia Ruth Pfau Medical College", city: "Karachi", shortName: "FRPMC" },
  { name: "FMH College of Medicine & Dentistry", city: "Lahore", shortName: "FMH" },
  { name: "Foundation University Medical College", city: "Islamabad", shortName: "FUMC" },
  { name: "HBS Medical & Dental College", city: "Islamabad" },
  { name: "HITEC Institute of Medical Sciences", city: "Taxila", shortName: "HITEC-IMS" },
  { name: "Independent Medical College", city: "Faisalabad" },
  { name: "Islam Medical College", city: "Sialkot" },
  { name: "Islamabad Medical & Dental College", city: "Islamabad", shortName: "IMDC" },
  { name: "NUST School of Health Sciences", city: "Islamabad" },
  { name: "Islamic International Medical College", city: "Rawalpindi", shortName: "IIMC" },
  { name: "Lahore Medical & Dental College", city: "Lahore", shortName: "LMDC" },
  { name: "M. Islam Medical College", city: "Gujranwala" },
  { name: "Multan Medical & Dental College", city: "Multan" },
  { name: "Niazi Medical & Dental College", city: "Sargodha" },
  { name: "Pak Red Crescent Medical & Dental College", city: "Lahore" },
  { name: "Rahbar Medical & Dental College", city: "Lahore" },
  { name: "Rai Medical College", city: "Sargodha" },
  { name: "Rashid Latif Medical College", city: "Lahore", shortName: "RLMC" },
  { name: "Rawal Institute of Health Sciences", city: "Islamabad", shortName: "RIHS" },
  { name: "Sahara Medical College", city: "Narowal" },
  { name: "Shahida Islam Medical College", city: "Lodhran" },
  { name: "Shalamar Medical & Dental College", city: "Lahore", shortName: "SMDC" },
  { name: "Sharif Medical & Dental College", city: "Lahore" },
  { name: "Shifa College of Medicine", city: "Islamabad", shortName: "SCM" },
  { name: "Sialkot Medical College", city: "Sialkot" },
  { name: "University College of Medicine & Dentistry", city: "Lahore", shortName: "UCMD" },
  { name: "University Medical & Dental College", city: "Faisalabad" },
  { name: "Wah Medical College", city: "Wah Cantt", shortName: "WMC" },
  { name: "Watim Medical College", city: "Rawalpindi", shortName: "WATIM" },
  { name: "Aga Khan University Medical College", city: "Karachi", shortName: "AKU" },
  { name: "Al-Tibri Medical College", city: "Karachi", shortName: "ATMC" },
  { name: "Bahria University Medical College", city: "Karachi", shortName: "BUMC" },
  { name: "Bahria University College of Medicine", city: "Islamabad", shortName: "BUCM" },
  { name: "Isra University Faculty of Medicine & Allied Medical Sciences", city: "Hyderabad" },
  { name: "Indus Medical College", city: "Tando Muhammad Khan" },
  { name: "Jinnah Medical & Dental College", city: "Karachi", shortName: "JMDC" },
  { name: "Karachi Institute of Medical Sciences", city: "Karachi", shortName: "KIMS" },
  { name: "Liaquat College of Medicine & Dentistry", city: "Karachi", shortName: "LCMD" },
  { name: "Liaquat National Medical College", city: "Karachi", shortName: "LNMC" },
  { name: "Muhammad Medical College", city: "Mirpurkhas" },
  { name: "Sir Syed College of Medical Sciences for Girls", city: "Karachi", shortName: "SSCMS" },
  { name: "United Medical & Dental College", city: "Karachi" },
  { name: "Ziauddin Medical College", city: "Karachi", shortName: "ZMC" },
  { name: "Hamdard College of Medicine & Dentistry", city: "Karachi", shortName: "HCMD" },
  { name: "Baqai Medical College", city: "Karachi" },
  { name: "Suleman Roshan Medical College", city: "Tando Adam" },
];

export const YEAR_OPTIONS = [1, 2, 3, 4, 5] as const;

export const USER_STORAGE_KEY = "diagnknow-user-profile";

export const defaultUserProfile: UserProfile = {
  college: "",
  year: 1,
};
