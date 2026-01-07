import {
    StudyData,
    QueryParams,
    SubjectInfo,
    STUDY_COLUMNS,
    EmotionColoredSignalsResponse,
    PCAResponse,
    FeatureInfo,
    EmotionSummaryResponse,
} from '../types/popane';

// Base URL for the API - update this when you have a real backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const VIZ_BASE_URL = process.env.REACT_APP_VIZ_URL || 'http://localhost:8000/viz';

// Generate mock data for development/demo purposes
function generateMockData(studyNumber: number, subjectId: number, count: number = 100): StudyData[] {
    const columns = STUDY_COLUMNS[studyNumber];
    const data: StudyData[] = [];

    for (let i = 0; i < count; i++) {
        const baseRecord: StudyData = {
            Subject_ID: subjectId,
            timestamp: i * 0.001, // milliseconds
            ECG: Math.sin(i * 0.1) * 0.5 + Math.random() * 0.1,
            EDA: 2 + Math.random() * 3 + Math.sin(i * 0.01) * 0.5,
            marker: i % 50 === 0 ? 1 : 0,
        };

        // Add study-specific columns
        if (columns.includes('affect')) {
            baseRecord.affect = 0.5 + Math.random() * 0.5;
        }
        if (columns.includes('temp')) {
            baseRecord.temp = 36.5 + Math.random() * 1;
        }
        if (columns.includes('respiration')) {
            baseRecord.respiration = 15 + Math.sin(i * 0.05) * 5;
        }
        if (columns.includes('SBP')) {
            baseRecord.SBP = 120 + Math.random() * 20;
        }
        if (columns.includes('DBP')) {
            baseRecord.DBP = 80 + Math.random() * 10;
        }
        if (columns.includes('CO')) {
            baseRecord.CO = 5 + Math.random() * 2;
        }
        if (columns.includes('TPR')) {
            baseRecord.TPR = 1000 + Math.random() * 500;
        }
        if (columns.includes('dzdt')) {
            baseRecord.dzdt = -2 + Math.random() * 1;
        }
        if (columns.includes('dz')) {
            baseRecord.dz = 0.5 + Math.random() * 0.3;
        }
        if (columns.includes('z0')) {
            baseRecord.z0 = 25 + Math.random() * 5;
        }

        data.push(baseRecord);
    }

    return data;
}

// Mock subjects for each study
function getMockSubjects(studyNumber: number): SubjectInfo[] {
    const subjectCounts: Record<number, number> = {
        1: 40, 2: 35, 3: 45, 4: 30, 5: 38, 6: 42, 7: 25
    };

    const count = subjectCounts[studyNumber] || 30;
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        studyNumber,
        recordCount: 1000 + Math.floor(Math.random() * 5000)
    }));
}

class PopaneApiService {
    private useMockData: boolean;

    constructor() {
        // Connect to real backend - set to false to use actual database
        this.useMockData = false;
    }

    // Fetch study data
    async getStudyData(params: QueryParams): Promise<StudyData[]> {
        if (this.useMockData) {
            const subjectId = params.subjectId || 1;
            const limit = params.limit || 1000;
            return generateMockData(params.studyNumber, subjectId, limit);
        }

        const searchParams = new URLSearchParams({
            study: params.studyNumber.toString(),
            ...(params.subjectId && { subject_id: params.subjectId.toString() }),
            ...(params.startTime && { start_time: params.startTime.toString() }),
            ...(params.endTime && { end_time: params.endTime.toString() }),
            ...(params.limit && { limit: params.limit.toString() }),
            ...(params.offset && { offset: params.offset.toString() }),
        });

        // Add multiple subject IDs if provided
        if (params.subjectIds && params.subjectIds.length > 0) {
            params.subjectIds.forEach(id => searchParams.append('subject_ids', id.toString()));
        }

        const queryString = searchParams.toString();

        const response = await fetch(`${API_BASE_URL}/study/${params.studyNumber}/data?${queryString}`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    }

    // Get list of subjects for a study
    async getSubjects(studyNumber: number): Promise<SubjectInfo[]> {
        if (this.useMockData) {
            return getMockSubjects(studyNumber);
        }

        const response = await fetch(`${API_BASE_URL}/study/${studyNumber}/subjects`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    }

    // Get study statistics
    async getStudyStats(studyNumber: number): Promise<{ totalRecords: number; subjects: number }> {
        if (this.useMockData) {
            return {
                totalRecords: 50000 + Math.floor(Math.random() * 100000),
                subjects: getMockSubjects(studyNumber).length
            };
        }

        const response = await fetch(`${API_BASE_URL}/study/${studyNumber}/stats`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    }

    // Search across studies
    async search(query: string): Promise<{ studyNumber: number; subjectId: number; matches: number }[]> {
        if (this.useMockData) {
            // Mock search results
            return [
                { studyNumber: 1, subjectId: 5, matches: 12 },
                { studyNumber: 2, subjectId: 3, matches: 8 },
            ];
        }

        const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    }

    // Enable/disable mock data mode
    setMockMode(useMock: boolean) {
        this.useMockData = useMock;
    }

    async getFeatures(studyNumber: number): Promise<FeatureInfo[]> {
        const response = await fetch(`${VIZ_BASE_URL}/features/${studyNumber}`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    }

    async getEmotionColoredSignals(
        studyNumber: number,
        subjectId: number,
        features?: string[],
        startTime: number = 0,
        endTime: number = 10,
        secondsPerEmotion?: number
    ): Promise<EmotionColoredSignalsResponse> {
        const params = new URLSearchParams();

        if (secondsPerEmotion !== undefined) {
            params.set('seconds_per_emotion', secondsPerEmotion.toString());
        } else {
            params.set('start_time', startTime.toString());
            params.set('end_time', endTime.toString());
        }

        if (features && features.length > 0) {
            params.set('features', features.join(','));
        }

        const response = await fetch(
            `${VIZ_BASE_URL}/signals/${studyNumber}/${subjectId}?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    }

    async getPCAAnalysis(
        studyNumber: number,
        subjectIds?: number[],
        features?: string[],
        sampleSize: number = 1000
    ): Promise<PCAResponse> {
        const params = new URLSearchParams({
            sample_size: sampleSize.toString(),
        });

        if (subjectIds && subjectIds.length > 0) {
            params.set('subject_ids', subjectIds.join(','));
        }

        if (features && features.length > 0) {
            params.set('features', features.join(','));
        }

        const response = await fetch(
            `${VIZ_BASE_URL}/pca/${studyNumber}?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    }

    async getEmotionSummary(
        studyNumber: number,
        subjectIds: number[]
    ): Promise<EmotionSummaryResponse> {
        const params = new URLSearchParams({
            subjects: subjectIds.join(',')
        });

        const response = await fetch(
            `${API_BASE_URL}/study/${studyNumber}/emotions/summary?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    }
}

// Export singleton instance
export const popaneApi = new PopaneApiService();
export default popaneApi;
