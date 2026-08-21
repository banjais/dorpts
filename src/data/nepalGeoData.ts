export interface PalikaLocation {
  id: string;
  nameEn: string;
  nameNp: string;
  districtId: string;
  provinceId: number;
  type: 'Metropolitan' | 'Sub-Metropolitan' | 'Municipality' | 'Rural Municipality';
  lat: number;
  lng: number;
}

export interface DistrictLocation {
  id: string;
  nameEn: string;
  nameNp: string;
  provinceId: number;
  headquarterEn: string;
  headquarterNp: string;
  lat: number;
  lng: number;
  palikas: PalikaLocation[];
}

export interface ProvinceData {
  id: number;
  code: string;
  nameEn: string;
  nameNp: string;
  capitalEn: string;
  capitalNp: string;
  districts: DistrictLocation[];
}

export interface TollPoint {
  id: string;
  nameEn: string;
  nameNp: string;
  locationEn: string;
  locationNp: string;
  lat: number;
  lng: number;
  ratesNpr: {
    bike: number;
    car: number;
    bus: number;
    truck: number;
  };
}

export interface NationalHighway {
  id: string;
  code: string; // e.g. H01, H02, H03
  nameEn: string;
  nameNp: string;
  startPointEn: string;
  startPointNp: string;
  endPointEn: string;
  endPointNp: string;
  lengthKm: number;
  status: 'Open' | 'Widening/Maintenance' | 'Single Lane' | 'Landslide Alert' | 'Under Construction';
  statusNp: string;
  surfaceType: 'Blacktopped' | 'Concrete/Rigid' | 'Gravel' | 'Earthen';
  provincesCovered: number[]; // Province IDs
  districtsCovered: string[]; // District IDs
  majorHubs: { nameEn: string; nameNp: string; lat: number; lng: number }[];
  localRoadConnections: { nameEn: string; nameNp: string; connectsTo: string }[];
  tollPoints: TollPoint[];
  descriptionEn: string;
  descriptionNp: string;
}

export const NEPAL_PROVINCES: ProvinceData[] = [
  {
    id: 1,
    code: 'P1',
    nameEn: 'Koshi Province',
    nameNp: 'कोशी प्रदेश',
    capitalEn: 'Biratnagar',
    capitalNp: 'विराटनगर',
    districts: [
      {
        id: 'taplejung',
        nameEn: 'Taplejung',
        nameNp: 'ताप्लेजुङ',
        provinceId: 1,
        headquarterEn: 'Fungling',
        headquarterNp: 'फुङलिङ',
        lat: 27.3512,
        lng: 87.6714,
        palikas: [
          { id: 'fungling', nameEn: 'Phungling Municipality', nameNp: 'फुङलिङ नगरपालिका', districtId: 'taplejung', provinceId: 1, type: 'Municipality', lat: 27.3512, lng: 87.6714 },
          { id: 'sirijangha', nameEn: 'Sirijangha Rural Municipality', nameNp: 'सिरीजङ्घा गाउँपालिका', districtId: 'taplejung', provinceId: 1, type: 'Rural Municipality', lat: 27.412, lng: 87.891 }
        ]
      },
      {
        id: 'panchthar',
        nameEn: 'Panchthar',
        nameNp: 'पाँचथर',
        provinceId: 1,
        headquarterEn: 'Phidim',
        headquarterNp: 'फिदिम',
        lat: 27.1523,
        lng: 87.7651,
        palikas: [
          { id: 'phidim', nameEn: 'Phidim Municipality', nameNp: 'फिदिम नगरपालिका', districtId: 'panchthar', provinceId: 1, type: 'Municipality', lat: 27.1523, lng: 87.7651 }
        ]
      },
      {
        id: 'ilam',
        nameEn: 'Ilam',
        nameNp: 'इलाम',
        provinceId: 1,
        headquarterEn: 'Ilam',
        headquarterNp: 'इलाम',
        lat: 26.9115,
        lng: 87.9275,
        palikas: [
          { id: 'ilam_mun', nameEn: 'Ilam Municipality', nameNp: 'इलाम नगरपालिका', districtId: 'ilam', provinceId: 1, type: 'Municipality', lat: 26.9115, lng: 87.9275 },
          { id: 'suryodaya', nameEn: 'Suryodaya Municipality', nameNp: 'सूर्योदय नगरपालिका', districtId: 'ilam', provinceId: 1, type: 'Municipality', lat: 26.891, lng: 88.081 }
        ]
      },
      {
        id: 'jhapa',
        nameEn: 'Jhapa',
        nameNp: 'झापा',
        provinceId: 1,
        headquarterEn: 'Bhadrapur',
        headquarterNp: 'भद्रपुर',
        lat: 26.5452,
        lng: 88.0934,
        palikas: [
          { id: 'birtamod', nameEn: 'Birtamod Municipality', nameNp: 'बिर्तामोड नगरपालिका', districtId: 'jhapa', provinceId: 1, type: 'Municipality', lat: 26.634, lng: 87.986 },
          { id: 'damak', nameEn: 'Damak Municipality', nameNp: 'दमक नगरपालिका', districtId: 'jhapa', provinceId: 1, type: 'Municipality', lat: 26.666, lng: 87.689 },
          { id: 'bhadrapur', nameEn: 'Bhadrapur Municipality', nameNp: 'भद्रपुर नगरपालिका', districtId: 'jhapa', provinceId: 1, type: 'Municipality', lat: 26.5452, lng: 88.0934 }
        ]
      },
      {
        id: 'sunsari',
        nameEn: 'Sunsari',
        nameNp: 'सुनसरी',
        provinceId: 1,
        headquarterEn: 'Inaruwa',
        headquarterNp: 'इनरुवा',
        lat: 26.6042,
        lng: 87.1491,
        palikas: [
          { id: 'dharan', nameEn: 'Dharan Sub-Metropolitan City', nameNp: 'धरान उपमहानगरपालिका', districtId: 'sunsari', provinceId: 1, type: 'Sub-Metropolitan', lat: 26.812, lng: 87.283 },
          { id: 'itahari', nameEn: 'Itahari Sub-Metropolitan City', nameNp: 'इटहरी उपमहानगरपालिका', districtId: 'sunsari', provinceId: 1, type: 'Sub-Metropolitan', lat: 26.664, lng: 87.272 },
          { id: 'inaruwa', nameEn: 'Inaruwa Municipality', nameNp: 'इनरुवा नगरपालिका', districtId: 'sunsari', provinceId: 1, type: 'Municipality', lat: 26.6042, lng: 87.1491 }
        ]
      },
      {
        id: 'morang',
        nameEn: 'Morang',
        nameNp: 'मोरङ',
        provinceId: 1,
        headquarterEn: 'Biratnagar',
        headquarterNp: 'विराटनगर',
        lat: 26.4525,
        lng: 87.2718,
        palikas: [
          { id: 'biratnagar', nameEn: 'Biratnagar Metropolitan City', nameNp: 'विराटनगर महानगरपालिका', districtId: 'morang', provinceId: 1, type: 'Metropolitan', lat: 26.4525, lng: 87.2718 },
          { id: 'sundarharaicha', nameEn: 'Sundar Haraicha Municipality', nameNp: 'सुन्दरहरैँचा नगरपालिका', districtId: 'morang', provinceId: 1, type: 'Municipality', lat: 26.643, lng: 87.352 }
        ]
      },
      {
        id: 'sankhuwasabha',
        nameEn: 'Sankhuwasabha',
        nameNp: 'संखुवासभा',
        provinceId: 1,
        headquarterEn: 'Khandbari',
        headquarterNp: 'खाँदबारी',
        lat: 27.3735,
        lng: 87.2145,
        palikas: [
          { id: 'khandbari', nameEn: 'Khandbari Municipality', nameNp: 'खाँदबारी नगरपालिका', districtId: 'sankhuwasabha', provinceId: 1, type: 'Municipality', lat: 27.3735, lng: 87.2145 }
        ]
      },
      {
        id: 'dhankuta',
        nameEn: 'Dhankuta',
        nameNp: 'धनकुटा',
        provinceId: 1,
        headquarterEn: 'Dhankuta',
        headquarterNp: 'धनकुटा',
        lat: 26.9832,
        lng: 87.3331,
        palikas: [
          { id: 'dhankuta_mun', nameEn: 'Dhankuta Municipality', nameNp: 'धनकुटा नगरपालिका', districtId: 'dhankuta', provinceId: 1, type: 'Municipality', lat: 26.9832, lng: 87.3331 }
        ]
      },
      {
        id: 'bhojpur',
        nameEn: 'Bhojpur',
        nameNp: 'भोजपुर',
        provinceId: 1,
        headquarterEn: 'Bhojpur',
        headquarterNp: 'भोजपुर',
        lat: 27.1711,
        lng: 87.0452,
        palikas: [
          { id: 'bhojpur_mun', nameEn: 'Bhojpur Municipality', nameNp: 'भोजपुर नगरपालिका', districtId: 'bhojpur', provinceId: 1, type: 'Municipality', lat: 27.1711, lng: 87.0452 }
        ]
      },
      {
        id: 'terhathum',
        nameEn: 'Terhathum',
        nameNp: 'तेह्रथुम',
        provinceId: 1,
        headquarterEn: 'Myanglung',
        headquarterNp: 'म्याङलुङ',
        lat: 27.1352,
        lng: 87.5521,
        palikas: [
          { id: 'myanglung', nameEn: 'Myanglung Municipality', nameNp: 'म्याङलुङ नगरपालिका', districtId: 'terhathum', provinceId: 1, type: 'Municipality', lat: 27.1352, lng: 87.5521 }
        ]
      },
      {
        id: 'okhaldhunga',
        nameEn: 'Okhaldhunga',
        nameNp: 'ओखलढुङ्गा',
        provinceId: 1,
        headquarterEn: 'Siddhicharan',
        headquarterNp: 'सिद्धिचरण',
        lat: 27.3168,
        lng: 86.5022,
        palikas: [
          { id: 'siddhicharan', nameEn: 'Siddhicharan Municipality', nameNp: 'सिद्धिचरण नगरपालिका', districtId: 'okhaldhunga', provinceId: 1, type: 'Municipality', lat: 27.3168, lng: 86.5022 }
        ]
      },
      {
        id: 'khotang',
        nameEn: 'Khotang',
        nameNp: 'खोटाङ',
        provinceId: 1,
        headquarterEn: 'Diktel',
        headquarterNp: 'दिक्तेल',
        lat: 27.2115,
        lng: 86.7932,
        palikas: [
          { id: 'diktel', nameEn: 'Diktel Rupakot Majhuwagadhi', nameNp: 'दिक्तेल रुपाकोट मझुवागढी', districtId: 'khotang', provinceId: 1, type: 'Municipality', lat: 27.2115, lng: 86.7932 }
        ]
      },
      {
        id: 'solukhumbu',
        nameEn: 'Solukhumbu',
        nameNp: 'सोलुखुम्बु',
        provinceId: 1,
        headquarterEn: 'Salleri',
        headquarterNp: 'सल्लेरी',
        lat: 27.5021,
        lng: 86.5812,
        palikas: [
          { id: 'solududhkunda', nameEn: 'Solududhkunda Municipality', nameNp: 'सोलुदूधकुण्ड नगरपालिका', districtId: 'solukhumbu', provinceId: 1, type: 'Municipality', lat: 27.5021, lng: 86.5812 }
        ]
      },
      {
        id: 'udaipur',
        nameEn: 'Udayapur',
        nameNp: 'उदयपुर',
        provinceId: 1,
        headquarterEn: 'Gaighat',
        headquarterNp: 'गाईघाट',
        lat: 26.7951,
        lng: 86.7025,
        palikas: [
          { id: 'triyuga', nameEn: 'Triyuga Municipality (Gaighat)', nameNp: 'त्रियुगा नगरपालिका', districtId: 'udaipur', provinceId: 1, type: 'Municipality', lat: 26.7951, lng: 86.7025 },
          { id: 'katari', nameEn: 'Katari Municipality', nameNp: 'कटारी नगरपालिका', districtId: 'udaipur', provinceId: 1, type: 'Municipality', lat: 26.961, lng: 86.411 }
        ]
      }
    ]
  },
  {
    id: 2,
    code: 'P2',
    nameEn: 'Madhesh Province',
    nameNp: 'मधेस प्रदेश',
    capitalEn: 'Janakpur',
    capitalNp: 'जनकपुर',
    districts: [
      {
        id: 'saptari',
        nameEn: 'Saptari',
        nameNp: 'सप्तरी',
        provinceId: 2,
        headquarterEn: 'Rajbiraj',
        headquarterNp: 'राजविराज',
        lat: 26.5412,
        lng: 86.7452,
        palikas: [
          { id: 'rajbiraj', nameEn: 'Rajbiraj Municipality', nameNp: 'राजविराज नगरपालिका', districtId: 'saptari', provinceId: 2, type: 'Municipality', lat: 26.5412, lng: 86.7452 },
          { id: 'kanchanrup', nameEn: 'Kanchanrup Municipality', nameNp: 'कञ्चनरूप नगरपालिका', districtId: 'saptari', provinceId: 2, type: 'Municipality', lat: 26.651, lng: 86.921 }
        ]
      },
      {
        id: 'siraha',
        nameEn: 'Siraha',
        nameNp: 'सिराहा',
        provinceId: 2,
        headquarterEn: 'Siraha',
        headquarterNp: 'सिराहा',
        lat: 26.6521,
        lng: 86.2052,
        palikas: [
          { id: 'lahan', nameEn: 'Lahan Municipality', nameNp: 'लहान नगरपालिका', districtId: 'siraha', provinceId: 2, type: 'Municipality', lat: 26.718, lng: 86.483 },
          { id: 'siraha_mun', nameEn: 'Siraha Municipality', nameNp: 'सिराहा नगरपालिका', districtId: 'siraha', provinceId: 2, type: 'Municipality', lat: 26.6521, lng: 86.2052 }
        ]
      },
      {
        id: 'dhanusha',
        nameEn: 'Dhanusha',
        nameNp: 'धनुषा',
        provinceId: 2,
        headquarterEn: 'Janakpur',
        headquarterNp: 'जनकपुर',
        lat: 26.7281,
        lng: 85.9252,
        palikas: [
          { id: 'janakpurdham', nameEn: 'Janakpurdham Sub-Metropolitan', nameNp: 'जनकपुरधाम उपमहानगरपालिका', districtId: 'dhanusha', provinceId: 2, type: 'Sub-Metropolitan', lat: 26.7281, lng: 85.9252 },
          { id: 'dhalkebar', nameEn: 'Mithila Municipality (Dhalkebar)', nameNp: 'मिथिला नगरपालिका (ढल्केवर)', districtId: 'dhanusha', provinceId: 2, type: 'Municipality', lat: 26.962, lng: 85.971 }
        ]
      },
      {
        id: 'mahottari',
        nameEn: 'Mahottari',
        nameNp: 'महोत्तरी',
        provinceId: 2,
        headquarterEn: 'Jaleshwar',
        headquarterNp: 'जलेश्वरी',
        lat: 26.6432,
        lng: 85.8012,
        palikas: [
          { id: 'bardibas', nameEn: 'Bardibas Municipality', nameNp: 'बर्दिबास नगरपालिका', districtId: 'mahottari', provinceId: 2, type: 'Municipality', lat: 26.983, lng: 85.901 },
          { id: 'jaleshwar', nameEn: 'Jaleshwar Municipality', nameNp: 'जलेश्वरी नगरपालिका', districtId: 'mahottari', provinceId: 2, type: 'Municipality', lat: 26.6432, lng: 85.8012 }
        ]
      },
      {
        id: 'sarlahi',
        nameEn: 'Sarlahi',
        nameNp: 'सर्लाही',
        provinceId: 2,
        headquarterEn: 'Malangwa',
        headquarterNp: 'मलङ्गवा',
        lat: 26.8582,
        lng: 85.5612,
        palikas: [
          { id: 'lalbandi', nameEn: 'Lalbandi Municipality', nameNp: 'लालबन्दी नगरपालिका', districtId: 'sarlahi', provinceId: 2, type: 'Municipality', lat: 27.051, lng: 85.632 },
          { id: 'malangwa', nameEn: 'Malangwa Municipality', nameNp: 'मलङ्गवा नगरपालिका', districtId: 'sarlahi', provinceId: 2, type: 'Municipality', lat: 26.8582, lng: 85.5612 }
        ]
      },
      {
        id: 'rautahat',
        nameEn: 'Rautahat',
        nameNp: 'रौतहट',
        provinceId: 2,
        headquarterEn: 'Gaur',
        headquarterNp: 'गौर',
        lat: 26.7621,
        lng: 85.2812,
        palikas: [
          { id: 'chandrapur', nameEn: 'Chandrapur Municipality', nameNp: 'चन्द्रपुर नगरपालिका', districtId: 'rautahat', provinceId: 2, type: 'Municipality', lat: 27.142, lng: 85.341 },
          { id: 'gaur', nameEn: 'Gaur Municipality', nameNp: 'गौर नगरपालिका', districtId: 'rautahat', provinceId: 2, type: 'Municipality', lat: 26.7621, lng: 85.2812 }
        ]
      },
      {
        id: 'bara',
        nameEn: 'Bara',
        nameNp: 'बारा',
        provinceId: 2,
        headquarterEn: 'Kalaiya',
        headquarterNp: 'कलैया',
        lat: 27.0312,
        lng: 85.0021,
        palikas: [
          { id: 'jitpursimara', nameEn: 'Jitpursimara Sub-Metropolitan', nameNp: 'जितपुरसिमरा उपमहानगरपालिका', districtId: 'bara', provinceId: 2, type: 'Sub-Metropolitan', lat: 27.162, lng: 84.972 },
          { id: 'kalaiya', nameEn: 'Kalaiya Sub-Metropolitan', nameNp: 'कलैया उपमहानगरपालिका', districtId: 'bara', provinceId: 2, type: 'Sub-Metropolitan', lat: 27.0312, lng: 85.0021 }
        ]
      },
      {
        id: 'parsa',
        nameEn: 'Parsa',
        nameNp: 'पर्सा',
        provinceId: 2,
        headquarterEn: 'Birgunj',
        headquarterNp: 'वीरगञ्ज',
        lat: 27.0125,
        lng: 84.8812,
        palikas: [
          { id: 'birgunj', nameEn: 'Birgunj Metropolitan City', nameNp: 'वीरगञ्ज महानगरपालिका', districtId: 'parsa', provinceId: 2, type: 'Metropolitan', lat: 27.0125, lng: 84.8812 }
        ]
      }
    ]
  },
  {
    id: 3,
    code: 'P3',
    nameEn: 'Bagmati Province',
    nameNp: 'बागमती प्रदेश',
    capitalEn: 'Hetauda',
    capitalNp: 'हेटौँडा',
    districts: [
      {
        id: 'kathmandu',
        nameEn: 'Kathmandu',
        nameNp: 'काठमाडौँ',
        provinceId: 3,
        headquarterEn: 'Kathmandu',
        headquarterNp: 'काठमाडौँ',
        lat: 27.7172,
        lng: 85.324,
        palikas: [
          { id: 'kmc', nameEn: 'Kathmandu Metropolitan City', nameNp: 'काठमाडौँ महानगरपालिका', districtId: 'kathmandu', provinceId: 3, type: 'Metropolitan', lat: 27.7172, lng: 85.324 },
          { id: 'budhanilkantha', nameEn: 'Budhanilkantha Municipality', nameNp: 'बूढानीलकण्ठ नगरपालिका', districtId: 'kathmandu', provinceId: 3, type: 'Municipality', lat: 27.781, lng: 85.362 },
          { id: 'tokha', nameEn: 'Tokha Municipality', nameNp: 'टोखा नगरपालिका', districtId: 'kathmandu', provinceId: 3, type: 'Municipality', lat: 27.752, lng: 85.321 },
          { id: 'nagdhunga', nameEn: 'Chandragiri Municipality (Nagdhunga)', nameNp: 'चन्द्रागिरी नगरपालिका (नागढुङ्गा)', districtId: 'kathmandu', provinceId: 3, type: 'Municipality', lat: 27.692, lng: 85.201 }
        ]
      },
      {
        id: 'lalitpur',
        nameEn: 'Lalitpur',
        nameNp: 'ललितपुर',
        provinceId: 3,
        headquarterEn: 'Patan',
        headquarterNp: 'पाटन',
        lat: 27.6667,
        lng: 85.3167,
        palikas: [
          { id: 'lmc', nameEn: 'Lalitpur Metropolitan City', nameNp: 'ललितपुर महानगरपालिका', districtId: 'lalitpur', provinceId: 3, type: 'Metropolitan', lat: 27.6667, lng: 85.3167 },
          { id: 'godawari', nameEn: 'Godawari Municipality', nameNp: 'गोदावरी नगरपालिका', districtId: 'lalitpur', provinceId: 3, type: 'Municipality', lat: 27.591, lng: 85.372 }
        ]
      },
      {
        id: 'bhaktapur',
        nameEn: 'Bhaktapur',
        nameNp: 'भक्तपुर',
        provinceId: 3,
        headquarterEn: 'Bhaktapur',
        headquarterNp: 'भक्तपुर',
        lat: 27.671,
        lng: 85.4298,
        palikas: [
          { id: 'bhaktapur_mun', nameEn: 'Bhaktapur Municipality', nameNp: 'भक्तपुर नगरपालिका', districtId: 'bhaktapur', provinceId: 3, type: 'Municipality', lat: 27.671, lng: 85.4298 },
          { id: 'suryabinayak', nameEn: 'Suryabinayak Municipality', nameNp: 'सूर्यविनायक नगरपालिका', districtId: 'bhaktapur', provinceId: 3, type: 'Municipality', lat: 27.652, lng: 85.431 }
        ]
      },
      {
        id: 'kavrepalanchok',
        nameEn: 'Kavrepalanchok',
        nameNp: 'काभ्रेपलाञ्चोक',
        provinceId: 3,
        headquarterEn: 'Dhulikhel',
        headquarterNp: 'धुलिखेल',
        lat: 27.6252,
        lng: 85.5512,
        palikas: [
          { id: 'dhulikhel', nameEn: 'Dhulikhel Municipality', nameNp: 'धुलिखेल नगरपालिका', districtId: 'kavrepalanchok', provinceId: 3, type: 'Municipality', lat: 27.6252, lng: 85.5512 },
          { id: 'banepa', nameEn: 'Banepa Municipality', nameNp: 'बनेपा नगरपालिका', districtId: 'kavrepalanchok', provinceId: 3, type: 'Municipality', lat: 27.632, lng: 85.521 },
          { id: 'panauti', nameEn: 'Panauti Municipality', nameNp: 'पनौती नगरपालिका', districtId: 'kavrepalanchok', provinceId: 3, type: 'Municipality', lat: 27.581, lng: 85.512 }
        ]
      },
      {
        id: 'makwanpur',
        nameEn: 'Makwanpur',
        nameNp: 'मकवानपुर',
        provinceId: 3,
        headquarterEn: 'Hetauda',
        headquarterNp: 'हेटौँडा',
        lat: 27.4285,
        lng: 85.0321,
        palikas: [
          { id: 'hetauda', nameEn: 'Hetauda Sub-Metropolitan City', nameNp: 'हेटौँडा उपमहानगरपालिका', districtId: 'makwanpur', provinceId: 3, type: 'Sub-Metropolitan', lat: 27.4285, lng: 85.0321 },
          { id: 'thaha', nameEn: 'Thaha Municipality', nameNp: 'थाहा नगरपालिका', districtId: 'makwanpur', provinceId: 3, type: 'Municipality', lat: 27.601, lng: 85.142 }
        ]
      },
      {
        id: 'chitwan',
        nameEn: 'Chitwan',
        nameNp: 'चितवन',
        provinceId: 3,
        headquarterEn: 'Bharatpur',
        headquarterNp: 'भरतपुर',
        lat: 27.6833,
        lng: 84.4333,
        palikas: [
          { id: 'bharatpur', nameEn: 'Bharatpur Metropolitan City', nameNp: 'भरतपुर महानगरपालिका', districtId: 'chitwan', provinceId: 3, type: 'Metropolitan', lat: 27.6833, lng: 84.4333 },
          { id: 'ratnanagar', nameEn: 'Ratnanagar Municipality', nameNp: 'रत्ननगर नगरपालिका', districtId: 'chitwan', provinceId: 3, type: 'Municipality', lat: 27.631, lng: 84.512 },
          { id: 'mugling', nameEn: 'Ichchhakamana (Mugling)', nameNp: 'इच्छाकामना गाउँपालिका (मुग्लिन)', districtId: 'chitwan', provinceId: 3, type: 'Rural Municipality', lat: 27.852, lng: 84.551 }
        ]
      },
      {
        id: 'dhading',
        nameEn: 'Dhading',
        nameNp: 'धादिङ',
        provinceId: 3,
        headquarterEn: 'Dhading Besi',
        headquarterNp: 'धादिङ बेसी',
        lat: 27.8652,
        lng: 84.8912,
        palikas: [
          { id: 'nilkantha', nameEn: 'Nilkantha Municipality (Dhading Besi)', nameNp: 'नीलकण्ठ नगरपालिका', districtId: 'dhading', provinceId: 3, type: 'Municipality', lat: 27.8652, lng: 84.8912 },
          { id: 'galchi', nameEn: 'Galchi Rural Municipality', nameNp: 'गल्छी गाउँपालिका', districtId: 'dhading', provinceId: 3, type: 'Rural Municipality', lat: 27.812, lng: 85.031 },
          { id: 'gajuri', nameEn: 'Gajuri Rural Municipality', nameNp: 'गजुरी गाउँपालिका', districtId: 'dhading', provinceId: 3, type: 'Rural Municipality', lat: 27.801, lng: 84.882 }
        ]
      },
      {
        id: 'nuwakot',
        nameEn: 'Nuwakot',
        nameNp: 'नुवाकोट',
        provinceId: 3,
        headquarterEn: 'Bidur',
        headquarterNp: 'विदुर',
        lat: 27.8812,
        lng: 85.1612,
        palikas: [
          { id: 'bidur', nameEn: 'Bidur Municipality', nameNp: 'विदुर नगरपालिका', districtId: 'nuwakot', provinceId: 3, type: 'Municipality', lat: 27.8812, lng: 85.1612 }
        ]
      },
      {
        id: 'rasuwa',
        nameEn: 'Rasuwa',
        nameNp: 'रसुवा',
        provinceId: 3,
        headquarterEn: 'Dhunche',
        headquarterNp: 'धुन्चे',
        lat: 28.1121,
        lng: 85.2912,
        palikas: [
          { id: 'gosaikunda', nameEn: 'Gosaikunda Rural Municipality (Dhunche)', nameNp: 'गोसाइँकुण्ड गाउँपालिका', districtId: 'rasuwa', provinceId: 3, type: 'Rural Municipality', lat: 28.1121, lng: 85.2912 }
        ]
      },
      {
        id: 'sindhupalchok',
        nameEn: 'Sindhupalchok',
        nameNp: 'सिन्धुपाल्चोक',
        provinceId: 3,
        headquarterEn: 'Chautara',
        headquarterNp: 'चौतारा',
        lat: 27.7712,
        lng: 85.7121,
        palikas: [
          { id: 'chautara', nameEn: 'Chautara Sangachokgadhi Municipality', nameNp: 'चौतारा साँगाचोकगढी नगरपालिका', districtId: 'sindhupalchok', provinceId: 3, type: 'Municipality', lat: 27.7712, lng: 85.7121 },
          { id: 'melamchi', nameEn: 'Melamchi Municipality', nameNp: 'मेलम्ची नगरपालिका', districtId: 'sindhupalchok', provinceId: 3, type: 'Municipality', lat: 27.831, lng: 85.572 }
        ]
      },
      {
        id: 'dolakha',
        nameEn: 'Dolakha',
        nameNp: 'दोलखा',
        provinceId: 3,
        headquarterEn: 'Charikot',
        headquarterNp: 'चरीकोट',
        lat: 27.6712,
        lng: 86.0412,
        palikas: [
          { id: 'bhimeshwar', nameEn: 'Bhimeshwar Municipality (Charikot)', nameNp: 'भीमेश्वर नगरपालिका', districtId: 'dolakha', provinceId: 3, type: 'Municipality', lat: 27.6712, lng: 86.0412 },
          { id: 'jiri', nameEn: 'Jiri Municipality', nameNp: 'जिरी नगरपालिका', districtId: 'dolakha', provinceId: 3, type: 'Municipality', lat: 27.632, lng: 86.231 }
        ]
      },
      {
        id: 'ramechhap',
        nameEn: 'Ramechhap',
        nameNp: 'रामेछाप',
        provinceId: 3,
        headquarterEn: 'Manthali',
        headquarterNp: 'मन्थली',
        lat: 27.3812,
        lng: 86.0612,
        palikas: [
          { id: 'manthali', nameEn: 'Manthali Municipality', nameNp: 'मन्थली नगरपालिका', districtId: 'ramechhap', provinceId: 3, type: 'Municipality', lat: 27.3812, lng: 86.0612 }
        ]
      },
      {
        id: 'sindhuli',
        nameEn: 'Sindhuli',
        nameNp: 'सिन्धुली',
        provinceId: 3,
        headquarterEn: 'Sindhulimadi',
        headquarterNp: 'सिन्धुलीमाढी',
        lat: 27.2612,
        lng: 85.9712,
        palikas: [
          { id: 'kamalamai', nameEn: 'Kamalamai Municipality (Sindhulimadi)', nameNp: 'कमलामाई नगरपालिका', districtId: 'sindhuli', provinceId: 3, type: 'Municipality', lat: 27.2612, lng: 85.9712 },
          { id: 'khurkot', nameEn: 'Golanjor (Khurkot)', nameNp: 'गोलञ्जोर गाउँपालिका (खुर्कोट)', districtId: 'sindhuli', provinceId: 3, type: 'Rural Municipality', lat: 27.332, lng: 85.912 }
        ]
      }
    ]
  },
  {
    id: 4,
    code: 'P4',
    nameEn: 'Gandaki Province',
    nameNp: 'गण्डकी प्रदेश',
    capitalEn: 'Pokhara',
    capitalNp: 'पोखरा',
    districts: [
      {
        id: 'kaski',
        nameEn: 'Kaski',
        nameNp: 'कास्की',
        provinceId: 4,
        headquarterEn: 'Pokhara',
        headquarterNp: 'पोखरा',
        lat: 28.2096,
        lng: 83.9856,
        palikas: [
          { id: 'pokhara', nameEn: 'Pokhara Metropolitan City', nameNp: 'पोखरा महानगरपालिका', districtId: 'kaski', provinceId: 4, type: 'Metropolitan', lat: 28.2096, lng: 83.9856 },
          { id: 'annapurna', nameEn: 'Annapurna Rural Municipality', nameNp: 'अन्नपूर्ण गाउँपालिका', districtId: 'kaski', provinceId: 4, type: 'Rural Municipality', lat: 28.321, lng: 83.812 }
        ]
      },
      {
        id: 'tanahun',
        nameEn: 'Tanahun',
        nameNp: 'तनहुँ',
        provinceId: 4,
        headquarterEn: 'Damauli',
        headquarterNp: 'दमौली',
        lat: 27.9612,
        lng: 84.2812,
        palikas: [
          { id: 'vyas', nameEn: 'Vyas Municipality (Damauli)', nameNp: 'व्यास नगरपालिका', districtId: 'tanahun', provinceId: 4, type: 'Municipality', lat: 27.9612, lng: 84.2812 },
          { id: 'shuklagandaki', nameEn: 'Shuklagandaki Municipality', nameNp: 'शुक्लगण्डकी नगरपालिका', districtId: 'tanahun', provinceId: 4, type: 'Municipality', lat: 28.031, lng: 84.081 },
          { id: 'dumre', nameEn: 'Bandiport (Dumre)', nameNp: 'बन्दीपुर गाउँपालिका (डुम्रे)', districtId: 'tanahun', provinceId: 4, type: 'Rural Municipality', lat: 27.942, lng: 84.412 }
        ]
      },
      {
        id: 'gorkha',
        nameEn: 'Gorkha',
        nameNp: 'गोरखा',
        provinceId: 4,
        headquarterEn: 'Gorkha Bazaar',
        headquarterNp: 'गोरखा बजार',
        lat: 28.0012,
        lng: 84.6212,
        palikas: [
          { id: 'gorkha_mun', nameEn: 'Gorkha Municipality', nameNp: 'गोरखा नगरपालिका', districtId: 'gorkha', provinceId: 4, type: 'Municipality', lat: 28.0012, lng: 84.6212 },
          { id: 'palungtar', nameEn: 'Palungtar Municipality', nameNp: 'पालुङटार नगरपालिका', districtId: 'gorkha', provinceId: 4, type: 'Municipality', lat: 28.051, lng: 84.481 }
        ]
      },
      {
        id: 'lamjung',
        nameEn: 'Lamjung',
        nameNp: 'लमजुङ',
        provinceId: 4,
        headquarterEn: 'Besisahar',
        headquarterNp: 'बेसीसहर',
        lat: 28.2312,
        lng: 84.3712,
        palikas: [
          { id: 'besisahar', nameEn: 'Besisahar Municipality', nameNp: 'बेसीसहर नगरपालिका', districtId: 'lamjung', provinceId: 4, type: 'Municipality', lat: 28.2312, lng: 84.3712 }
        ]
      },
      {
        id: 'syangja',
        nameEn: 'Syangja',
        nameNp: 'स्याङ्जा',
        provinceId: 4,
        headquarterEn: 'Syangja Bazaar',
        headquarterNp: 'स्याङ्जा बजार',
        lat: 28.1012,
        lng: 83.8812,
        palikas: [
          { id: 'putalibazar', nameEn: 'Putalibazar Municipality', nameNp: 'पुतलीबजार नगरपालिका', districtId: 'syangja', provinceId: 4, type: 'Municipality', lat: 28.1012, lng: 83.8812 },
          { id: 'waling', nameEn: 'Waling Municipality', nameNp: 'वालिङ नगरपालिका', districtId: 'syangja', provinceId: 4, type: 'Municipality', lat: 27.981, lng: 83.771 }
        ]
      },
      {
        id: 'parbat',
        nameEn: 'Parbat',
        nameNp: 'पर्वत',
        provinceId: 4,
        headquarterEn: 'Kusma',
        headquarterNp: 'कुश्मा',
        lat: 28.2312,
        lng: 83.6812,
        palikas: [
          { id: 'kusma', nameEn: 'Kusma Municipality', nameNp: 'कुश्मा नगरपालिका', districtId: 'parbat', provinceId: 4, type: 'Municipality', lat: 28.2312, lng: 83.6812 }
        ]
      },
      {
        id: 'myagdi',
        nameEn: 'Myagdi',
        nameNp: 'म्याग्दी',
        provinceId: 4,
        headquarterEn: 'Beni',
        headquarterNp: 'बेनी',
        lat: 28.3512,
        lng: 83.5612,
        palikas: [
          { id: 'beni', nameEn: 'Beni Municipality', nameNp: 'बेनी नगरपालिका', districtId: 'myagdi', provinceId: 4, type: 'Municipality', lat: 28.3512, lng: 83.5612 }
        ]
      },
      {
        id: 'baglung',
        nameEn: 'Baglung',
        nameNp: 'बागलुङ',
        provinceId: 4,
        headquarterEn: 'Baglung Bazaar',
        headquarterNp: 'बागलुङ बजार',
        lat: 28.2712,
        lng: 83.6012,
        palikas: [
          { id: 'baglung_mun', nameEn: 'Baglung Municipality', nameNp: 'बागलुङ नगरपालिका', districtId: 'baglung', provinceId: 4, type: 'Municipality', lat: 28.2712, lng: 83.6012 },
          { id: 'dhorpatan', nameEn: 'Dhorpatan Municipality', nameNp: 'ढोरपाटन नगरपालिका', districtId: 'baglung', provinceId: 4, type: 'Municipality', lat: 28.412, lng: 83.051 }
        ]
      },
      {
        id: 'manang',
        nameEn: 'Manang',
        nameNp: 'मनाङ',
        provinceId: 4,
        headquarterEn: 'Chame',
        headquarterNp: 'चामे',
        lat: 28.5512,
        lng: 84.2312,
        palikas: [
          { id: 'chame', nameEn: 'Chame Rural Municipality', nameNp: 'चामे गाउँपालिका', districtId: 'manang', provinceId: 4, type: 'Rural Municipality', lat: 28.5512, lng: 84.2312 }
        ]
      },
      {
        id: 'mustang',
        nameEn: 'Mustang',
        nameNp: 'मुस्ताङ',
        provinceId: 4,
        headquarterEn: 'Jomsom',
        headquarterNp: 'जोमसोम',
        lat: 28.7812,
        lng: 83.7312,
        palikas: [
          { id: 'jomsom', nameEn: 'Gharapjhong (Jomsom)', nameNp: 'घरपझोङ गाउँपालिका (जोमसोम)', districtId: 'mustang', provinceId: 4, type: 'Rural Municipality', lat: 28.7812, lng: 83.7312 },
          { id: 'lo_manthang', nameEn: 'Lo-Manthang Rural Municipality', nameNp: 'लो-मन्थाङ गाउँपालिका', districtId: 'mustang', provinceId: 4, type: 'Rural Municipality', lat: 29.181, lng: 83.951 }
        ]
      },
      {
        id: 'nawalpur',
        nameEn: 'Nawalpur (Nawalparasi East)',
        nameNp: 'नवलपुर (नवलपरासी पूर्व)',
        provinceId: 4,
        headquarterEn: 'Kawasoti',
        headquarterNp: 'कावासोती',
        lat: 27.6512,
        lng: 84.1212,
        palikas: [
          { id: 'kawasoti', nameEn: 'Kawasoti Municipality', nameNp: 'कावासोती नगरपालिका', districtId: 'nawalpur', provinceId: 4, type: 'Municipality', lat: 27.6512, lng: 84.1212 },
          { id: 'gaidakot', nameEn: 'Gaidakot Municipality', nameNp: 'गैँडाकोट नगरपालिका', districtId: 'nawalpur', provinceId: 4, type: 'Municipality', lat: 27.701, lng: 84.412 }
        ]
      }
    ]
  },
  {
    id: 5,
    code: 'P5',
    nameEn: 'Lumbini Province',
    nameNp: 'लुम्बिनी प्रदेश',
    capitalEn: 'Deukhuri (Dang)',
    capitalNp: 'देउखुरी (दाङ)',
    districts: [
      {
        id: 'rupandehi',
        nameEn: 'Rupandehi',
        nameNp: 'रुपन्देही',
        provinceId: 5,
        headquarterEn: 'Bhairahawa',
        headquarterNp: 'भैरहवा',
        lat: 27.5012,
        lng: 83.4512,
        palikas: [
          { id: 'butwal', nameEn: 'Butwal Sub-Metropolitan City', nameNp: 'बुटवल उपमहानगरपालिका', districtId: 'rupandehi', provinceId: 5, type: 'Sub-Metropolitan', lat: 27.701, lng: 83.461 },
          { id: 'siddharthanagar', nameEn: 'Siddharthanagar (Bhairahawa)', nameNp: 'सिद्धार्थनगर नगरपालिका', districtId: 'rupandehi', provinceId: 5, type: 'Municipality', lat: 27.5012, lng: 83.4512 },
          { id: 'lumbini_sanskritik', nameEn: 'Lumbini Sanskritik Municipality', nameNp: 'लुम्बिनी सांस्कृतिक नगरपालिका', districtId: 'rupandehi', provinceId: 5, type: 'Municipality', lat: 27.481, lng: 83.271 }
        ]
      },
      {
        id: 'kapilvastu',
        nameEn: 'Kapilvastu',
        nameNp: 'कपिलवस्तु',
        provinceId: 5,
        headquarterEn: 'Taulihawa',
        headquarterNp: 'तौलिहवा',
        lat: 27.5412,
        lng: 83.0512,
        palikas: [
          { id: 'kapilvastu_mun', nameEn: 'Kapilvastu Municipality', nameNp: 'कपिलवस्तु नगरपालिका', districtId: 'kapilvastu', provinceId: 5, type: 'Municipality', lat: 27.5412, lng: 83.0512 },
          { id: 'chandrauta', nameEn: 'Shivaraj Municipality (Chandrauta)', nameNp: 'शिवराज नगरपालिका (चन्द्रौटा)', districtId: 'kapilvastu', provinceId: 5, type: 'Municipality', lat: 27.681, lng: 82.881 }
        ]
      },
      {
        id: 'parasi',
        nameEn: 'Parasi (Nawalparasi West)',
        nameNp: 'परासी (नवलपरासी पश्चिम)',
        provinceId: 5,
        headquarterEn: 'Ramgram',
        headquarterNp: 'रामग्राम',
        lat: 27.5312,
        lng: 83.6712,
        palikas: [
          { id: 'ramgram', nameEn: 'Ramgram Municipality (Parasi)', nameNp: 'रामग्राम नगरपालिका', districtId: 'parasi', provinceId: 5, type: 'Municipality', lat: 27.5312, lng: 83.6712 },
          { id: 'bardaghat', nameEn: 'Bardaghat Municipality', nameNp: 'बर्दघाट नगरपालिका', districtId: 'parasi', provinceId: 5, type: 'Municipality', lat: 27.601, lng: 83.801 }
        ]
      },
      {
        id: 'palpa',
        nameEn: 'Palpa',
        nameNp: 'पाल्पा',
        provinceId: 5,
        headquarterEn: 'Tansen',
        headquarterNp: 'तानसेन',
        lat: 27.8612,
        lng: 83.5412,
        palikas: [
          { id: 'tansen', nameEn: 'Tansen Municipality', nameNp: 'तानसेन नगरपालिका', districtId: 'palpa', provinceId: 5, type: 'Municipality', lat: 27.8612, lng: 83.5412 },
          { id: 'ramdi', nameEn: 'Rambha Rural Municipality (Ramdi)', nameNp: 'रम्भा गाउँपालिका', districtId: 'palpa', provinceId: 5, type: 'Rural Municipality', lat: 27.951, lng: 83.612 }
        ]
      },
      {
        id: 'arghakhanchi',
        nameEn: 'Arghakhanchi',
        nameNp: 'अर्घाखाँची',
        provinceId: 5,
        headquarterEn: 'Sandhikharka',
        headquarterNp: 'सन्धिखर्क',
        lat: 27.9612,
        lng: 83.1212,
        palikas: [
          { id: 'sandhikharka', nameEn: 'Sandhikharka Municipality', nameNp: 'सन्धिखर्क नगरपालिका', districtId: 'arghakhanchi', provinceId: 5, type: 'Municipality', lat: 27.9612, lng: 83.1212 }
        ]
      },
      {
        id: 'gulmi',
        nameEn: 'Gulmi',
        nameNp: 'गुल्मी',
        provinceId: 5,
        headquarterEn: 'Tamghas',
        headquarterNp: 'तमघास',
        lat: 28.0612,
        lng: 83.2512,
        palikas: [
          { id: 'resunga', nameEn: 'Resunga Municipality (Tamghas)', nameNp: 'रेसुङ्गा नगरपालिका', districtId: 'gulmi', provinceId: 5, type: 'Municipality', lat: 28.0612, lng: 83.2512 }
        ]
      },
      {
        id: 'dang',
        nameEn: 'Dang',
        nameNp: 'दाङ',
        provinceId: 5,
        headquarterEn: 'Ghorahi',
        headquarterNp: 'घोराही',
        lat: 28.0312,
        lng: 82.4812,
        palikas: [
          { id: 'ghorahi', nameEn: 'Ghorahi Sub-Metropolitan City', nameNp: 'घोराही उपमहानगरपालिका', districtId: 'dang', provinceId: 5, type: 'Sub-Metropolitan', lat: 28.0312, lng: 82.4812 },
          { id: 'tulsipur', nameEn: 'Tulsipur Sub-Metropolitan City', nameNp: 'तुलसीपुर उपमहानगरपालिका', districtId: 'dang', provinceId: 5, type: 'Sub-Metropolitan', lat: 28.131, lng: 82.291 },
          { id: 'lamahi', nameEn: 'Lamahi Municipality', nameNp: 'लमही नगरपालिका', districtId: 'dang', provinceId: 5, type: 'Municipality', lat: 27.871, lng: 82.571 }
        ]
      },
      {
        id: 'pyuthan',
        nameEn: 'Pyuthan',
        nameNp: 'प्युठान',
        provinceId: 5,
        headquarterEn: 'Pyuthan Khalanga',
        headquarterNp: 'प्युठान खलङ्गा',
        lat: 28.1012,
        lng: 82.8612,
        palikas: [
          { id: 'pyuthan_mun', nameEn: 'Pyuthan Municipality', nameNp: 'प्युठान नगरपालिका', districtId: 'pyuthan', provinceId: 5, type: 'Municipality', lat: 28.1012, lng: 82.8612 }
        ]
      },
      {
        id: 'rolpa',
        nameEn: 'Rolpa',
        nameNp: 'रोल्पा',
        provinceId: 5,
        headquarterEn: 'Liwang',
        headquarterNp: 'लिवाङ',
        lat: 28.3012,
        lng: 82.6312,
        palikas: [
          { id: 'rolpa_mun', nameEn: 'Rolpa Municipality (Liwang)', nameNp: 'रोल्पा नगरपालिका', districtId: 'rolpa', provinceId: 5, type: 'Municipality', lat: 28.3012, lng: 82.6312 }
        ]
      },
      {
        id: 'eastern_rukum',
        nameEn: 'Eastern Rukum',
        nameNp: 'पूर्वी रुकुम',
        provinceId: 5,
        headquarterEn: 'Rukumkot',
        headquarterNp: 'रुकुमकोट',
        lat: 28.6012,
        lng: 82.6812,
        palikas: [
          { id: 'sisne', nameEn: 'Sisne Rural Municipality (Rukumkot)', nameNp: 'सिस्ने गाउँपालिका', districtId: 'eastern_rukum', provinceId: 5, type: 'Rural Municipality', lat: 28.6012, lng: 82.6812 }
        ]
      },
      {
        id: 'banke',
        nameEn: 'Banke',
        nameNp: 'बाँके',
        provinceId: 5,
        headquarterEn: 'Nepalgunj',
        headquarterNp: 'नेपालगञ्ज',
        lat: 28.0512,
        lng: 81.6121,
        palikas: [
          { id: 'nepalgunj', nameEn: 'Nepalgunj Sub-Metropolitan City', nameNp: 'नेपालगञ्ज उपमहानगरपालिका', districtId: 'banke', provinceId: 5, type: 'Sub-Metropolitan', lat: 28.0512, lng: 81.6121 },
          { id: 'kohalpur', nameEn: 'Kohalpur Municipality', nameNp: 'कोहलपुर नगरपालिका', districtId: 'banke', provinceId: 5, type: 'Municipality', lat: 28.181, lng: 81.681 }
        ]
      },
      {
        id: 'bardiya',
        nameEn: 'Bardiya',
        nameNp: 'बर्दिया',
        provinceId: 5,
        headquarterEn: 'Gulariya',
        headquarterNp: 'गुलेरिया',
        lat: 28.2312,
        lng: 81.3512,
        palikas: [
          { id: 'gulariya', nameEn: 'Gulariya Municipality', nameNp: 'गुलेरिया नगरपालिका', districtId: 'bardiya', provinceId: 5, type: 'Municipality', lat: 28.2312, lng: 81.3512 },
          { id: 'bansgarhi', nameEn: 'Bansgarhi Municipality', nameNp: 'बाँसगढी नगरपालिका', districtId: 'bardiya', provinceId: 5, type: 'Municipality', lat: 28.281, lng: 81.561 }
        ]
      }
    ]
  },
  {
    id: 6,
    code: 'P6',
    nameEn: 'Karnali Province',
    nameNp: 'कर्णाली प्रदेश',
    capitalEn: 'Birendranagar (Surkhet)',
    capitalNp: 'वीरेन्द्रनगर (सुर्खेत)',
    districts: [
      {
        id: 'surkhet',
        nameEn: 'Surkhet',
        nameNp: 'सुर्खेत',
        provinceId: 6,
        headquarterEn: 'Birendranagar',
        headquarterNp: 'वीरेन्द्रनगर',
        lat: 28.6012,
        lng: 81.6312,
        palikas: [
          { id: 'birendranagar', nameEn: 'Birendranagar Municipality', nameNp: 'वीरेन्द्रनगर नगरपालिका', districtId: 'surkhet', provinceId: 6, type: 'Municipality', lat: 28.6012, lng: 81.6312 }
        ]
      },
      {
        id: 'dailekh',
        nameEn: 'Dailekh',
        nameNp: 'दैलेख',
        provinceId: 6,
        headquarterEn: 'Narayan',
        headquarterNp: 'नारायण',
        lat: 28.8312,
        lng: 81.7121,
        palikas: [
          { id: 'narayan', nameEn: 'Narayan Municipality (Dailekh)', nameNp: 'नारायण नगरपालिका', districtId: 'dailekh', provinceId: 6, type: 'Municipality', lat: 28.8312, lng: 81.7121 }
        ]
      },
      {
        id: 'jajarkot',
        nameEn: 'Jajarkot',
        nameNp: 'जाजरकोट',
        provinceId: 6,
        headquarterEn: 'Khalanga',
        headquarterNp: 'खलङ्गा',
        lat: 28.7012,
        lng: 82.2012,
        palikas: [
          { id: 'bheri', nameEn: 'Bheri Municipality (Jajarkot)', nameNp: 'भेरी नगरपालिका', districtId: 'jajarkot', provinceId: 6, type: 'Municipality', lat: 28.7012, lng: 82.2012 }
        ]
      },
      {
        id: 'western_rukum',
        nameEn: 'Western Rukum',
        nameNp: 'पश्चिम रुकुम',
        provinceId: 6,
        headquarterEn: 'Musikot',
        headquarterNp: 'मुसीकोट',
        lat: 28.6312,
        lng: 82.4712,
        palikas: [
          { id: 'musikot', nameEn: 'Musikot Municipality', nameNp: 'मुसीकोट नगरपालिका', districtId: 'western_rukum', provinceId: 6, type: 'Municipality', lat: 28.6312, lng: 82.4712 },
          { id: 'chaurajahari', nameEn: 'Chaurajahari Municipality', nameNp: 'चौरजहारी नगरपालिका', districtId: 'western_rukum', provinceId: 6, type: 'Municipality', lat: 28.651, lng: 82.261 }
        ]
      },
      {
        id: 'salyan',
        nameEn: 'Salyan',
        nameNp: 'सल्यान',
        provinceId: 6,
        headquarterEn: 'Salyan Khalanga',
        headquarterNp: 'सल्यान खलङ्गा',
        lat: 28.3712,
        lng: 82.1612,
        palikas: [
          { id: 'sharada', nameEn: 'Sharada Municipality (Salyan)', nameNp: 'शारदा नगरपालिका', districtId: 'salyan', provinceId: 6, type: 'Municipality', lat: 28.3712, lng: 82.1612 }
        ]
      },
      {
        id: 'kalikot',
        nameEn: 'Kalikot',
        nameNp: 'कालिकोट',
        provinceId: 6,
        headquarterEn: 'Manma',
        headquarterNp: 'मान्म',
        lat: 29.1512,
        lng: 81.6121,
        palikas: [
          { id: 'khandachakra', nameEn: 'Khandachakra Municipality (Manma)', nameNp: 'खाँडाचक्र नगरपालिका', districtId: 'kalikot', provinceId: 6, type: 'Municipality', lat: 29.1512, lng: 81.6121 }
        ]
      },
      {
        id: 'jumla',
        nameEn: 'Jumla',
        nameNp: 'जुम्ला',
        provinceId: 6,
        headquarterEn: 'Chandannath',
        headquarterNp: 'चन्दनाथ',
        lat: 29.2752,
        lng: 82.1852,
        palikas: [
          { id: 'chandannath', nameEn: 'Chandannath Municipality', nameNp: 'चन्दनाथ नगरपालिका', districtId: 'jumla', provinceId: 6, type: 'Municipality', lat: 29.2752, lng: 82.1852 }
        ]
      },
      {
        id: 'mugu',
        nameEn: 'Mugu',
        nameNp: 'मुगु',
        provinceId: 6,
        headquarterEn: 'Gamgadhi',
        headquarterNp: 'गमगढी',
        lat: 29.5512,
        lng: 82.1612,
        palikas: [
          { id: 'shadow_nath', nameEn: 'Chhayanath Rara Municipality (Gamgadhi)', nameNp: 'छायाँनाथ रारा नगरपालिका', districtId: 'mugu', provinceId: 6, type: 'Municipality', lat: 29.5512, lng: 82.1612 }
        ]
      },
      {
        id: 'humla',
        nameEn: 'Humla',
        nameNp: 'हुम्ला',
        provinceId: 6,
        headquarterEn: 'Simikot',
        headquarterNp: 'सिमिकोट',
        lat: 29.9712,
        lng: 81.8312,
        palikas: [
          { id: 'simikot', nameEn: 'Simikot Rural Municipality', nameNp: 'सिमिकोट गाउँपालिका', districtId: 'humla', provinceId: 6, type: 'Rural Municipality', lat: 29.9712, lng: 81.8312 }
        ]
      },
      {
        id: 'dolpa',
        nameEn: 'Dolpa',
        nameNp: 'डोल्पा',
        provinceId: 6,
        headquarterEn: 'Dunai',
        headquarterNp: 'दुनै',
        lat: 28.9312,
        lng: 82.9121,
        palikas: [
          { id: 'thuli_bheri', nameEn: 'Thuli Bheri Municipality (Dunai)', nameNp: 'ठूली भेरी नगरपालिका', districtId: 'dolpa', provinceId: 6, type: 'Municipality', lat: 28.9312, lng: 82.9121 }
        ]
      }
    ]
  },
  {
    id: 7,
    code: 'P7',
    nameEn: 'Sudurpashchim Province',
    nameNp: 'सुदूरपश्चिम प्रदेश',
    capitalEn: 'Godawari (Kailali)',
    capitalNp: 'गोदावरी (कैलाली)',
    districts: [
      {
        id: 'kailali',
        nameEn: 'Kailali',
        nameNp: 'कैलाली',
        provinceId: 7,
        headquarterEn: 'Dhangadhi',
        headquarterNp: 'धनगढी',
        lat: 28.6852,
        lng: 80.6012,
        palikas: [
          { id: 'dhangadhi', nameEn: 'Dhangadhi Sub-Metropolitan City', nameNp: 'धनगढी उपमहानगरपालिका', districtId: 'kailali', provinceId: 7, type: 'Sub-Metropolitan', lat: 28.6852, lng: 80.6012 },
          { id: 'godawari_kailali', nameEn: 'Godawari Municipality (Attariya)', nameNp: 'गोदावरी नगरपालिका (अत्तरिया)', districtId: 'kailali', provinceId: 7, type: 'Municipality', lat: 28.801, lng: 80.561 },
          { id: 'tikapur', nameEn: 'Tikapur Municipality', nameNp: 'टीकापुर नगरपालिका', districtId: 'kailali', provinceId: 7, type: 'Municipality', lat: 28.512, lng: 81.121 }
        ]
      },
      {
        id: 'kanchanpur',
        nameEn: 'Kanchanpur',
        nameNp: 'कञ्चनपुर',
        provinceId: 7,
        headquarterEn: 'Bhimdatta (Mahendranagar)',
        headquarterNp: 'भीमदत्त (महेन्द्रनगर)',
        lat: 28.9612,
        lng: 80.1812,
        palikas: [
          { id: 'bhimdatta', nameEn: 'Bhimdatta Municipality (Mahendranagar)', nameNp: 'भीमदत्त नगरपालिका', districtId: 'kanchanpur', provinceId: 7, type: 'Municipality', lat: 28.9612, lng: 80.1812 },
          { id: 'bedkot', nameEn: 'Bedkot Municipality', nameNp: 'बेदकोट नगरपालिका', districtId: 'kanchanpur', provinceId: 7, type: 'Municipality', lat: 28.981, lng: 80.312 }
        ]
      },
      {
        id: 'dadeldhura',
        nameEn: 'Dadeldhura',
        nameNp: 'डडेल्धुरा',
        provinceId: 7,
        headquarterEn: 'Amargadhi',
        headquarterNp: 'अमरगढी',
        lat: 29.3012,
        lng: 80.5812,
        palikas: [
          { id: 'amargadhi', nameEn: 'Amargadhi Municipality', nameNp: 'अमरगढी नगरपालिका', districtId: 'dadeldhura', provinceId: 7, type: 'Municipality', lat: 29.3012, lng: 80.5812 }
        ]
      },
      {
        id: 'doti',
        nameEn: 'Doti',
        nameNp: 'डोटी',
        provinceId: 7,
        headquarterEn: 'Dipayal Silgadhi',
        headquarterNp: 'दिपायल सिलगढी',
        lat: 29.2612,
        lng: 80.9412,
        palikas: [
          { id: 'dipayal', nameEn: 'Dipayal Silgadhi Municipality', nameNp: 'दिपायल सिलगढी नगरपालिका', districtId: 'doti', provinceId: 7, type: 'Municipality', lat: 29.2612, lng: 80.9412 }
        ]
      },
      {
        id: 'achham',
        nameEn: 'Achham',
        nameNp: 'अछाम',
        provinceId: 7,
        headquarterEn: 'Mangalsen',
        headquarterNp: 'मङ्गलसेन',
        lat: 29.1312,
        lng: 81.2612,
        palikas: [
          { id: 'mangalsen', nameEn: 'Mangalsen Municipality', nameNp: 'मङ्गलसेन नगरपालिका', districtId: 'achham', provinceId: 7, type: 'Municipality', lat: 29.1312, lng: 81.2612 },
          { id: 'sanfebagar', nameEn: 'Sanfebagar Municipality', nameNp: 'साँफेबगर नगरपालिका', districtId: 'achham', provinceId: 7, type: 'Municipality', lat: 29.212, lng: 81.212 }
        ]
      },
      {
        id: 'baitadi',
        nameEn: 'Baitadi',
        nameNp: 'बैतडी',
        provinceId: 7,
        headquarterEn: 'Dasharathchand',
        headquarterNp: 'दशरथचन्द',
        lat: 29.5212,
        lng: 80.4212,
        palikas: [
          { id: 'dasharathchand', nameEn: 'Dasharathchand Municipality', nameNp: 'दशरथचन्द नगरपालिका', districtId: 'baitadi', provinceId: 7, type: 'Municipality', lat: 29.5212, lng: 80.4212 }
        ]
      },
      {
        id: 'darchula',
        nameEn: 'Darchula',
        nameNp: 'दार्चुला',
        provinceId: 7,
        headquarterEn: 'Darchula (Khalanga)',
        headquarterNp: 'दार्चुला (खलङ्गा)',
        lat: 29.8512,
        lng: 80.5412,
        palikas: [
          { id: 'mahakali_darchula', nameEn: 'Mahakali Municipality', nameNp: 'महाकाली नगरपालिका', districtId: 'darchula', provinceId: 7, type: 'Municipality', lat: 29.8512, lng: 80.5412 }
        ]
      },
      {
        id: 'bajhang',
        nameEn: 'Bajhang',
        nameNp: 'बझाङ',
        provinceId: 7,
        headquarterEn: 'Chainpur',
        headquarterNp: 'चैनपुर',
        lat: 29.5612,
        lng: 81.1812,
        palikas: [
          { id: 'jayaprithvi', nameEn: 'Jaya Prithvi Municipality (Chainpur)', nameNp: 'जयपृथ्वी नगरपालिका', districtId: 'bajhang', provinceId: 7, type: 'Municipality', lat: 29.5612, lng: 81.1812 }
        ]
      },
      {
        id: 'bajura',
        nameEn: 'Bajura',
        nameNp: 'बाजुरा',
        provinceId: 7,
        headquarterEn: 'Martadi',
        headquarterNp: 'मार्तडी',
        lat: 29.4512,
        lng: 81.5612,
        palikas: [
          { id: 'badimalika', nameEn: 'Badimalika Municipality (Martadi)', nameNp: 'बडीमालिका नगरपालिका', districtId: 'bajura', provinceId: 7, type: 'Municipality', lat: 29.4512, lng: 81.5612 }
        ]
      }
    ]
  }
];

export const NATIONAL_HIGHWAYS: NationalHighway[] = [
  {
    id: 'h01',
    code: 'H01',
    nameEn: 'Mahendra Highway (East-West Highway)',
    nameNp: 'महेन्द्र राजमार्ग (पूर्व-पश्चिम राजमार्ग)',
    startPointEn: 'Kakarbhitta (Jhapa)',
    startPointNp: 'काँकडभिट्टा (झापा)',
    endPointEn: 'Gaddachowki (Kanchanpur)',
    endPointNp: 'गड्डाचौकी (कञ्चनपुर)',
    lengthKm: 1027,
    status: 'Widening/Maintenance',
    statusNp: 'विस्तार तथा स्तरोन्नति हुँदै',
    surfaceType: 'Blacktopped',
    provincesCovered: [1, 2, 3, 5, 7],
    districtsCovered: ['jhapa', 'sunsari', 'morang', 'saptari', 'siraha', 'dhanusha', 'mahottari', 'sarlahi', 'rautahat', 'bara', 'parsa', 'makwanpur', 'chitwan', 'nawalpur', 'parasi', 'rupandehi', 'kapilvastu', 'dang', 'banke', 'bardiya', 'kailali', 'kanchanpur'],
    majorHubs: [
      { nameEn: 'Damak', nameNp: 'दमक', lat: 26.666, lng: 87.689 },
      { nameEn: 'Itahari', nameNp: 'इटहरी', lat: 26.664, lng: 87.272 },
      { nameEn: 'Lahan', nameNp: 'लहान', lat: 26.718, lng: 86.483 },
      { nameEn: 'Bardibas', nameNp: 'बर्दिबास', lat: 26.983, lng: 85.901 },
      { nameEn: 'Pathlaiya', nameNp: 'पथलैया', lat: 27.151, lng: 84.981 },
      { nameEn: 'Narayanghat', nameNp: 'नारायणगढ', lat: 27.683, lng: 84.433 },
      { nameEn: 'Butwal', nameNp: 'बुटवल', lat: 27.701, lng: 83.461 },
      { nameEn: 'Kohalpur', nameNp: 'कोहलपुर', lat: 28.181, lng: 81.681 },
      { nameEn: 'Attariya', nameNp: 'अत्तरिया', lat: 28.801, lng: 80.561 }
    ],
    localRoadConnections: [
      { nameEn: 'Feeder Road to Biratnagar', nameNp: 'विराटनगर जोड्ने सहायक मार्ग', connectsTo: 'Itahari' },
      { nameEn: 'Feeder Road to Janakpur', nameNp: 'जनकपुर जोड्ने सहायक मार्ग', connectsTo: 'Dhalkebar' },
      { nameEn: 'BP Highway Junction', nameNp: 'बीपी राजमार्ग दोबाटो', connectsTo: 'Bardibas' },
      { nameEn: 'Siddhartha Highway Junction', nameNp: 'सिद्धार्थ राजमार्ग दोबाटो', connectsTo: 'Butwal' }
    ],
    tollPoints: [
      {
        id: 'toll_bardibas',
        nameEn: 'Bardibas Toll Gate',
        nameNp: 'बर्दिबास शुल्क केन्द्र',
        locationEn: 'Bardibas, Mahottari',
        locationNp: 'बर्दिबास, महोत्तरी',
        lat: 26.983,
        lng: 85.901,
        ratesNpr: { bike: 20, car: 60, bus: 120, truck: 180 }
      },
      {
        id: 'toll_narayanghat',
        nameEn: 'Gaidakot Toll Plaza',
        nameNp: 'गैँडाकोट टोल प्लाजा',
        locationEn: 'Gaidakot, Nawalpur',
        locationNp: 'गैँडाकोट, नवलपुर',
        lat: 27.701,
        lng: 84.412,
        ratesNpr: { bike: 25, car: 70, bus: 150, truck: 200 }
      }
    ],
    descriptionEn: 'Nepal\'s primary east-west arterial spine connecting Kakadvitta on the eastern border to Gaddachowki on the western Indian border.',
    descriptionNp: 'नेपालको प्रमुख पूर्व-पश्चिम लोकमार्ग जसले पूर्वी सीमा झापा काँकडभिट्टादेखि सुदूरपश्चिम गड्डाचौकीसम्म जोड्छ।'
  },
  {
    id: 'h02',
    code: 'H02',
    nameEn: 'Tribhuvan Highway',
    nameNp: 'त्रिभुवन राजमार्ग',
    startPointEn: 'Kathmandu (Tripureshwor)',
    startPointNp: 'काठमाडौँ (त्रिपुरेश्वर)',
    endPointEn: 'Birgunj (Raxaul Border)',
    endPointNp: 'वीरगञ्ज (रक्सौल सीमा)',
    lengthKm: 189,
    status: 'Open',
    statusNp: 'सञ्चालनमा',
    surfaceType: 'Blacktopped',
    provincesCovered: [3, 2],
    districtsCovered: ['kathmandu', 'makwanpur', 'bara', 'parsa'],
    majorHubs: [
      { nameEn: 'Naubise', nameNp: 'नौबिसे', lat: 27.712, lng: 85.161 },
      { nameEn: 'Daman', nameNp: 'दामन', lat: 27.601, lng: 85.081 },
      { nameEn: 'Hetauda', nameNp: 'हेटौँडा', lat: 27.428, lng: 85.032 },
      { nameEn: 'Pathlaiya', nameNp: 'पथलैया', lat: 27.151, lng: 84.981 },
      { nameEn: 'Birgunj', nameNp: 'वीरगञ्ज', lat: 27.012, lng: 84.881 }
    ],
    localRoadConnections: [
      { nameEn: 'Prithvi Highway Junction', nameNp: 'पृथ्वी राजमार्ग सङ्गम', connectsTo: 'Naubise' },
      { nameEn: 'Kanti Rajmarg Junction', nameNp: 'कान्ति लोकपथ सङ्गम', connectsTo: 'Hetauda' }
    ],
    tollPoints: [
      {
        id: 'toll_hetauda',
        nameEn: 'Churia Tunnel Toll Post',
        nameNp: 'चुरिया टनेल शुल्क केन्द्र',
        locationEn: 'Hetauda Sub-metropolitan',
        locationNp: 'हेटौँडा उपमहानगरपालिका',
        lat: 27.428,
        lng: 85.032,
        ratesNpr: { bike: 20, car: 50, bus: 100, truck: 150 }
      }
    ],
    descriptionEn: 'Nepal\'s oldest highway linking the capital city Kathmandu directly with the southern trade hub of Birgunj.',
    descriptionNp: 'नेपालको सबैभन्दा पुरानो राजमार्ग जसले राजधानी काठमाडौँलाई प्रमुख व्यापारिक नाका वीरगञ्जसँग जोड्छ।'
  },
  {
    id: 'h03',
    code: 'H03',
    nameEn: 'Prithvi Highway',
    nameNp: 'पृथ्वी राजमार्ग',
    startPointEn: 'Naubise (Dhading)',
    startPointNp: 'नौबिसे (धादिङ)',
    endPointEn: 'Pokhara (Kaski)',
    endPointNp: 'पोखरा (कास्की)',
    lengthKm: 174,
    status: 'Widening/Maintenance',
    statusNp: '४-लेन विस्तार कार्य जारी',
    surfaceType: 'Blacktopped',
    provincesCovered: [3, 4],
    districtsCovered: ['dhading', 'chitwan', 'tanahun', 'kaski'],
    majorHubs: [
      { nameEn: 'Galchi', nameNp: 'गल्छी', lat: 27.812, lng: 85.031 },
      { nameEn: 'Gajuri', nameNp: 'गजुरी', lat: 27.801, lng: 84.882 },
      { nameEn: 'Mugling', nameNp: 'मुग्लिन', lat: 27.852, lng: 84.551 },
      { nameEn: 'Dumre', nameNp: 'डुम्रे', lat: 27.942, lng: 84.412 },
      { nameEn: 'Damauli', nameNp: 'दमौली', lat: 27.961, lng: 84.281 },
      { nameEn: 'Pokhara', nameNp: 'पोखरा', lat: 28.209, lng: 83.985 }
    ],
    localRoadConnections: [
      { nameEn: 'Galchi-Trishuli-Rasuwagadhi Road', nameNp: 'गल्छी-त्रिशूली-रसुवागढी सडक', connectsTo: 'Galchi' },
      { nameEn: 'Narayanghat-Mugling Highway', nameNp: 'नारायणगढ-मुग्लिन सडक', connectsTo: 'Mugling' },
      { nameEn: 'Dumre-Besisahar-Chame Road', nameNp: 'डुम्रे-बेसीसहर-चामे सडक', connectsTo: 'Dumre' }
    ],
    tollPoints: [
      {
        id: 'toll_mugling',
        nameEn: 'Mugling Bridge Toll Gate',
        nameNp: 'मुग्लिन पुल शुल्क केन्द्र',
        locationEn: 'Mugling, Chitwan',
        locationNp: 'मुग्लिन, चितवन',
        lat: 27.852,
        lng: 84.551,
        ratesNpr: { bike: 20, car: 60, bus: 120, truck: 180 }
      }
    ],
    descriptionEn: 'Vital highway linking Kathmandu and Narayanghat to Pokhara, currently undergoing major 4-lane Asian Development Bank (ADB) expansion.',
    descriptionNp: 'काठमाडौँ तथा नारायणगढलाई पोखरासँग जोड्ने प्रमुख राजमार्ग, हाल एसियाली विकास बैंक (ADB) को सहयोगमा ४-लेनमा विस्तार भइरहेको छ।'
  },
  {
    id: 'h08',
    code: 'H08',
    nameEn: 'BP Highway (Dhulikhel-Sindhuli-Bardibas)',
    nameNp: 'बीपी राजमार्ग (धुलिखेल-सिन्धुली-बर्दिबास)',
    startPointEn: 'Dhulikhel (Kavre)',
    startPointNp: 'धुलिखेल (काभ्रे)',
    endPointEn: 'Bardibas (Mahottari)',
    endPointNp: 'बर्दिबास (महोत्तरी)',
    lengthKm: 158,
    status: 'Open',
    statusNp: 'सञ्चालनमा (साना सवारी साधन)',
    surfaceType: 'Blacktopped',
    provincesCovered: [3, 2],
    districtsCovered: ['kavrepalanchok', 'sindhuli', 'mahottari'],
    majorHubs: [
      { nameEn: 'Nepalthok', nameNp: 'नेपालथोक', lat: 27.421, lng: 85.801 },
      { nameEn: 'Khurkot', nameNp: 'खुर्कोट', lat: 27.332, lng: 85.912 },
      { nameEn: 'Sindhulimadi', nameNp: 'सिन्धुलीमाढी', lat: 27.261, lng: 85.971 },
      { nameEn: 'Bardibas', nameNp: 'बर्दिबास', lat: 26.983, lng: 85.901 }
    ],
    localRoadConnections: [
      { nameEn: 'Mid-Hill Highway Link at Khurkot', nameNp: 'मध्यपहाडी राजमार्ग जोड्ने विन्दु', connectsTo: 'Khurkot' },
      { nameEn: 'Manthali-Ramechhap Feeder Road', nameNp: 'मन्थली-रामेछाप सहायक सडक', connectsTo: 'Khurkot' }
    ],
    tollPoints: [
      {
        id: 'toll_khurkot',
        nameEn: 'Khurkot Toll Post',
        nameNp: 'खुर्कोट शुल्क केन्द्र',
        locationEn: 'Khurkot, Sindhuli',
        locationNp: 'खुर्कोट, सिन्धुली',
        lat: 27.332,
        lng: 85.912,
        ratesNpr: { bike: 25, car: 80, bus: 150, truck: 220 }
      }
    ],
    descriptionEn: 'Scenic Japanese-built engineering marvel providing the shortest connection between Kathmandu Valley and Eastern Terai.',
    descriptionNp: 'जापानी प्रविधिमा निर्मित आकर्षक नमुना राजमार्ग जसले काठमाडौँ उपत्यका र पूर्वी तराईलाई छोटो दूरीमा जोड्छ।'
  },
  {
    id: 'h15',
    code: 'H15',
    nameEn: 'Pushpalal Mid-Hill Highway (Lokmarg)',
    nameNp: 'पुष्पलाल (मध्यपहाडी) राजमार्ग',
    startPointEn: 'Chiyo Bhanjyang (Panchthar)',
    startPointNp: 'चियोभञ्ज्याङ (पाँचथर)',
    endPointEn: 'Jhulaghat (Baitadi)',
    endPointNp: 'झुलाघाट (बैतडी)',
    lengthKm: 1879,
    status: 'Under Construction',
    statusNp: 'निर्माण तथा कालोपत्रे जारी',
    surfaceType: 'Blacktopped',
    provincesCovered: [1, 3, 4, 5, 6, 7],
    districtsCovered: ['panchthar', 'terhathum', 'dhankuta', 'bhojpur', 'khotang', 'okhaldhunga', 'sindhuli', 'ramechhap', 'kavrepalanchok', 'nuwakot', 'dhading', 'gorkha', 'lamjung', 'kaski', 'parbat', 'baglung', 'eastern_rukum', 'western_rukum', 'jajarkot', 'dailekh', 'achham', 'doti', 'dadeldhura', 'baitadi'],
    majorHubs: [
      { nameEn: 'Phidim', nameNp: 'फिदिम', lat: 27.152, lng: 87.765 },
      { nameEn: 'Diktel', nameNp: 'दिक्तेल', lat: 27.211, lng: 86.793 },
      { nameEn: 'Khurkot', nameNp: 'खुर्कोट', lat: 27.332, lng: 85.912 },
      { nameEn: 'Palungtar', nameNp: 'पालुङटार', lat: 28.051, lng: 84.481 },
      { nameEn: 'Baglung', nameNp: 'बागलुङ', lat: 28.271, lng: 83.601 },
      { nameEn: 'Chaurajahari', nameNp: 'चौरजहारी', lat: 28.651, lng: 82.261 },
      { nameEn: 'Dailekh', nameNp: 'दैलेख', lat: 28.831, lng: 81.712 }
    ],
    localRoadConnections: [
      { nameEn: 'Mechi Highway Link', nameNp: 'मेची राजमार्ग सङ्गम', connectsTo: 'Phidim' },
      { nameEn: 'BP Highway Link', nameNp: 'बीपी राजमार्ग सङ्गम', connectsTo: 'Khurkot' },
      { nameEn: 'Karnali Corridor Link', nameNp: 'कर्णाली कोरिडोर सङ्गम', connectsTo: 'Dailekh' }
    ],
    tollPoints: [],
    descriptionEn: 'National pride mega project spanning 24 hilly districts, designed to promote mountain economy and migration control.',
    descriptionNp: 'नेपालको राष्ट्रिय गौरवको आयोजना जसले २४ पहाडी जिल्लाहरूलाई जोडी मध्यपहाडी क्षेत्रको विकास र बसाइँसराई रोक्न मद्दत पुर्‍याउँछ।'
  },
  {
    id: 'h17',
    code: 'H17',
    nameEn: 'Postal Highway (Hulaki Rajmarg)',
    nameNp: 'हुलाकी राजमार्ग',
    startPointEn: 'Kechana (Jhapa)',
    startPointNp: 'केचना (झापा)',
    endPointEn: 'Dodbhara Chandani (Kanchanpur)',
    endPointNp: 'दोधारा चाँदनी (कञ्चनपुर)',
    lengthKm: 1792,
    status: 'Under Construction',
    statusNp: 'निर्माण तथा स्तरोन्नति भइरहेको',
    surfaceType: 'Blacktopped',
    provincesCovered: [1, 2, 3, 5, 7],
    districtsCovered: ['jhapa', 'morang', 'sunsari', 'saptari', 'siraha', 'dhanusha', 'mahottari', 'sarlahi', 'rautahat', 'bara', 'parsa', 'chitwan', 'nawalpur', 'parasi', 'rupandehi', 'kapilvastu', 'banke', 'bardiya', 'kailali', 'kanchanpur'],
    majorHubs: [
      { nameEn: 'Bhadrapur', nameNp: 'भद्रपुर', lat: 26.545, lng: 88.093 },
      { nameEn: 'Janakpur', nameNp: 'जनकपुर', lat: 26.728, lng: 85.925 },
      { nameEn: 'Jaleshwar', nameNp: 'जलेश्वरी', lat: 26.643, lng: 85.801 },
      { nameEn: 'Gaur', nameNp: 'गौर', lat: 26.762, lng: 85.281 },
      { nameEn: 'Nepalgunj', nameNp: 'नेपालगञ्ज', lat: 28.051, lng: 81.612 },
      { nameEn: 'Gulariya', nameNp: 'गुलेरिया', lat: 28.231, lng: 81.351 }
    ],
    localRoadConnections: [
      { nameEn: 'Feeder Road to Birgunj Customs', nameNp: 'वीरगञ्ज भन्सार सहायक सडक', connectsTo: 'Birgunj' },
      { nameEn: 'Feeder Road to Bhairahawa Airport', nameNp: 'भैरहवा विमानस्थल सहायक सडक', connectsTo: 'Siddharthanagar' }
    ],
    tollPoints: [],
    descriptionEn: 'Historic postal network transforming Terai southern border plain transport and agrarian market access.',
    descriptionNp: 'ऐतिहासिक हुलाकी सडक सञ्जाल जसले तराईका दक्षिण भागका बस्ती र कृषि बजारहरूलाई सिधा सञ्जालमा जोड्छ।'
  },
  {
    id: 'h13',
    code: 'H13',
    nameEn: 'Karnali Highway (Surkhet-Jumla)',
    nameNp: 'कर्णाली राजमार्ग (सुर्खेत-जुम्ला)',
    startPointEn: 'Birendranagar (Surkhet)',
    startPointNp: 'वीरेन्द्रनगर (सुर्खेत)',
    endPointEn: 'Chandannath (Jumla)',
    endPointNp: 'चन्दनाथ (जुम्ला)',
    lengthKm: 232,
    status: 'Single Lane',
    statusNp: 'एक लेन / पहिरोको जोखिम',
    surfaceType: 'Blacktopped',
    provincesCovered: [6],
    districtsCovered: ['surkhet', 'dailekh', 'kalikot', 'jumla'],
    majorHubs: [
      { nameEn: 'Birendranagar', nameNp: 'वीरेन्द्रनगर', lat: 28.601, lng: 81.631 },
      { nameEn: 'Dailekh Mode', nameNp: 'दैलेख मोड', lat: 28.831, lng: 81.712 },
      { nameEn: 'Manma', nameNp: 'मान्म', lat: 29.151, lng: 81.612 },
      { nameEn: 'Jumla Bazaar', nameNp: 'जुम्ला बजार', lat: 29.275, lng: 82.185 }
    ],
    localRoadConnections: [
      { nameEn: 'Karnali Corridor Link at Khulalu', nameNp: 'खुलालु कर्णाली कोरिडोर सङ्गम', connectsTo: 'Manma' },
      { nameEn: 'Gamgadhi-Mugu Road Link', nameNp: 'गमगढी-मुगु सडक सङ्गम', connectsTo: 'Jumla' }
    ],
    tollPoints: [],
    descriptionEn: 'Lifeline highway linking remote high-altitude Karnali region with Surkhet and outer markets.',
    descriptionNp: 'दुर्गम हिमाली कर्णाली क्षेत्रलाई सुर्खेत र बाँकी राष्ट्रिय बजारसँग जोड्ने एक मात्र प्रमुख जिउन्दो राजमार्ग।'
  }
];

export const FUEL_RATES_NPR = {
  petrolPerLiter: 168.00,
  dieselPerLiter: 153.00,
  evKwhCost: 12.00,
  carMileageKmPerLiter: 14,
  bikeMileageKmPerLiter: 38,
  busMileageKmPerLiter: 4.5,
  truckMileageKmPerLiter: 3.5,
  evMileageKmPerKwh: 6.5
};

// Haversine calculation with road curvature factor for Nepal terrain
export function calculateRoadDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistanceKm = R * c;

  // Nepal's mountain and winding road terrain factor (approx 1.35x to 1.55x straight line)
  const terrainFactor = 1.42;
  return Math.round(straightDistanceKm * terrainFactor * 10) / 10;
}

export interface TravelCalculationResult {
  distanceKm: number;
  durationFormattedEn: string;
  durationFormattedNp: string;
  durationMinutes: number;
  fuelLiterNeeded: number;
  fuelCostNpr: number;
  tollCostNpr: number;
  totalEstimatedCostNpr: number;
  roadConditionNoteEn: string;
  roadConditionNoteNp: string;
  recommendedRouteEn: string;
  recommendedRouteNp: string;
  alternativeRoutes: {
    nameEn: string;
    nameNp: string;
    extraKm: number;
    extraMin: number;
    descriptionEn: string;
    descriptionNp: string;
  }[];
}

export function calculateTripMetrics(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  vehicleType: 'car' | 'bike' | 'bus' | 'truck' | 'ev' = 'car'
): TravelCalculationResult {
  const distanceKm = calculateRoadDistanceKm(originLat, originLng, destLat, destLng);

  let speedKmH = 45;
  let fuelConsumptionLiterPer100Km = 7.1; // car
  let fuelPricePerLiter = FUEL_RATES_NPR.petrolPerLiter;

  if (vehicleType === 'bike') {
    speedKmH = 40;
    fuelConsumptionLiterPer100Km = 2.6;
    fuelPricePerLiter = FUEL_RATES_NPR.petrolPerLiter;
  } else if (vehicleType === 'bus') {
    speedKmH = 35;
    fuelConsumptionLiterPer100Km = 22.2;
    fuelPricePerLiter = FUEL_RATES_NPR.dieselPerLiter;
  } else if (vehicleType === 'truck') {
    speedKmH = 30;
    fuelConsumptionLiterPer100Km = 28.5;
    fuelPricePerLiter = FUEL_RATES_NPR.dieselPerLiter;
  } else if (vehicleType === 'ev') {
    speedKmH = 48;
    fuelConsumptionLiterPer100Km = 15.3; // kWh per 100km
    fuelPricePerLiter = FUEL_RATES_NPR.evKwhCost;
  }

  const durationHours = distanceKm / speedKmH;
  const durationMinutes = Math.round(durationHours * 60);

  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;

  const durationFormattedEn = hours > 0 ? `${hours} hr ${mins} min` : `${mins} min`;
  const durationFormattedNp = hours > 0 ? `${hours} घण्टा ${mins} मिनेट` : `${mins} मिनेट`;

  const fuelLiterNeeded = Math.round((distanceKm * (fuelConsumptionLiterPer100Km / 100)) * 10) / 10;
  const fuelCostNpr = Math.round(fuelLiterNeeded * fuelPricePerLiter);

  // Toll calculation based on distance and highway pass-through
  let tollCostNpr = 0;
  if (distanceKm > 40) {
    tollCostNpr = vehicleType === 'bike' ? 25 : vehicleType === 'car' ? 80 : vehicleType === 'bus' ? 150 : 220;
  }
  if (distanceKm > 150) {
    tollCostNpr *= 2;
  }

  const totalEstimatedCostNpr = fuelCostNpr + tollCostNpr;

  // Road condition advice
  let roadConditionNoteEn = 'National Highway section in fair condition. Drive carefully on curves.';
  let roadConditionNoteNp = 'राजमार्ग खण्ड सामान्य अवस्थामा छ। घुम्तीहरूमा सावधानीपूर्वक सवारी चलाउनुहोस्।';

  if (distanceKm > 100) {
    roadConditionNoteEn = 'Active highway widening and periodic maintenance ahead. Expect minor delay near bridges and construction zones.';
    roadConditionNoteNp = 'सडक विस्तार र मर्मत कार्य जारी छ। पुल तथा निर्माणाधीन क्षेत्रमा सामान्य ढिलाइ हुन सक्छ।';
  }

  return {
    distanceKm,
    durationFormattedEn,
    durationFormattedNp,
    durationMinutes,
    fuelLiterNeeded,
    fuelCostNpr,
    tollCostNpr,
    totalEstimatedCostNpr,
    roadConditionNoteEn,
    roadConditionNoteNp,
    recommendedRouteEn: 'Direct Highway Corridor via DoR Main Highway Route',
    recommendedRouteNp: 'सडक विभागको मुख्य राजमार्ग भएर जाने प्रत्यक्ष मार्ग',
    alternativeRoutes: [
      {
        nameEn: 'Alternative Scenic Mid-Hill Highway Bypass',
        nameNp: 'वैकल्पिक मध्यपहाडी राजमार्ग भित्री सडक',
        extraKm: Math.round(distanceKm * 0.18),
        extraMin: Math.round(durationMinutes * 0.25),
        descriptionEn: 'Less traffic, scenic mountain views, recommended during heavy highway congestion.',
        descriptionNp: 'कम सवारी साधन, रमणीय पहाडी दृश्यहरू, मुख्य राजमार्गमा ट्राफिक धेरै हुँदा उपयुक्त।'
      }
    ]
  };
}
