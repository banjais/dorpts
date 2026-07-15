import { Indicator } from './types';

export let DOR_OFFICES_LIST: { name: string; updated: string; avgCompletion?: number; total?: number }[] = [];

export const OFFICE_ENGLISH_TRANSLATIONS: Record<string, string> = {
  '337010101-मुलघाट दोभान ओलाङ्चुङगोला सडक योजना, ताप्लेजुङ': '337010101-Mulghat Dobhan Olangchunggola Road Project, Taplejung',
  '337010201-पुष्पलाल (मध्य पहाडी) राजमार्ग योजना कार्यालय, फिदिम': '337010201-Pushpalal (Mid-Hills) Rajmarg Project Office, Phidim',
  '337010301-सडक डिभिजन, इलाम': '337010301-Road Division, Ilam',
  '337010302-भेडेटार - रवी - राँके सडक योजना, रवी': '337010302-Bhedetar-Ravi-Ranke Road Project, Ravi',
  '337010401-उत्तर दक्षीण कोशी सडक आयोजना, खाँदबारी': '337010401-Uttar Dakshin Kosi Road Project, Khandbari',
  '337010402-सडक डिभिजन, तुम्लिङटार': '337010402-Road Division, Tumlingtar',
  '337010601-सडक डिभिजन, धनकुटा': '337010601-Road Division, Dhankuta',
  '337011001-सडक डिभिजन, हर्कपुर': '337011001-Road Division, Harkapur',
  '337011101-गाइघाट दिक्तेल सडक योजना, गाइघाट': '337011101-Gaighat Diktel Road Project, Gaighat',
  '337011103-मिर्चैया-कटारी-घुर्मि सडक योजना, कटारी': '337011103-Mirchiya-Katari-Ghumi Road Project, Katari',
  '337011201-सडक डिभिजन, दमक': '337011201-Road Division, Damak',
  '337011203-मदन भण्डारी राजमार्ग योजना कार्यालय, दमक': '337011203-Madan Bhandari Rajmarg Project Office, Damak',
  '337011204-काँकडभिट्टा-लौकही सडक (पूर्वी खण्ड), दमक, झापा': '337011204-Kankadbhitta-Laukahi Road (Eastern Section), Damak, Jhapa',
  '337011301-सडक डिभिजन, विराटनगर': '337011301-Road Division, Biratnagar',
  '337011402-पुल योजना पूर्बी क्षेत्र सेक्टर नं. १, धरान': '337011402-Bridge Project Eastern Sector No. 1, Dharan',
  '337011403-रानी- विराटनगर- इटहरी- धरान सडक योजना, इटहरी': '337011403-Rani-Biratnagar-Itahari-Dharan Road Project, Itahari',
  '337011405-हुलाकी राजमार्ग, योजना कार्यालय, ईटहरी': '337011405-Feeder Road (Hulaki Rajmarg) Project Office, Itahari',
  '337011407-तमोरकोरिडोर चतरा मुलघाट सुभाडखोला सडक योजना, धरान': '337011407-Tamar Corridor Chatar Mulghat Subharnakhola Road Project, Dharan',
  '337011408-काँकडभिट्टा-लौकही सडक (पश्चिम खण्ड), इटहरी, सुनसरी': '337011408-Kankadbhitta-Laukahi Road (Western Section), Itahari, Sunsari',
  '337011501-कन्चनपुर - कमला सडक योजना (पूर्वी खण्ड), सप्तरी': '337011501-Kanchanpur-Kamala Road Project (Eastern Section), Saptari',
  '337011601-सडक डिभिजन, लाहान': '337011601-Road Division, Lahan',
  '337011602-कन्चनपुर - कमला सडक योजना (पश्चिम खण्ड), सिराहा': '337011602-Kanchanpur-Kamala Road Project (Western Section), Siraha',
  '337011701-सडक डिभिजन, जनकपुर': '337011701-Road Division, Janakpur',
  '337011702-हुलाकी राजमार्ग, योजना कार्यालय, जनकपुर': '337011702-Feeder Road (Hulaki Rajmarg) Project Office, Janakpur',
  '337011801-जटही - जनकपुर- ढल्केवर सडक योजना, बर्दिवास': '337011801-Jathi-Janakpur-Dhalkebar Road Project, Bardibas',
  '337011901-कमला-ढल्केवर-पथलैया सडक योजना, लालबन्दी': '337011901-Kamala-Dhalkebar-Pathlaiya Road Project, Lalbandi',
  '337012001-सडक डिभिजन, चन्द्रनिगाहपुर': '337012001-Road Division, Chandranigahpur',
  '337012201-वीरगंज पथलैया सडक योजना, पथलैया': '337012201-Birgunj-Pathlaiya Road Project, Pathlaiya',
  '337012202-हुलाकी राजमार्ग योजना कार्यलाय, विरगंज': '337012202-Feeder Road (Hulaki Rajmarg) Project Office, Birgunj',
  '337012301-सडक डिभिजन, चरिकोट': '337012301-Road Division, Charikot',
  '337012303-लामोसाँघु-तामाकोसी-जिरी सडक योजना, चौतारा': '337012303-Lamosangu-Tamakoshi-Jiri Road Project, Chautara',
  '337012401-सडक डिभिजन, खुर्कोट': '337012401-Road Division, Khurkot',
  '337012404-पुष्पलाल (मध्य पहाडी) राजमार्ग योजना कार्यालय, रामेछाप': '337012404-Pushpalal (Mid-Hills) Rajmarg Project Office, Ramechhap',
  '337012602-सूर्यविनायक-धुलिखेल सडक आयोजना, भक्तपुर': '337012602-Suryabinayak-Dhulikhel Road Project, Bhaktapur',
  '337012901-गल्छी-त्रिशुली-मैलुङ्ग-स्याप्रुबेंशी-रसुवागढी सडक योजना': '337012901-Galchi-Trishuli-Mailung-Syaprubensi-Rasuwagadhi Road Project',
  '337012902-सडक डिभिजन, नुवाकोट': '337012902-Road Division, Nuwakot',
  '337012903-यान्त्रिक कार्यालय, नुवाकोट': '337012903-Mechanical Office, Nuwakot',
  '337013002-नागढुंगा-मुग्लिङ सडक योजना (पूर्वी खण्ड) गजुरी': '337013002-Nagdhunga-Mugling Road Project (Eastern Section), Gajuri',
  '337013101-नारायणघाट मुग्लिङ सडक आयोजना, भरतपुर': '337013101-Narayanghat Mugling Road Project, Bharatpur',
  '337013102-सडक डिभिजन, भरतपुर': '337013102-Road Division, Bharatpur',
  '337013201-सडक डिभिजन, हेटौँडा': '337013201-Road Division, Hetauda',
  '337013203-हेभी ईक्युमेन्ट डिभिजन, हेटौँडा': '337013203-Heavy Equipment Division, Hetauda',
  '337013301-सडक डिभिजन, भक्तपुर': '337013301-Road Division, Bhaktapur',
  '337013402-उत्तर दक्षीण ब्यापारीक मार्ग विस्तार आयोजना निर्देशनालय': '337013402-North-South Trade Route Expansion Project Directorate',
  '337013403-काठमाण्डौ चक्रपथ सडक विस्तार योजना': '337013403-Kathmandu Ring Road Expansion Project',
  '337013406-गुणस्तर, अनुसन्धान तथा विकास केन्द्र': '337013406-Quality, Research & Development Center',
  '337013404-कान्ति राजमार्ग सडक योजना': '337013404-Kanti Rajmarg Road Project',
  '337013408-मदन भण्डारी राजमार्ग आयोजना निर्देशनालय': '337013408-Madan Bhandari Rajmarg Project Directorate',
  '337013501-काठमाण्डौ उपत्यका सडक विस्तार आयोजना': '337013501-Kathmandu Valley Road Expansion Project',
  '337013503-नागढुंगा सुरुङ्ग मार्ग निर्माण आयोजना': '337013503-Nagdhunga Tunnel Road Construction Project',
  '337013506-पूल योजना मध्य क्षेत्र सेक्टर नं. २': '337013506-Bridge Project Central Sector No. 2',
  '337013509-श्री पुष्पलाल (मध्यपहाडी) राजमार्ग आयोजना निर्देशनालय': '337013509-Shri Pushpalal (Mid-Hills) Rajmarg Project Directorate',
  '337013512-सडक डिभिजन, काठमाडौ': '337013512-Road Division, Kathmandu',
  '337013513-सडक सुधार तथा विकास आयोजना निर्देशनालय': '337013513-Road Improvement & Development Project Directorate',
  '337013516-हुलाकी राजमार्ग निर्देशनालय': '337013516-Feeder Road Directorate',
  '337013518-आयोजना निर्देशनालय (ए.डी.बी.)': '337013518-Project Directorate (ADB)',
  '337013520-सडक विभाग': '337013520-Department of Roads',
  '337013601-गोरखा सडक योजना, गोरखा': '337013601-Gorkha Road Project, Gorkha',
  '337013602-पुष्पलाल (मध्य पहाडी) राजमार्ग योजना कार्यालय, गोरखा': '337013602-Pushpalal (Mid-Hills) Rajmarg Project Office, Gorkha',
  '337013701-डुम्रे बेशीशहर चामे मनाङ्ग सडक योजना': '337013701-Dumre-Besishahar-Chame-Manang Road Project',
  '337013801-सडक डिभिजन, दमौली, तनहुँ': '337013801-Road Division, Damauli, Tanahun',
  '337013803-मुग्लिङ्ग -पोखरा सडक योजना (पूर्वी खण्ड), तनहुँ': '337013803-Mugling-Pokhara Road Project (Eastern Section), Tanahun',
  '337013901-सडक डिभिजन, पोखरा': '337013901-Road Division, Pokhara',
  '337013904-मुग्लिङ्ग -पोखरा सडक योजना (पश्चिम खण्ड), कास्की': '337013904-Mugling-Pokhara Road Project (Western Section), Kaski',
  '337013905-पुल सेक्टर, पोखरा': '337013905-Bridge Sector, Pokhara',
  '337014101-कालिगण्डकी कोरिडोर (बेनी जोमसोम कोरला सडक योजना), जोमसोम': '337014101-Kaligandaki Corridor (Beni Jomsom Korala Road Project), Jomsom',
  '337014501-सडक डिभिजन, बाग्लुङ': '337014501-Road Division, Baglung',
  '337014601-नारायण वुटवल सडक योजना (पूर्व खण्ड), गैँडाकोट': '337014601-Narayan Vutwal Road Project (Eastern Section), Ghandruk',
  '337014701-नारायण वुटवल सडक योजना (पश्चिम खण्ड), बर्दघाट': '337014701-Narayan Vutwal Road Project (Western Section), Bardghat',
  '337014802-सडक डिभिजन, बुटवल': '337014802-Road Division, Butwal',
  '337014807-सिद्धबाबा सुरुङ्ग मार्ग योजना': '337014807-Siddhababa Tunnel Road Project',
  '337014808-वुटवल-गोरुसिंगे-चन्द्रौटा सडक योजना, वुटवल': '337014808-Butwal-Gorusinge-Chandrawata Road Project, Butwal',
  '337014901-सडक, शिवपुर': '337014901-Shivapur Road Office',
  '337014902-हुलाकि राजमार्ग निर्देशनालय, योजना कार्यालय, शिवनगर, कपिलवस्तु': '337014902-Feeder Road Directorate, Project Office, Shivnagar, Kapilvastu',
  '33701702-हुलाकी राजमार्ग निर्देशनालय, योजना कार्यालय, धनगढी , कैलाली': '33701702-Feeder Road Directorate, Project Office, Dhangadhi, Kailali',
  '337015001-सडक डिभिजन, पाल्पा': '337015001-Road Division, Palpa',
  '337015101-सालझण्डी-सन्धिखर्क-ढोरपाटन सडक योजना': '337015101-Saljhandi-Sandhikharka-Dhorpatan Road Project',
  '337015401-शहिद मार्ग सडक योजना': '337015401-Martyr Road Project',
  '337015501-सडक डिभिजन, प्यूठान': '337015501-Road Division, Pyuthan',
  '337015601-सडक डिभिजन, घोराही': '337015601-Road Division, Ghodahi',
  '337015604-भालुवाङ- वागडुला- भिमगिठ्ठे- चन्द्रौटा- कृष्णनगर, लमही- घोराही- तुलशीपुर सडक योजना': '337015604-Baluwa-Bagdula-Bhimgithe-Chandrauta-Krishnanagar, Lamahi-Ghodahi-Tulsipur Road Project',
  '337015701-सडक डिभिजन, नेपालगंज': '337015701-Road Division, Nepalgunj',
  '337015702-पुल योजना पश्चिम सेक्टर नं. ३': '337015702-Bridge Project Western Sector No. 3',
  '337015703-हुलाकी राजमार्ग आयोजना, योजना कार्यालय नेपालगन्ज': '337015703-Feeder Road (Hulaki Rajmarg) Project, Project Office, Nepalgunj',
  '337015901-सडक डिभिजन, चौरजहारी': '337015901-Road Division, Chaurajahari',
  '337016101-भेरी कोरिडोर (जाजरकोट-दुनै-मरिम-तिन्जे-धो) सडक योजना, दुनै, डोल्पा': '337016101-Bheri Corridor (Jajarkot-Dunai-Marim-Tinje-Dho) Road Project, Dunai, Dolpa',
  '337016201-सडक डिभिजन, जुम्ला': '337016201-Road Division, Jumla',
  '337016301-गमगढी नाक्चालाग्ना सडक योजना, गमगढी': '337016301-Gamgadhi Nakchalaagna Road Project, Gamgadhi',
  '337016401- कर्णाली कोरिडोर उत्तर खण्ड (हिल्सा-सिमिकोट योजना), सिमिकोट, हुम्ला': '337016401-Karnali Corridor Northern Section (Hilsa-Simikot Project), Simikot, Humla',
  '337016501-कर्णाली कोरिडोर दक्षिण खण्ड (खुलालु-सल्लीसल्ला सडक योजना), कालिकोट': '337016501-Karnali Corridor Southern Section (Khulalu-Salliesalla Road Project), Kalikot',
  '337016701-पुष्पलाल (मध्यपहाडी) राजमार्ग योजना कार्यालय दैलेख': '337016701-Pushpalal (Mid-Hills) Rajmarg Project Office, Dailekh',
  '337016801-सडक डिभिजन, विरेन्द्रनगर': '337016801-Road Division, Birendranagar',
  '337016804-पुल सेक्टर नं.5 सुर्खेत': '337016804-Bridge Sector No. 5, Surkhet',
  '337017001-चैनपुर-ताक्लाकोट सडक योजना': '337017001-Chainpur-Taklakot Road Project',
  '337017101-सडक डिभिजन कुलपते ,डोटी': '337017101-Road Division, Kulpati, Doti',
  '337017102-धनगढी- खुटिया- दिपायल- चैनपुर- उरैभन्ज्याङ सडक योजना, विपिनगर': '337017102-Dhangadhi-Khutiya-Dipayal-Chainpur-Uraibhanjyang Road Project, Bipinnagar',
  '337017201-सडक डिभिजन, साँफेबगर': '337017201-Road Division, Sanfebagar',
  '337017202-सेती लोकमार्ग टिकापुर लोडे चैनपुर ताक्लाकोट सडक योजना': '337017202-Seti Lokmarg Tikapur Lode Chainpur Taklakot Road Project',
  '337017301-दार्चुला टिकर सडक आयोजना': '337017301-Darchula Tikar Road Project',
  '337017401-सडक डिभिजन, बैतडी': '337017401-Road Division, Baitadi',
  '337017601-महाकाली पुल योजना': '337017601-Mahakali Bridge Project',
  '337017602-सडक डिभिजन, महेन्द्रनगर': '337017602-Road Division, Mahendranagar',
  '337017705-सहजपुर- बोक्तान- दिपायल, म.रा.मा.- गुलरिया, नेपालगंज सडक योजना': '337017705-Sahajpur-Boktan-Dipayal, M.R.M.A.-Gulariya, Nepalgunj Road Project',
  '337012202- हुलाकी राजमार्ग निर्देशनालय योजना कार्यालय, विरगंज': '337012202-Feeder Road Directorate Project Office, Birgunj',
  'दहाकुता': 'Dahakuta',
  '337014201-पुष्पलाल (मध्य पहाडी) राजमार्ग योजना कार्यालय, कुश्मा, पर्वत': '337014201-Pushpalal (Mid-Hills) Rajmarg Project Office, Kusma, Parbat',
  '337015002-कालिगण्डकी कोरिडोर (गैडाकोट-राम्दी-माल्ढुंगा) सडक योजना पाल्पा': '337015002-Kaligandaki Corridor (Gaidakot-Ramdi-Maldhunga) Road Project, Palpa',
  '337011084- मदन भण्डारी राजमार्ग योजना कार्यालय तम्घास, गुल्मी': '337011084-Madan Bhandari Rajmarg Project Office, Tamghas, Gulmi',
  '337016803-मदन भण्डारी राजमार्ग योजना कार्यालय, सुर्खेत': '337016803-Madan Bhandari Rajmarg Project Office, Surkhet',
  '337013407-सडक डिभिजन ललितपुर': '337013407-Road Division, Lalitpur',
  '337012405 - सडक सुधार तथा विकास याेजना कार्यालय रामेछाप': '337012405 - Road Improvement & Development Project Office, Ramechhap',
};

export function translateOffice(name: string, language: 'en' | 'ne'): string {
  if (language === 'ne') return name;
  return OFFICE_ENGLISH_TRANSLATIONS[name] || name;
}

export function getSectorForIndicator(name: string, sdg?: string): Indicator['category'] {
  const n = name.toLowerCase();
  const s = sdg || '';
  
  // 1. Maintenance & Reconstruction
  if (
    n.includes('मर्मत') || 
    n.includes('periodic') || 
    n.includes('pothole') || 
    n.includes('maintenance') ||
    n.includes('reconstruction') ||
    n.includes('upgrading') ||
    n.includes('पुनर्निर्माण') ||
    n.includes('स्तरोन्नति') ||
    n.includes('rehabilitation') ||
    n.includes('routine') ||
    n.includes('overlay') ||
    n.includes('re-graveling') ||
    n.includes('पुन: ग्राभेल') ||
    n.includes('टालटुल')
  ) {
    return 'Maintenance';
  }
  
  // 2. Budget Utilization
  if (
    n.includes('बजेट') || 
    n.includes('खर्च') || 
    n.includes('budget') || 
    n.includes('expenditure') || 
    n.includes('capital') ||
    n.includes('utilization') ||
    n.includes('allocations') ||
    n.includes('वित्तीय प्रगति') ||
    n.includes('भुक्तानी') ||
    n.includes('expenses')
  ) {
    return 'Budget Utilization';
  }

  // 3. Employment Creation
  if (
    s === '8' || 
    n.includes('रोजगारी') || 
    n.includes('employment') || 
    n.includes('labor') || 
    n.includes('labour') || 
    n.includes('job') || 
    n.includes('man-days') || 
    n.includes('man days') || 
    n.includes('कामको अवसर') || 
    n.includes('मानव दिन')
  ) {
    return 'Employment Creation';
  }

  // 4. Governance & Auditing
  if (
    s === '16' || 
    n.includes('बेरुजु') || 
    n.includes('गुनासो') || 
    n.includes('grievance') || 
    n.includes('audit') || 
    n.includes('clearance') || 
    n.includes('irregularity') || 
    n.includes('transparency') || 
    n.includes('compliance') || 
    n.includes('पारदर्शिता') || 
    n.includes('सुशासन') || 
    n.includes('फर्छ्यौट')
  ) {
    return 'Governance';
  }

  // 5. Infrastructure Creation (Default or explicit)
  if (
    s === '9' || 
    n.includes('सडक') || 
    n.includes('पुल') || 
    n.includes('बृज') || 
    n.includes('सुरूङ') || 
    n.includes('पेभ्मेंट') || 
    n.includes('पेमेन्ट') || 
    n.includes('बेरियर') || 
    n.includes('road') || 
    n.includes('bridge') || 
    n.includes('tunnel') || 
    n.includes('pavement') || 
    n.includes('barrier') ||
    n.includes('construction') ||
    n.includes('installation') ||
    n.includes('निर्माण') ||
    n.includes('नयाँ') ||
    n.includes('जडान') ||
    n.includes('ट्रयाक')
  ) {
    return 'Infrastructure Creation';
  }
  
  return 'Infrastructure Creation'; // fallback
}

export const ENGLISH_TRANSLATIONS: Record<string, { en: string; category: Indicator['category'] }> = {
  'कालोपत्रे सडक (दुई लेन)-NH&Other Road': {
    en: 'Blacktopped Road (2-Lane) - National Highways & Others',
    category: 'Infrastructure Creation',
  },
  'कालोपत्रे सडक (चार लेन वा चार लेन भन्दा बढी)': {
    en: 'Blacktopped Road (4-Lane & wider)',
    category: 'Infrastructure Creation',
  },
  'रिजिड पेभ्मेंट , कि.मि.': {
    en: 'Rigid Pavement (Km)',
    category: 'Infrastructure Creation',
  },
  'रिजिड पेमेन्ट , कि.मि.': {
    en: 'Rigid Pavement (Km)',
    category: 'Infrastructure Creation',
  },
  'ग्रावेल (सबबेश बाहेक) , कि.मि.': {
    en: 'Gravel Road (excluding sub-base) (Km)',
    category: 'Infrastructure Creation',
  },
  'माटे सडक (ट्रयाक निर्माण)': {
    en: 'Earthen Road (Track Construction) (Km)',
    category: 'Infrastructure Creation',
  },
  'पुल निर्माण': {
    en: 'Bridge Construction (Nos)',
    category: 'Infrastructure Creation',
  },
  'बेली बृज जडान, संख्या': {
    en: 'Bailey Bridge Installation (Nos)',
    category: 'Infrastructure Creation',
  },
  'सुरूङ निर्माण (मेन टनेल र ईभ्याकुएसन टनेल)': {
    en: 'Tunnel Construction (Main & Evacuation)',
    category: 'Infrastructure Creation',
  },
  'क्र्यास बेरियर, मिटर': {
    en: 'Crash Barrier Installation (Meters)',
    category: 'Infrastructure Creation',
  },
  'पोटहोल मर्मत, Km': {
    en: 'Pothole Repair (Km)',
    category: 'Maintenance',
  },
  'राजमार्ग आवधिक मर्मत, कि. मि.': {
    en: 'Highway Periodic Maintenance (Km)',
    category: 'Maintenance',
  },
  'राजमार्ग पुनर्निर्माण तथा स्तरोन्नति, कि.मि.': {
    en: 'Highway Reconstruction & Upgrading (Km)',
    category: 'Maintenance',
  },
  'रोजगारी सिर्जना': {
    en: 'Employment Creation (Man-days in Thousand)',
    category: 'Employment Creation',
  },
  'कुल बजेट, अर्ब': {
    en: 'Total Budget Allocated (Billion NPR)',
    category: 'Budget Utilization',
  },
  'कुल बजेट, अर्ब ': {
    en: 'Total Budget Allocated (Billion NPR)',
    category: 'Budget Utilization',
  },
  'पुँजीगत खर्च': {
    en: 'Capital Expenditure (%)',
    category: 'Budget Utilization',
  },
  'कुल बेरुजुमा फर्छ्यौटको अनुपात': {
    en: 'Irregularity/Audit Clearance Ratio (%)',
    category: 'Governance',
  },
  'गुनासो फर्छ्यौट': {
    en: 'Grievance Resolution/Settlement (%)',
    category: 'Governance',
  },
};

export function getOfficeForIndicator(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('कालोपत्रे') || n.includes('blacktopped') || n.includes('nh')) {
    return '33 Division Road Offices';
  }
  if (n.includes('रिजिड') || n.includes('rigid') || n.includes('पेभ्मेंट') || n.includes('पेमेन्ट')) {
    return 'Division Road Offices (Urban)';
  }
  if (n.includes('ग्रावेल') || n.includes('gravel') || n.includes('माटे') || n.includes('earthen') || n.includes('ट्रयाक')) {
    return 'Division Road Offices (Regional)';
  }
  if (n.includes('पुल') || n.includes('bridge')) {
    return 'Bridge Branch, DoR';
  }
  if (n.includes('सुरूङ') || n.includes('tunnel')) {
    return 'Quality, Research & Development Center (QRDC)';
  }
  if (n.includes('बेरियर') || n.includes('barrier') || n.includes('क्र्यास')) {
    return 'Traffic Engineering & Safety Sector';
  }
  if (n.includes('मर्मत') || n.includes('pothole') || n.includes('maintenance')) {
    return 'Maintenance Branch & 33 Divisions';
  }
  if (n.includes('पुनर्निर्माण') || n.includes('स्तरोन्नति') || n.includes('reconstruction') || n.includes('upgrading')) {
    return 'Development Cooperation Directorate / 33 Divisions';
  }
  if (n.includes('रोजगारी') || n.includes('employment')) {
    return 'DoR Administration & Personnel Branch';
  }
  if (n.includes('प्रगति') || n.includes('progress') || n.includes('वित्तीय') || n.includes('भौतिक')) {
    return 'Planning, Monitoring & Evaluation Section';
  }
  if (n.includes('बेरुजु') || n.includes('audit') || n.includes('clearance') || n.includes('irregularity')) {
    return 'Internal Audit & Accounts Section';
  }
  if (n.includes('गुनासो') || n.includes('grievance') || n.includes('फर्छ्यौट')) {
    return 'Grievance Redressal Desk';
  }
  return 'Department of Roads (DoR) Central Office';
}

export const DEFAULT_INDICATORS: Indicator[] = [
  {
    id: 'ind_1',
    name: 'कालोपत्रे सडक (दुई लेन)-NH&Other Road',
    nameEn: 'Blacktopped Road (2-Lane) - National Highways & Others',
    sdg: '9',
    period: 'त्रैमासिक',
    weight: 12,
    unit: 'कि.मी.',
    baseline: 19456,
    totalTarget: 20256,
    totalProgress: 19456,
    annualTarget: 800,
    annualProgress: 499,
    category: 'SDG 9: Infrastructure',
    updatedAt: '2083-02-10T10:00:00Z',
  },
  {
    id: 'ind_2',
    name: 'कालोपत्रे सडक (चार लेन वा चार लेन भन्दा बढी)',
    nameEn: 'Blacktopped Road (4-Lane & wider)',
    sdg: '9',
    period: 'त्रैमासिक',
    weight: 8,
    unit: 'कि.मी.',
    baseline: 588,
    totalTarget: 696,
    totalProgress: 588,
    annualTarget: 109,
    annualProgress: 92,
    category: 'SDG 9: Infrastructure',
    updatedAt: '2083-02-12T08:30:00Z',
  },
  {
    id: 'ind_3',
    name: 'रिजिड पेभ्मेंट , कि.मि.',
    nameEn: 'Rigid Pavement (Km)',
    sdg: '9',
    period: 'त्रैमासिक',
    weight: 5,
    unit: 'कि.मी.',
    baseline: 250,
    totalTarget: 50,
    totalProgress: 63,
    annualTarget: 50,
    annualProgress: 63,
    category: 'SDG 9: Infrastructure',
    updatedAt: '2083-01-01T12:00:00Z', // Stale!
  },
  {
    id: 'ind_4',
    name: 'ग्रावेल (सबबेश बाहेक) , कि.मि.',
    nameEn: 'Gravel Road (excluding sub-base) (Km)',
    sdg: '9',
    period: 'त्रैमासिक',
    weight: 5,
    unit: 'कि.मी.',
    baseline: '-',
    totalTarget: 30,
    totalProgress: 127,
    annualTarget: 30,
    annualProgress: 127,
    category: 'SDG 9: Infrastructure',
    updatedAt: '2083-02-14T15:45:00Z',
  },
  {
    id: 'ind_5',
    name: 'माटे सडक (ट्रयाक निर्माण)',
    nameEn: 'Earthen Road (Track Construction) (Km)',
    sdg: '9',
    period: 'त्रैमासिक',
    weight: 5,
    unit: 'कि.मी.',
    baseline: '-',
    totalTarget: 52,
    totalProgress: 0,
    annualTarget: 52,
    annualProgress: 120,
    category: 'SDG 9: Infrastructure',
  },
  {
    id: 'ind_6',
    name: 'पुल निर्माण',
    nameEn: 'Bridge Construction (Nos)',
    sdg: '9',
    period: 'मासिक',
    weight: 10,
    unit: 'वटा',
    baseline: 3537,
    totalTarget: 3699,
    totalProgress: 3537,
    annualTarget: 162,
    annualProgress: 114,
    category: 'SDG 9: Infrastructure',
  },
  {
    id: 'ind_7',
    name: 'बेली बृज जडान, संख्या',
    nameEn: 'Bailey Bridge Installation (Nos)',
    sdg: '9',
    period: 'त्रैमासिक',
    weight: 3,
    unit: 'संख्या',
    baseline: '-',
    totalTarget: 5,
    totalProgress: 5,
    annualTarget: 5,
    annualProgress: 5,
    category: 'SDG 9: Infrastructure',
  },
  {
    id: 'ind_8',
    name: 'सुरूङ निर्माण (मेन टनेल र ईभ्याकुएसन टनेल)',
    nameEn: 'Tunnel Construction (Main & Evacuation)',
    sdg: '9',
    period: 'मासिक',
    weight: 5,
    unit: 'वटा',
    baseline: 0,
    totalTarget: 1,
    totalProgress: 0,
    annualTarget: 1,
    annualProgress: 1,
    category: 'SDG 9: Infrastructure',
  },
  {
    id: 'ind_9',
    name: 'क्र्यास बेरियर, मिटर',
    nameEn: 'Crash Barrier Installation (Meters)',
    sdg: '9',
    period: 'त्रैमासिक',
    weight: 2,
    unit: 'मिटर',
    baseline: 350000,
    totalTarget: 1350000,
    totalProgress: 410189,
    annualTarget: 20000,
    annualProgress: 60189,
    category: 'SDG 9: Infrastructure',
  },
  {
    id: 'ind_10',
    name: 'पोटहोल मर्मत, Km',
    nameEn: 'Pothole Repair (Km)',
    sdg: '9',
    period: 'मासिक',
    weight: 5,
    unit: 'कि.मी.',
    baseline: '-',
    totalTarget: 5498,
    totalProgress: 3048,
    annualTarget: 5498,
    annualProgress: 3048,
    category: 'SDG 9: Infrastructure',
  },
  {
    id: 'ind_11',
    name: 'राजमार्ग आवधिक मर्मत, कि. मि.',
    nameEn: 'Highway Periodic Maintenance (Km)',
    sdg: '9',
    period: 'मासिक',
    weight: 5,
    unit: 'कि.मी.',
    baseline: '-',
    totalTarget: 506,
    totalProgress: 97,
    annualTarget: 506,
    annualProgress: 97,
    category: 'SDG 9: Infrastructure',
  },
  {
    id: 'ind_12',
    name: 'राजमार्ग पुनर्निर्माण तथा स्तरोन्नति, कि.मि.',
    nameEn: 'Highway Reconstruction & Upgrading (Km)',
    sdg: '9',
    period: 'मासिक',
    weight: 5,
    unit: 'कि.मी.',
    baseline: '-',
    totalTarget: 50,
    totalProgress: 55,
    annualTarget: 50,
    annualProgress: 55,
    category: 'SDG 9: Infrastructure',
  },
  {
    id: 'ind_13',
    name: 'रोजगारी सिर्जना',
    nameEn: 'Employment Creation (Man-days in Thousand)',
    sdg: '8',
    period: 'मासिक',
    weight: 5,
    unit: 'कार्यदिन (हजारमा)',
    baseline: '-',
    totalTarget: 10923,
    totalProgress: 4210,
    annualTarget: 10923,
    annualProgress: 4210,
    category: 'SDG 8: Decent Work',
  },
  {
    id: 'ind_14',
    name: 'कुल बजेट, अर्ब',
    nameEn: 'Total Budget Allocated (Billion NPR)',
    sdg: '-',
    period: 'मासिक',
    weight: 5,
    unit: 'अर्ब',
    baseline: '-',
    totalTarget: null,
    totalProgress: null,
    annualTarget: 124,
    annualProgress: 48,
    category: 'Budget',
  },
  {
    id: 'ind_15',
    name: 'पुँजीगत खर्च',
    nameEn: 'Capital Expenditure (%)',
    sdg: '8',
    period: 'मासिक',
    weight: 10,
    unit: 'प्रतिशत',
    baseline: 75,
    totalTarget: 95,
    totalProgress: 45,
    annualTarget: 95,
    annualProgress: 45,
    category: 'Budget',
  },
  {
    id: 'ind_16',
    name: 'कुल बेरुजुमा फर्छ्यौटको अनुपात',
    nameEn: 'Irregularity/Audit Clearance Ratio (%)',
    sdg: '16',
    period: 'मासिक',
    weight: 5,
    unit: 'प्रतिशत',
    baseline: 8,
    totalTarget: 60,
    totalProgress: null,
    annualTarget: 60,
    annualProgress: 0,
    category: 'SDG 16: Governance',
  },
  {
    id: 'ind_17',
    name: 'गुनासो फर्छ्यौट',
    nameEn: 'Grievance Resolution/Settlement (%)',
    sdg: '16',
    period: 'मासिक',
    weight: 5,
    unit: 'प्रतिशत',
    baseline: 100,
    totalTarget: 80,
    totalProgress: null,
    annualTarget: 80,
    annualProgress: 0,
    category: 'SDG 16: Governance',
  },
].map(ind => {
  const isBlank = (val: unknown) => val === null || val === undefined || isNaN(Number(val)) || String(val).trim() === '';
  const annualTarget = isBlank(ind.annualTarget) ? 1 : ind.annualTarget;
  const annualProgress = isBlank(ind.annualProgress) ? 1 : ind.annualProgress;
  const totalTarget = isBlank(ind.totalTarget) ? 1 : ind.totalTarget;
  const totalProgress = isBlank(ind.totalProgress) ? 1 : ind.totalProgress;
  return {
    ...ind,
    category: getSectorForIndicator(ind.name, ind.sdg),
    office: getOfficeForIndicator(ind.name),
    annualTarget,
    annualProgress,
    totalTarget,
    totalProgress,
  };
}) as Indicator[];

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseGoogleSheetsCSV(csvText: string): {
  indicators: Indicator[];
  metadata: {
    lastUpdateDate: string;
    nextUpdateDate: string;
    totalWeight: number;
    totalWeightProgress: number;
  };
} {
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const parsedIndicators: Indicator[] = [];

  let lastUpdateDate = '2083/02/30';
  let nextUpdateDate = '2083/03/07';
  let totalWeight = 75;
  let totalWeightProgress = 61;

  let headerIndex = -1;

  // Track lines to process
  for (let i = 0; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.includes('सूचक') && cols.includes('SDG संकेत')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    // Return defaults if parsing completely fails structure checks
    return {
      indicators: DEFAULT_INDICATORS,
      metadata: { lastUpdateDate, nextUpdateDate, totalWeight, totalWeightProgress },
    };
  }

  // Dynamic column resolution based on header row
  const headers = parseCSVLine(lines[headerIndex]);
  const findColIndex = (keywords: string[]) => 
    headers.findIndex(h => keywords.some(k => h.toLowerCase().includes(k.toLowerCase())));

  const nameIndex = findColIndex(['सूचक', 'indicator']) !== -1 ? findColIndex(['सूचक', 'indicator']) : 1;
  const sdgIndex = findColIndex(['SDG संकेत', 'sdg']) !== -1 ? findColIndex(['SDG संकेत', 'sdg']) : 2;
  const periodIndex = findColIndex(['अवधि', 'period']) !== -1 ? findColIndex(['अवधि', 'period']) : 3;
  const weightIndex = findColIndex(['भार', 'weight']) !== -1 ? findColIndex(['भार', 'weight']) : 4;
  const unitIndex = findColIndex(['एकाई', 'unit']) !== -1 ? findColIndex(['एकाई', 'unit']) : 5;
  const baselineIndex = findColIndex(['सुरुको स्थिति', 'baseline', 'स्थिति']) !== -1 ? findColIndex(['सुरुको स्थिति', 'baseline', 'स्थिति']) : 6;
  const totalTargetIndex = findColIndex(['कुल लक्ष्य', 'total target']) !== -1 ? findColIndex(['कुल लक्ष्य', 'total target']) : 7;
  const totalProgressIndex = findColIndex(['कुल प्रगति', 'total progress']) !== -1 ? findColIndex(['कुल प्रगति', 'total progress']) : 8;
  const annualTargetIndex = findColIndex(['बार्षिक लक्ष्य', 'वार्षिक लक्ष्य', 'annual target']) !== -1 ? findColIndex(['बार्षिक लक्ष्य', 'वार्षिक लक्ष्य', 'annual target']) : 9;
  const annualProgressIndex = findColIndex(['बार्षिक प्रगति', 'वार्षिक प्रगति', 'annual progress']) !== -1 ? findColIndex(['बार्षिक प्रगति', 'वार्षिक प्रगति', 'annual progress']) : 10;
  
  // Specific requested columns for Office and Gmail
  const officeIndex = findColIndex(['office', 'कार्यालय', 'branch', 'शाखा', 'concerned', 'जिम्मेवार']);
  const gmailIndex = findColIndex(['gmail', 'email', 'user', 'updated by', 'प्रयोगकर्ता', 'इमेल']);

  let index = 1;
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    
    // Ignore empty lines or the ones containing totals or updates
    if (cols.length < 2 || !cols[nameIndex]) {
      // Check if it lists the total weights or update schedule
      const fullText = cols.join(' ');
      if (fullText.includes('कुल') && fullText.includes('भार') && !fullText.includes('प्रगति')) {
        const weightMatch = fullText.match(/\d+/);
        if (weightMatch) totalWeight = parseInt(weightMatch[0], 10);
      }
      if (fullText.includes('कुल') && fullText.includes('भार प्रगति')) {
        const progMatch = fullText.match(/\d+/);
        if (progMatch) totalWeightProgress = parseInt(progMatch[0], 10);
      }
      if (fullText.includes('Last Update Date:')) {
        const dateMatch = fullText.match(/Last Update Date:\s*([^\s,]+)/i);
        if (dateMatch) lastUpdateDate = dateMatch[1];
      }
      if (fullText.includes('Next Update Date:')) {
        const dateMatch = fullText.match(/Next Update Date:\s*([^\s,]+)/i);
        if (dateMatch) nextUpdateDate = dateMatch[1];
      }
      continue;
    }

    const name = cols[nameIndex].trim();
    if (name.includes('कुल भार') || name.includes('कुल  भार') || name.includes('Last Update Date')) {
      continue;
    }

    const tr = ENGLISH_TRANSLATIONS[name] || { en: name, category: 'Administration' };

    // Format fields correctly
    const sdg = cols[sdgIndex] || '-';
    const period = cols[periodIndex] || 'मासिक';
    const parsedWeight = parseInt(cols[weightIndex], 10);
    const weight = isNaN(parsedWeight) || parsedWeight <= 0 ? 5 : parsedWeight;
    const unit = cols[unitIndex] || '';
    const baseline = cols[baselineIndex] === '-' ? '-' : (parseFloat(cols[baselineIndex]) || '-');
    const rawTotalTarget = cols[totalTargetIndex];
    const rawTotalProgress = cols[totalProgressIndex];
    const rawAnnualTarget = cols[annualTargetIndex];
    const rawAnnualProgress = cols[annualProgressIndex];

    const isRawBlank = (val: string | undefined | null) => {
      if (val === undefined || val === null) return true;
      const s = val.trim();
      return s === '' || s === '-' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined';
    };

    const finalTotalTarget = isRawBlank(rawTotalTarget) ? 1 : (parseFloat(rawTotalTarget) === 0 ? 0 : (parseFloat(rawTotalTarget) || 0));
    const finalTotalProgress = isRawBlank(rawTotalProgress) ? 1 : (parseFloat(rawTotalProgress) === 0 ? 0 : (parseFloat(rawTotalProgress) || 0));
    const finalAnnualTarget = isRawBlank(rawAnnualTarget) ? 1 : (parseFloat(rawAnnualTarget) === 0 ? 0 : (parseFloat(rawAnnualTarget) || 0));
    const finalAnnualProgress = isRawBlank(rawAnnualProgress) ? 1 : (parseFloat(rawAnnualProgress) === 0 ? 0 : (parseFloat(rawAnnualProgress) || 0));

    // Retrieve Office & Gmail values dynamically
    const officeVal = officeIndex !== -1 && cols[officeIndex] ? cols[officeIndex].trim() : '';
    const gmailVal = gmailIndex !== -1 && cols[gmailIndex] ? cols[gmailIndex].trim() : '';

    // Real dynamic sector classification based on the 5-sector dashboard structure
    const category = getSectorForIndicator(name, sdg);

    parsedIndicators.push({
      id: `ind_${index}`,
      name,
      nameEn: tr.en,
      sdg,
      period,
      weight,
      unit,
      baseline,
      totalTarget: finalTotalTarget,
      totalProgress: finalTotalProgress,
      annualTarget: finalAnnualTarget,
      annualProgress: finalAnnualProgress,
      category,
      office: officeVal || getOfficeForIndicator(name),
      gmail: gmailVal || undefined,
    });
    index++;
  }

  // Attempt to scan rest of lines for metadata if not caught in rows
  for (const line of lines) {
    const fullText = line;
    if (fullText.includes('Last Update Date:')) {
      const match = fullText.match(/Last Update Date:\s*([0-9/]+)/i);
      if (match) lastUpdateDate = match[1];
    }
    if (fullText.includes('Next Update Date:')) {
      const match = fullText.match(/Next Update Date:\s*([0-9/]+)/i);
      if (match) nextUpdateDate = match[1];
    }
    if (fullText.includes('कुल  भार ,') || fullText.includes('कुल भार ,')) {
      const parts = fullText.split(',');
      for (const p of parts) {
        if (!isNaN(parseInt(p, 10)) && parseInt(p, 10) > 0) {
          totalWeight = parseInt(p, 10);
        }
      }
    }
    if (fullText.includes('कुल  भार प्रगति ,') || fullText.includes('कुल भार प्रगति ,')) {
      const parts = fullText.split(',');
      for (const p of parts) {
        if (!isNaN(parseInt(p, 10)) && parseInt(p, 10) > 0) {
          totalWeightProgress = parseInt(p, 10);
        }
      }
    }
  }

  return {
    indicators: parsedIndicators.length > 0 ? parsedIndicators : DEFAULT_INDICATORS,
    metadata: {
      lastUpdateDate,
      nextUpdateDate,
      totalWeight,
      totalWeightProgress,
    },
  };
}

export function setOfficesList(offices: { name: string; updated: string; avgCompletion?: number; total?: number }[]) {
  DOR_OFFICES_LIST = offices;
}
