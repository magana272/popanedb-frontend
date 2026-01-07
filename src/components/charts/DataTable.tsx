import React, { useCallback, memo } from 'react';
import { StudyData, COLUMN_DESCRIPTIONS } from '../../types/popane';
import { usePagination, useSorting, useSearch } from '../../hooks/useDataFetching';
import { LoadingSpinner, Button } from '../ui';
import './DataTable.css';

interface DataTableProps {
    data: StudyData[];
    columns: string[];
    loading?: boolean;
}

const TableHeader = memo(function TableHeader({
    column,
    sortColumn,
    sortDirection,
    onSort,
}: {
    column: string;
    sortColumn: string;
    sortDirection: 'asc' | 'desc';
    onSort: (column: string) => void;
}) {
    const handleClick = useCallback(() => {
        onSort(column);
    }, [column, onSort]);

    return (
        <th
            onClick={handleClick}
            title={COLUMN_DESCRIPTIONS[column] || column}
            className={sortColumn === column ? `sorted ${sortDirection}` : ''}
        >
            {column}
            {sortColumn === column && (
                <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                </span>
            )}
        </th>
    );
});

const TableRow = memo(function TableRow({
    row,
    columns,
}: {
    row: StudyData;
    columns: string[];
}) {
    const formatValue = (value: unknown): string => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'number') {
            return Number.isInteger(value) ? value.toString() : value.toFixed(4);
        }
        return String(value);
    };

    return (
        <tr>
            {columns.map((col) => (
                <td key={col}>
                    {formatValue((row as unknown as Record<string, unknown>)[col])}
                </td>
            ))}
        </tr>
    );
});

const DataTable = memo(function DataTable({
    data,
    columns,
    loading = false
}: DataTableProps): JSX.Element {
    const ROWS_PER_PAGE = 25;

    const { searchTerm, setSearchTerm, filteredItems: filteredData } = useSearch(data);
    const { sortColumn, sortDirection, sortedItems: sortedData, toggleSort } = useSorting(
        filteredData,
        'timestamp'
    );
    const {
        currentPage,
        paginatedItems: paginatedData,
        totalPages,
        goToFirst,
        goToLast,
        goToNext,
        goToPrev,
        isFirstPage,
        isLastPage,
        goToPage
    } = usePagination(sortedData, ROWS_PER_PAGE);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        goToPage(1);
    }, [setSearchTerm, goToPage]);

    if (loading) {
        return (
            <div className="data-table-container loading">
                <LoadingSpinner size="large" message="Loading data..." />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="data-table-container empty">
                <p>No data to display. Select a study and subject to view data.</p>
            </div>
        );
    }

    return (
        <div className="data-table-container">
            <div className="table-controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search data..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="data-info">
                    Showing {paginatedData.length} of {sortedData.length} rows
                </div>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <TableHeader
                                    key={col}
                                    column={col}
                                    sortColumn={sortColumn}
                                    sortDirection={sortDirection}
                                    onSort={toggleSort}
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row, idx) => (
                            <TableRow
                                key={idx}
                                row={row}
                                columns={columns}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <Button
                        variant="ghost"
                        size="small"
                        onClick={goToFirst}
                        disabled={isFirstPage}
                    >
                        ««
                    </Button>
                    <Button
                        variant="ghost"
                        size="small"
                        onClick={goToPrev}
                        disabled={isFirstPage}
                    >
                        «
                    </Button>
                    <span className="page-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="ghost"
                        size="small"
                        onClick={goToNext}
                        disabled={isLastPage}
                    >
                        »
                    </Button>
                    <Button
                        variant="ghost"
                        size="small"
                        onClick={goToLast}
                        disabled={isLastPage}
                    >
                        »»
                    </Button>
                </div>
            )}
        </div>
    );
});

export default DataTable;
