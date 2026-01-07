import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { StudyData, SubjectInfo, STUDY_COLUMNS } from '../types/popane';
import { popaneApi } from '../services/popaneApi';

interface PopaneState {
    selectedStudy: number | null;
    selectedSubjects: number[];
    subjects: SubjectInfo[];
    data: StudyData[];
    loading: boolean;
    subjectsLoading: boolean;
    error: string | null;
}

interface PopaneActions {
    setSelectedStudy: (study: number | null) => void;
    setSelectedSubjects: (subjects: number[]) => void;
    loadData: () => Promise<void>;
    clearError: () => void;
    getCurrentColumns: () => string[];
}

interface PopaneContextType extends PopaneState, PopaneActions {}

const PopaneContext = createContext<PopaneContextType | undefined>(undefined);

interface PopaneProviderProps {
    children: ReactNode;
}

export function PopaneProvider({ children }: PopaneProviderProps): JSX.Element {
    const [selectedStudy, setSelectedStudyState] = useState<number | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
    const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
    const [data, setData] = useState<StudyData[]>([]);
    const [loading, setLoading] = useState(false);
    const [subjectsLoading, setSubjectsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const setSelectedStudy = useCallback(async (study: number | null) => {
        setSelectedStudyState(study);
        setSelectedSubjects([]);
        setData([]);
        setError(null);

        if (study) {
            setSubjectsLoading(true);
            try {
                const loadedSubjects = await popaneApi.getSubjects(study);
                setSubjects(loadedSubjects);
            } catch (err) {
                setError(`Failed to load subjects: ${(err as Error).message}`);
                setSubjects([]);
            } finally {
                setSubjectsLoading(false);
            }
        } else {
            setSubjects([]);
        }
    }, []);

    const loadData = useCallback(async () => {
        if (!selectedStudy || selectedSubjects.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            const limitPerSubject = Math.floor(5000 / selectedSubjects.length);
            const result = await popaneApi.getStudyData({
                studyNumber: selectedStudy,
                subjectIds: selectedSubjects,
                limit: Math.max(limitPerSubject, 500) * selectedSubjects.length
            });
            setData(result);
        } catch (err) {
            setError(`Failed to load data: ${(err as Error).message}`);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [selectedStudy, selectedSubjects]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const getCurrentColumns = useCallback(() => {
        return selectedStudy ? STUDY_COLUMNS[selectedStudy] : [];
    }, [selectedStudy]);

    const value: PopaneContextType = {
        selectedStudy,
        selectedSubjects,
        subjects,
        data,
        loading,
        subjectsLoading,
        error,
        setSelectedStudy,
        setSelectedSubjects,
        loadData,
        clearError,
        getCurrentColumns,
    };

    return (
        <PopaneContext.Provider value={value}>
            {children}
        </PopaneContext.Provider>
    );
}

export function usePopane(): PopaneContextType {
    const context = useContext(PopaneContext);
    if (context === undefined) {
        throw new Error('usePopane must be used within a PopaneProvider');
    }
    return context;
}

export default PopaneContext;
