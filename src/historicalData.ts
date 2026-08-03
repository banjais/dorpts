export const HISTORICAL_DATA: { 
  id: string; 
  lastUpdateDate: string; 
  createdAt: string; 
  indicators: { id: string; name: string; annualProgress: number; annualTarget: number }[]; 
  metadata: { lastUpdateDate: string; nextUpdateDate: string; totalWeight: number; totalWeightProgress: number } 
}[] = [
  {
    id: '2082-11-26',
    lastUpdateDate: '2082/11/26',
    createdAt: '2025-11-26T00:00:00Z',
    indicators: [
      { id: 'ind_1', name: 'कालोपत्रे सडक (दुई लेन)-NH&Other Road', annualProgress: 0.0, annualTarget: 800 },
      { id: 'ind_2', name: 'कालोपत्रे सडक (चार लेन वा चार लेन भन्दा बढी)', annualProgress: 0.0, annualTarget: 108.5 },
      { id: 'ind_6', name: 'पुल निर्माण', annualProgress: 3537.0, annualTarget: 162 },
      { id: 'ind_8', name: 'सुरूङ निर्माण (मेन टनेल र ईभ्याकुएसन टनेल)', annualProgress: 0.0, annualTarget: 1 },
      { id: 'ind_13', name: 'रोजगारी सिर्जना', annualProgress: 3792, annualTarget: 10923 },
      { id: 'ind_14', name: 'कुल बजेट, अर्ब', annualProgress: 43.1, annualTarget: 124 },
      { id: 'ind_15', name: 'पुँजीगत खर्च', annualProgress: 40.7, annualTarget: 95 },
    ],
    metadata: {
      lastUpdateDate: '2082/11/26',
      nextUpdateDate: '',
      totalWeight: 75,
      totalWeightProgress: 15
    }
  },
  {
    id: '2082-12-30',
    lastUpdateDate: '2082/12/30',
    createdAt: '2025-12-30T00:00:00Z',
    indicators: [
      { id: 'ind_1', name: 'कालोपत्रे सडक (दुई लेन)-NH&Other Road', annualProgress: 364, annualTarget: 800 },
      { id: 'ind_2', name: 'कालोपत्रे सडक (चार लेन वा चार लेन भन्दा बढी)', annualProgress: 74, annualTarget: 109 },
      { id: 'ind_6', name: 'पुल निर्माण', annualProgress: 3537, annualTarget: 162 },
      { id: 'ind_8', name: 'सुरूङ निर्माण (मेन टनेल र ईभ्याकुएसन टनेल)', annualProgress: 0, annualTarget: 1 },
      { id: 'ind_13', name: 'रोजगारी सिर्जना', annualProgress: 3871, annualTarget: 10923 },
      { id: 'ind_14', name: 'कुल बजेट, अर्ब', annualProgress: 44, annualTarget: 124 },
      { id: 'ind_15', name: 'पुँजीगत खर्च', annualProgress: 41, annualTarget: 95 },
    ],
    metadata: {
      lastUpdateDate: '2082/12/30',
      nextUpdateDate: '2083/01/07',
      totalWeight: 75,
      totalWeightProgress: 51
    }
  }
];
