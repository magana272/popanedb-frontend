export interface StudyData {
    Subject_ID: number;
    timestamp: number;
    time_offset?: number;
    affect?: number;
    ECG: number;
    EDA: number;
    temp?: number;
    respiration?: number;
    SBP?: number;
    DBP?: number;
    CO?: number;
    TPR?: number;
    dzdt?: number;
    dz?: number;
    z0?: number;
    marker: number;
}

export interface StudyMetadata {
    studyNumber: number;
    name: string;
    description: string;
    columns: string[];
    subjectCount: number;
}

export interface SubjectInfo {
    id: number;
    studyNumber: number;
    recordCount: number;
}

export interface QueryParams {
    studyNumber: number;
    subjectId?: number;
    subjectIds?: number[];  // Support multiple subjects
    startTime?: number;
    endTime?: number;
    limit?: number;
    offset?: number;
}

export interface ChartConfig {
    xAxis: string;
    yAxes: string[];
    chartType: 'scatter' | 'line' | 'bar';
}

// Marker (Stimuli ID) to Emotion mapping
export const MARKER_TO_EMOTION: Record<number, string> = {
    [-1]: "Baseline",
    101: "Neutral1",
    102: "Neutral2",
    103: "Neutral3",
    104: "Neutral4",
    105: "Neutral5",
    106: "Neutral6",
    107: "Neutral7",
    108: "Neutral8",
    109: "Neutral9",
    110: "Neutral10",
    201: "Fear1",
    202: "Anger1",
    203: "Anger2",
    204: "Anger3",
    205: "Disgust",
    206: "Sadness1",
    207: "Sadness2",
    208: "Anger4",
    209: "Threat",
    210: "Fear2",
    301: "Amusement1",
    302: "Amusement2",
    303: "Amusement3",
    304: "Amusement4",
    305: "Tenderness1",
    306: "Tenderness2",
    307: "Excitement",
    308: "Positive_Low",
    309: "Positive_High",
};

// Emotion colors for consistency across all components
export const EMOTION_COLORS: Record<string, string> = {
    // Base emotions
    "Baseline": "#808080",
    "Amusement": "#00bbff",
    "Anger": "#800080",
    "Disgust": "#FF0000",
    "Excitement": "#0000FF",
    "Fear": "#008000",
    "Gratitude": "#FFA500",
    "Neutral": "#85a576",
    "Positive_Emotion_High_Approach": "#FFFF00",
    "Positive_Emotion_Low_Approach": "#90EE90",
    "Sadness": "#8B0000",
    "Tenderness": "#DC143C",
    "Threat": "#ff0095",
    // Numbered variants (legacy)
    "Neutral1": "#85a576", "Neutral2": "#85a576", "Neutral3": "#85a576",
    "Neutral4": "#85a576", "Neutral5": "#85a576", "Neutral6": "#85a576",
    "Neutral7": "#85a576", "Neutral8": "#85a576", "Neutral9": "#85a576", "Neutral10": "#85a576",
    "Fear1": "#008000", "Fear2": "#008000",
    "Anger1": "#800080", "Anger2": "#800080", "Anger3": "#800080", "Anger4": "#800080",
    "Sadness1": "#8B0000", "Sadness2": "#8B0000",
    "Amusement1": "#00bbff", "Amusement2": "#00bbff", "Amusement3": "#00bbff", "Amusement4": "#00bbff",
    "Tenderness1": "#DC143C", "Tenderness2": "#DC143C",
    "Positive_Low": "#90EE90",
    "Positive_High": "#FFFF00",
};

// Study column definitions matching the backend database schema
export const STUDY_COLUMNS: Record<number, string[]> = {
    1: ['Subject_ID', 'timestamp', 'affect', 'ECG', 'EDA', 'temp', 'respiration', 'SBP', 'DBP', 'marker'],
    2: ['Subject_ID', 'timestamp', 'affect', 'ECG', 'EDA', 'SBP', 'DBP', 'CO', 'TPR', 'marker'],
    3: ['Subject_ID', 'timestamp', 'affect', 'ECG', 'EDA', 'dzdt', 'dz', 'z0', 'SBP', 'DBP', 'CO', 'TPR', 'marker'],
    4: ['Subject_ID', 'timestamp', 'ECG', 'EDA', 'SBP', 'DBP', 'CO', 'TPR', 'marker'],
    5: ['Subject_ID', 'timestamp', 'affect', 'ECG', 'EDA', 'SBP', 'DBP', 'CO', 'TPR', 'marker'],
    6: ['Subject_ID', 'timestamp', 'affect', 'ECG', 'dzdt', 'dz', 'z0', 'EDA', 'SBP', 'DBP', 'CO', 'TPR', 'marker'],
    7: ['Subject_ID', 'timestamp', 'affect', 'ECG', 'dzdt', 'dz', 'z0', 'marker'],
};

export const STUDY_INFO: StudyMetadata[] = [
    {
        studyNumber: 1,
        name: 'Study 1',
        description: 'Baseline physiological measurements with temperature and respiration',
        columns: STUDY_COLUMNS[1],
        subjectCount: 0
    },
    {
        studyNumber: 2,
        name: 'Study 2',
        description: 'Cardiovascular measurements with cardiac output and TPR',
        columns: STUDY_COLUMNS[2],
        subjectCount: 0
    },
    {
        studyNumber: 3,
        name: 'Study 3',
        description: 'Extended cardiovascular with impedance cardiography',
        columns: STUDY_COLUMNS[3],
        subjectCount: 0
    },
    {
        studyNumber: 4,
        name: 'Study 4',
        description: 'Cardiovascular study without affect measurements',
        columns: STUDY_COLUMNS[4],
        subjectCount: 0
    },
    {
        studyNumber: 5,
        name: 'Study 5',
        description: 'Standard cardiovascular and electrodermal activity',
        columns: STUDY_COLUMNS[5],
        subjectCount: 0
    },
    {
        studyNumber: 6,
        name: 'Study 6',
        description: 'Comprehensive physiological with impedance measurements',
        columns: STUDY_COLUMNS[6],
        subjectCount: 0
    },
    {
        studyNumber: 7,
        name: 'Study 7',
        description: 'ECG with impedance cardiography measurements',
        columns: STUDY_COLUMNS[7],
        subjectCount: 0
    },
];

// Column descriptions for tooltips
export const COLUMN_DESCRIPTIONS: Record<string, string> = {
    Subject_ID: 'Unique identifier for the study participant',
    timestamp: 'Time point of the measurement',
    affect: 'Emotional affect/valence measurement',
    ECG: 'Electrocardiogram - heart electrical activity',
    EDA: 'Electrodermal Activity - skin conductance',
    temp: 'Body temperature',
    respiration: 'Breathing rate/pattern',
    SBP: 'Systolic Blood Pressure',
    DBP: 'Diastolic Blood Pressure',
    CO: 'Cardiac Output - blood volume pumped per minute',
    TPR: 'Total Peripheral Resistance',
    dzdt: 'First derivative of thoracic impedance',
    dz: 'Change in thoracic impedance',
    z0: 'Baseline thoracic impedance',
    marker: 'Event marker indicator',
};

export interface EmotionColorMap {
    emotion: string;
    color: string;
    recording_id?: string;
}

export interface SignalDataPoint {
    time_offset: number;
    value: number | null;
    emotion: string;
    color: string;
}

export interface SignalSeries {
    feature: string;
    unit: string;
    title: string;
    data_points: SignalDataPoint[];
}

export interface EmotionColoredSignalsResponse {
    study_number: number;
    subject_id: number;
    study_name: string;
    emotions: EmotionColorMap[];
    signals: SignalSeries[];
    available_features: string[];
    time_range: {
        min: number;
        max: number;
    };
}

export interface PCADataPoint {
    pc1: number;
    pc2: number;
    emotion: string;
    color: string;
    subject_id: number;
}

export interface PCAResponse {
    study_number: number;
    data_points: PCADataPoint[];
    explained_variance: number[];
    features_used: string[];
    emotions: EmotionColorMap[];
}

export interface FeatureInfo {
    name: string;
    unit: string;
    title: string;
    default_color: string;
}

export interface EmotionSummaryResponse {
    emotionCounts: Record<string, number>;
    subjectsPerEmotion: Record<string, number[]>;
    totalSubjects: number;
    studyNumber: number;
}
