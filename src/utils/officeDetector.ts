import { DOR_OFFICES_LIST } from '../data';

// Map of major town names in Nepal to their geographical coordinates (latitude & longitude)
export const TOWN_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'ताप्लेजुङ': { lat: 27.3517, lng: 87.6714 },
  'फिदिम': { lat: 27.1500, lng: 87.7500 },
  'इलाम': { lat: 26.9114, lng: 87.9258 },
  'खाँदबारी': { lat: 27.3748, lng: 87.2039 },
  'तुम्लिङटार': { lat: 27.3197, lng: 87.2114 },
  'धनकुटा': { lat: 26.9833, lng: 87.3333 },
  'हर्कपुर': { lat: 27.2713, lng: 86.4024 },
  'गाइघाट': { lat: 26.8119, lng: 86.7111 },
  'कटारी': { lat: 26.8528, lng: 86.4042 },
  'दमक': { lat: 26.6667, lng: 87.6833 },
  'झापा': { lat: 26.6333, lng: 87.9833 },
  'विराटनगर': { lat: 26.4525, lng: 87.2717 },
  'धरान': { lat: 26.8125, lng: 87.2836 },
  'इटहरी': { lat: 26.6645, lng: 87.2718 },
  'सप्तरी': { lat: 26.5414, lng: 86.7522 },
  'लाहान': { lat: 26.7136, lng: 86.4758 },
  'सिराहा': { lat: 26.6533, lng: 86.2089 },
  'जनकपुर': { lat: 26.7275, lng: 85.9222 },
  'बर्दिवास': { lat: 26.9822, lng: 85.8981 },
  'लालबन्दी': { lat: 27.0544, lng: 85.6433 },
  'चन्द्रनिगाहपुर': { lat: 27.1350, lng: 85.3400 },
  'पथलैया': { lat: 27.1603, lng: 84.9961 },
  'विरगंज': { lat: 27.0117, lng: 84.8775 },
  'वीरगंज': { lat: 27.0117, lng: 84.8775 },
  'चरिकोट': { lat: 27.6667, lng: 86.0500 },
  'चौतारा': { lat: 27.7833, lng: 85.7167 },
  'खुर्कोट': { lat: 27.3500, lng: 85.9500 },
  'रामेछाप': { lat: 27.3256, lng: 86.0881 },
  'भक्तपुर': { lat: 27.6710, lng: 85.4298 },
  'गल्छी': { lat: 27.8028, lng: 85.0069 },
  'नुवाकोट': { lat: 27.9133, lng: 85.1611 },
  'गजुरी': { lat: 27.8017, lng: 84.8814 },
  'भरतपुर': { lat: 27.6833, lng: 84.4333 },
  'हेटौँडा': { lat: 27.4264, lng: 85.0308 },
  'हेटौडा': { lat: 27.4264, lng: 85.0308 },
  'ललितपुर': { lat: 27.6750, lng: 85.3222 },
  'काठमाडौ': { lat: 27.7172, lng: 85.3240 },
  'काठमाडौँ': { lat: 27.7172, lng: 85.3240 },
  'काठमाडौं': { lat: 27.7172, lng: 85.3240 },
  'गोरखा': { lat: 28.0000, lng: 84.6333 },
  'मनाङ्ग': { lat: 28.5500, lng: 84.2333 },
  'दमौली': { lat: 27.9667, lng: 84.2833 },
  'पोखरा': { lat: 28.2096, lng: 83.9856 },
  'कास्की': { lat: 28.2096, lng: 83.9856 },
  'जोमसोम': { lat: 28.7844, lng: 83.7222 },
  'बाग्लुङ': { lat: 28.2717, lng: 83.5900 },
  'गैँडाकोट': { lat: 27.7028, lng: 84.4094 },
  'बर्दघाट': { lat: 27.5619, lng: 83.7919 },
  'बूटवल': { lat: 27.7006, lng: 83.4483 },
  'बुटवल': { lat: 27.7006, lng: 83.4483 },
  'शिवपुर': { lat: 27.5000, lng: 83.0500 },
  'कपिलवस्तु': { lat: 27.5000, lng: 83.0500 },
  'धनगढी': { lat: 28.6847, lng: 80.6083 },
  'पाल्पा': { lat: 27.8667, lng: 83.5500 },
  'सन्धिखर्क': { lat: 27.9833, lng: 83.1500 },
  'प्यूठान': { lat: 28.1000, lng: 82.8833 },
  'घोराही': { lat: 28.0333, lng: 82.5000 },
  'लमही': { lat: 27.8761, lng: 82.5317 },
  'तुलशीपुर': { lat: 28.1283, lng: 82.2961 },
  'नेपालगंज': { lat: 28.0500, lng: 81.6167 },
  'नेपालगन्ज': { lat: 28.0500, lng: 81.6167 },
  'चौरजहारी': { lat: 28.6333, lng: 82.1167 },
  'डोल्पा': { lat: 29.0333, lng: 82.6833 },
  'दुनै': { lat: 29.0333, lng: 82.6833 },
  'जुम्ला': { lat: 29.2750, lng: 82.1833 },
  'गमगढी': { lat: 29.8711, lng: 82.1642 },
  'सिमिकोट': { lat: 29.9667, lng: 81.8333 },
  'हुम्ला': { lat: 29.9667, lng: 81.8333 },
  'कालिकोट': { lat: 29.1333, lng: 81.6167 },
  'दैलेख': { lat: 28.8333, lng: 81.7000 },
  'सुर्खेत': { lat: 28.5911, lng: 81.6333 },
  'विरेन्द्रनगर': { lat: 28.5911, lng: 81.6333 },
  'चैनपुर': { lat: 27.2833, lng: 87.3167 },
  'डोटी': { lat: 29.2667, lng: 80.9333 },
  'दिपायल': { lat: 29.2667, lng: 80.9333 },
  'साँफेबगर': { lat: 29.2136, lng: 81.2189 },
  'टिकापुर': { lat: 28.5333, lng: 81.1333 },
  'दार्चुला': { lat: 29.8500, lng: 80.5333 },
  'बैतडी': { lat: 29.4167, lng: 80.4667 },
  'महेन्द्रनगर': { lat: 28.9667, lng: 80.1833 },
  'गुल्मी': { lat: 28.0667, lng: 83.2500 },
  'तम्घास': { lat: 28.0667, lng: 83.2500 },
  'पर्वत': { lat: 28.2167, lng: 83.6833 },
  'कुश्मा': { lat: 28.2167, lng: 83.6833 },
};

// Map of English names to Nepali Town Names for email-prefix cross-referencing
const TOWN_ENGLISH_TO_NEPALI: Record<string, string> = {
  'taplejung': 'ताप्लेजुङ',
  'phidim': 'फिदिम',
  'ilam': 'इलाम',
  'khandbari': 'खाँदबारी',
  'tumlingtar': 'तुम्लिङटार',
  'dhankuta': 'धनकुटा',
  'harkapur': 'हर्कपुर',
  'gaighat': 'गाइघाट',
  'katari': 'कटारी',
  'damak': 'दमक',
  'jhapa': 'झापा',
  'biratnagar': 'विराटनगर',
  'dharan': 'धरान',
  'itahari': 'इटहरी',
  'saptari': 'सप्तरी',
  'lahan': 'लाहान',
  'siraha': 'सिराहा',
  'janakpur': 'जनकपुर',
  'bardibas': 'बर्दिवास',
  'lalbandi': 'लालबन्दी',
  'chandranigahpur': 'चन्द्रनिगाहपुर',
  'pathlaiya': 'पथलैया',
  'birgunj': 'वीरगंज',
  'birgundj': 'वीरगंज',
  'charikot': 'चरिकोट',
  'chautara': 'चौतारा',
  'khurkot': 'खुर्कोट',
  'ramechhap': 'रामेछाप',
  'bhaktapur': 'भक्तपुर',
  'galchhi': 'गल्छी',
  'nuwakot': 'नुवाकोट',
  'gajuri': 'गजुरी',
  'bharatpur': 'भरतपुर',
  'hetauda': 'हेटौँडा',
  'lalitpur': 'ललितपुर',
  'kathmandu': 'काठमाडौ',
  'gorkha': 'गोरखा',
  'chame': 'चामे',
  'manang': 'मनाङ्ग',
  'damauli': 'दमौली',
  'pokhara': 'पोखरा',
  'kaski': 'कास्की',
  'jomsom': 'जोमसोम',
  'baglung': 'बाग्लुङ',
  'gaindakot': 'गैँडाकोट',
  'bardaghat': 'बर्दघाट',
  'butwal': 'बूटवल',
  'kapilvastu': 'कपिलवस्तु',
  'dhangadhi': 'धनगढी',
  'palpa': 'पाल्पा',
  'sandhikhark': 'सन्धिखर्क',
  'pyuthan': 'प्यूठान',
  'ghorahi': 'घोराही',
  'lamahi': 'लमही',
  'tulsipur': 'तुलशीपुर',
  'nepalgunj': 'नेपालगंज',
  'chaurjahari': 'चौरजहारी',
  'dolpa': 'डोल्पा',
  'dunai': 'दुनै',
  'jumla': 'जुम्ला',
  'gamgadhi': 'गमगढी',
  'simikot': 'सिमिकोट',
  'humla': 'हुम्ला',
  'kalikot': 'कालिकोट',
  'dailekh': 'दैलेख',
  'surkhet': 'सुर्खेत',
  'birendranagar': 'विरेन्द्रनगर',
  'chainpur': 'चैनपुर',
  'doti': 'डोटी',
  'dipayal': 'दिपायल',
  'sanfebagar': 'साँफेबगर',
  'tikapur': 'टिकापुर',
  'darchula': 'दार्चुला',
  'baitadi': 'बैतडी',
  'mahendranagar': 'महेन्द्रनगर',
  'gulmi': 'गुल्मी',
  'tamghas': 'तम्घास',
  'parvat': 'पर्वत',
  'kushma': 'कुश्मा',
};

// Haversine formula to compute great-circle distance between two points on sphere
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the closest office in DOR_OFFICES_LIST to the given lat/lon coordinates
 */
export function getClosestOffice(lat: number, lon: number): string | null {
  let minDistance = Infinity;
  let closestOffice: string | null = null;

  for (const office of DOR_OFFICES_LIST) {
    // Find if this office corresponds to any of our known town coordinates
    const matchedTown = Object.keys(TOWN_COORDINATES).find(town => 
      office.name.includes(town)
    );

    if (matchedTown) {
      const townCoords = TOWN_COORDINATES[matchedTown];
      const distance = getDistanceKm(lat, lon, townCoords.lat, townCoords.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestOffice = office.name;
      }
    }
  }

  return closestOffice;
}

/**
 * Parses user email and matches it against offices in DOR_OFFICES_LIST
 */
export function getOfficeByEmail(email: string): string | null {
  if (!email) return null;
  const lowercaseEmail = email.toLowerCase().trim();

  // 1. Direct check of the email string in offices (if office has a hardcoded gmail)
  // Let's check if the email contains a specific town name or code
  const emailPrefix = lowercaseEmail.split('@')[0];

  // Look for direct match of email prefix with town name
  for (const [engTown, nepaliTown] of Object.entries(TOWN_ENGLISH_TO_NEPALI)) {
    if (emailPrefix.includes(engTown)) {
      // Find the office that matches this Nepali town
      const matchedOffice = DOR_OFFICES_LIST.find(office => 
        office.name.includes(nepaliTown)
      );
      if (matchedOffice) {
        return matchedOffice.name;
      }
    }
  }

  // 2. Extra checks: if email matches hardcoded system administration accounts
  if (lowercaseEmail.includes('infra') || lowercaseEmail.includes('पूर्वाधार')) {
    return '337013406-गुणस्तर, अनुसन्धान तथा विकास केन्द्र'; // QRDC / Infra division
  }
  if (lowercaseEmail.includes('planning') || lowercaseEmail.includes('chief') || lowercaseEmail.includes('yojana')) {
    return '337013401-योजना, अनुगमन तथा मूल्याङ्कन महाशाखा'; // Planning / Monitor
  }

  return null;
}

/**
 * Fetches geolocation coordinates from user's IP address
 */
export async function getIpGeolocation(): Promise<{ lat: number; lon: number } | null> {
  // If browser is offline, skip network calls to prevent unhandled fetch/CORS/network errors
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return null;
  }

  // Method 1: Try ipwho.is (excellent uptime, CORS supported, SSL supported, no API key needed)
  try {
    const response = await fetch('https://ipwho.is/');
    if (response.ok) {
      const data = await response.json();
      if (data && data.success && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return { lat: data.latitude, lon: data.longitude };
      }
    }
  } catch {
    console.warn('IP Geolocation ipwho.is failed, trying freeipapi...');
  }

  // Method 2: Try freeipapi.com as first fallback
  try {
    const response = await fetch('https://freeipapi.com/api/json');
    if (response.ok) {
      const data = await response.json();
      if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return { lat: data.latitude, lon: data.longitude };
      }
    }
  } catch {
    console.warn('IP Geolocation freeipapi failed, trying ipapi.co...');
  }

  // Method 3: Try ipapi.co as final fallback
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return { lat: data.latitude, lon: data.longitude };
      }
    }
  } catch (e) {
    console.error('All IP Geolocation methods failed:', e);
  }

  return null;
}

/**
 * Master detection function that orchestrates all office matching capabilities
 * @returns Object with the detected office name and the detection method used
 */
export async function detectUserOffice(email?: string | null): Promise<{ office: string | null; method: 'email' | 'gps' | 'ip' | null }> {
  // Method 1: Email cross-referencing
  if (email) {
    const officeFromEmail = getOfficeByEmail(email);
    if (officeFromEmail) {
      return { office: officeFromEmail, method: 'email' };
    }
  }

  // Method 2: Browser Geolocation
  if (typeof window !== 'undefined' && navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          maximumAge: 600000 // 10 minutes
        });
      });
      const closestOffice = getClosestOffice(position.coords.latitude, position.coords.longitude);
      if (closestOffice) {
        return { office: closestOffice, method: 'gps' };
      }
    } catch {
      console.warn('Browser GPS geolocation failed/denied, trying IP fallback...');
    }
  }

  // Method 3: IP Geolocation
  const ipCoords = await getIpGeolocation();
  if (ipCoords) {
    const closestOffice = getClosestOffice(ipCoords.lat, ipCoords.lon);
    if (closestOffice) {
      return { office: closestOffice, method: 'ip' };
    }
  }

  return { office: null, method: null };
}
