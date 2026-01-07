import { useState, useEffect, useCallback, useMemo } from 'react';
import { StudyData, SubjectInfo } from '../types/popane';
import { popaneApi } from '../services/popaneApi';

export function useStudyData(studyNumber: number | null, subjectIds: number[]) {
    const [data, setData] = useState<StudyData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!studyNumber || subjectIds.length === 0) {
            setData([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const limitPerSubject = Math.floor(5000 / subjectIds.length);
            const result = await popaneApi.getStudyData({
                studyNumber,
                subjectIds,
                limit: Math.max(limitPerSubject, 500) * subjectIds.length
            });
            setData(result);
        } catch (err) {
            setError(`Failed to load data: ${(err as Error).message}`);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [studyNumber, subjectIds]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}

export function useSubjects(studyNumber: number | null) {
    const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!studyNumber) {
            setSubjects([]);
            return;
        }

        const fetchSubjects = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await popaneApi.getSubjects(studyNumber);
                setSubjects(result);
            } catch (err) {
                setError(`Failed to load subjects: ${(err as Error).message}`);
                setSubjects([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, [studyNumber]);

    return { subjects, loading, error };
}

export function usePagination<T>(items: T[], itemsPerPage: number = 25) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = useMemo(() =>
        Math.ceil(items.length / itemsPerPage),
        [items.length, itemsPerPage]
    );

    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return items.slice(start, start + itemsPerPage);
    }, [items, currentPage, itemsPerPage]);

    const goToPage = useCallback((page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    }, [totalPages]);

    const goToFirst = useCallback(() => setCurrentPage(1), []);
    const goToLast = useCallback(() => setCurrentPage(totalPages), [totalPages]);
    const goToNext = useCallback(() => setCurrentPage(p => Math.min(p + 1, totalPages)), [totalPages]);
    const goToPrev = useCallback(() => setCurrentPage(p => Math.max(p - 1, 1)), []);

    useEffect(() => {
        setCurrentPage(1);
    }, [items.length]);

    return {
        currentPage,
        totalPages,
        paginatedItems,
        goToPage,
        goToFirst,
        goToLast,
        goToNext,
        goToPrev,
        isFirstPage: currentPage === 1,
        isLastPage: currentPage === totalPages,
    };
}

export function useSorting<T>(items: T[], defaultColumn: string = 'timestamp') {
    const [sortColumn, setSortColumn] = useState(defaultColumn);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => {
            const aVal = (a as Record<string, unknown>)[sortColumn];
            const bVal = (b as Record<string, unknown>)[sortColumn];

            if (aVal === undefined || aVal === null) return 1;
            if (bVal === undefined || bVal === null) return -1;

            const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [items, sortColumn, sortDirection]);

    const toggleSort = useCallback((column: string) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    }, [sortColumn]);

    return {
        sortedItems,
        sortColumn,
        sortDirection,
        toggleSort,
    };
}

export function useSearch<T>(items: T[], searchFields?: (keyof T)[]) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;

        return items.filter((item) => {
            const fieldsToSearch = searchFields || Object.keys(item as object) as (keyof T)[];
            return fieldsToSearch.some((field) => {
                const value = item[field];
                return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            });
        });
    }, [items, searchTerm, searchFields]);

    const clearSearch = useCallback(() => setSearchTerm(''), []);

    return {
        searchTerm,
        setSearchTerm,
        filteredItems,
        clearSearch,
        hasResults: filteredItems.length > 0,
    };
}
