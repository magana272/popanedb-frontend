import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { StudyData, COLUMN_DESCRIPTIONS, MARKER_TO_EMOTION } from '../../types/popane';
import { Button, LoadingSpinner } from '../ui';
import { useTheme } from '../../context/ThemeContext';
import './PhysiologyChart.css';

interface PhysiologyChartProps {
    data: StudyData[];
    columns: string[];
    title?: string;
    loading?: boolean;
}

type ChartType = 'line' | 'scatter' | 'bar';

const SUBJECT_COLORS = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

const ChartTypeButton = memo(function ChartTypeButton({
    type,
    isActive,
    onClick,
}: {
    type: ChartType;
    isActive: boolean;
    onClick: (type: ChartType) => void;
}) {
    const handleClick = useCallback(() => {
        onClick(type);
    }, [type, onClick]);

    return (
        <Button
            variant={isActive ? 'primary' : 'ghost'}
            size="small"
            onClick={handleClick}
        >
            {type.charAt(0).toUpperCase() + type.slice(1)}
        </Button>
    );
});

const ColumnCheckbox = memo(function ColumnCheckbox({
    column,
    isSelected,
    onToggle,
}: {
    column: string;
    isSelected: boolean;
    onToggle: (column: string) => void;
}) {
    const handleChange = useCallback(() => {
        onToggle(column);
    }, [column, onToggle]);

    return (
        <label
            className={`checkbox-label ${isSelected ? 'checked' : ''}`}
            title={COLUMN_DESCRIPTIONS[column] || column}
        >
            <input
                type="checkbox"
                checked={isSelected}
                onChange={handleChange}
            />
            {column}
        </label>
    );
});

const EmotionPanel = memo(function EmotionPanel({
    emotion,
    emotionData,
    selectedColumns,
    chartType,
    xAxis,
    subjects,
    showXAxis,
    panelIndex,
    isDark,
}: {
    emotion: string;
    emotionData: StudyData[];
    selectedColumns: string[];
    chartType: ChartType;
    xAxis: string;
    subjects: number[];
    showXAxis: boolean;
    panelIndex: number;
    isDark: boolean;
}) {
    const traces = useMemo(() => {
        const result: Partial<Plotly.PlotData>[] = [];

        subjects.forEach((subjectId, subjectIdx) => {
            const subjectData = emotionData.filter(row => row.Subject_ID === subjectId);
            if (subjectData.length === 0) return;

            const subjectColor = SUBJECT_COLORS[subjectIdx % SUBJECT_COLORS.length];

            const subjectXValues = subjectData.map(row => (row as unknown as Record<string, unknown>)[xAxis] as number).filter(v => v != null);
            const minX = subjectXValues.length > 0 ? Math.min(...subjectXValues) : 0;

            selectedColumns.forEach((col, colIdx) => {
                const xData = subjectData.map(row => {
                    const rawX = (row as unknown as Record<string, unknown>)[xAxis] as number;
                    return rawX - minX;
                });

                const rawYData = subjectData.map(row => (row as unknown as Record<string, unknown>)[col] as number);
                const firstY = rawYData.length > 0 ? rawYData[0] : 0;
                const yData = rawYData.map(y => y - firstY);

                result.push({
                    x: xData,
                    y: yData,
                    name: subjects.length > 1 ? `Subject ${subjectId} - ${col}` : col,
                    legendgroup: `subject-${subjectId}`,
                    showlegend: panelIndex === 0,
                    type: chartType === 'bar' ? 'bar' : 'scatter',
                    mode: chartType === 'line' ? 'lines' : chartType === 'scatter' ? 'markers' : undefined,
                    marker: { color: subjectColor },
                    line: {
                        width: 1.5,
                        dash: colIdx === 0 ? 'solid' : colIdx === 1 ? 'dash' : 'dot'
                    },
                    hovertemplate: `Subject ${subjectId}<br>${col} (offset): %{y:.4f}<br>Time: %{x:.4f}s<extra></extra>`
                });
            });
        });

        return result;
    }, [emotionData, selectedColumns, chartType, xAxis, subjects, panelIndex]);

    const textColor = isDark ? '#a0aec0' : '#374151';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const paperBg = isDark ? '#1e1e1e' : '#ffffff';
    const plotBg = isDark ? '#2a2a2a' : '#f9fafb';

    const layout = useMemo((): Partial<Plotly.Layout> => ({
        height: 400,
        margin: { l: 70, r: 30, t: 45, b: showXAxis ? 55 : 25 },
        showlegend: panelIndex === 0,
        legend: panelIndex === 0 ? {
            orientation: 'h',
            yanchor: 'bottom',
            y: 1.15,
            xanchor: 'right',
            x: 1,
            font: { size: 10, color: textColor }
        } : undefined,
        title: {
            text: emotion,
            font: { size: 13, color: '#60a5fa' },
            x: 0.01,
            xanchor: 'left',
            y: 0.97,
        },
        xaxis: {
            showticklabels: showXAxis,
            title: showXAxis ? { text: xAxis, font: { size: 10, color: textColor } } : undefined,
            gridcolor: gridColor,
            zeroline: false,
            tickfont: { color: textColor },
        },
        yaxis: {
            title: {
                text: selectedColumns.length === 1 ? selectedColumns[0] : 'Value',
                font: { size: 9, color: textColor },
            },
            gridcolor: gridColor,
            zeroline: false,
            tickfont: { color: textColor },
        },
        paper_bgcolor: paperBg,
        plot_bgcolor: plotBg,
        hovermode: 'closest',
        font: { color: textColor },
    }), [emotion, showXAxis, xAxis, selectedColumns, panelIndex, textColor, gridColor, paperBg, plotBg]);

    const config = useMemo(() => ({
        responsive: true,
        displayModeBar: false,
        staticPlot: false,
    }), []);

    return (
        <div className="emotion-panel">
            <Plot
                data={traces as Plotly.Data[]}
                layout={layout}
                config={config}
                style={{ width: '100%' }}
            />
        </div>
    );
});

const PhysiologyChart = memo(function PhysiologyChart({
    data,
    columns,
    title,
    loading = false
}: PhysiologyChartProps): React.JSX.Element {
    const { isDark } = useTheme();
    const [selectedColumns, setSelectedColumns] = useState<string[]>(['ECG']);
    const [chartType, setChartType] = useState<ChartType>('line');
    const [xAxis, setXAxis] = useState<string>('time_offset');
    const [selectedEmotions, setSelectedEmotions] = useState<Set<number>>(new Set());

    const numericColumns = useMemo(() => {
        return columns.filter(col =>
            col !== 'Subject_ID' &&
            col !== 'marker' &&
            data.length > 0 &&
            typeof (data[0] as unknown as Record<string, unknown>)[col] === 'number'
        );
    }, [columns, data]);

    const xAxisColumns = useMemo(() => {
        const baseCols = [...columns];
        if (data.length > 0 && 'time_offset' in data[0] && !baseCols.includes('time_offset')) {
            baseCols.unshift('time_offset');
        }
        return baseCols;
    }, [columns, data]);

    useEffect(() => {
        if (data.length > 0 && 'time_offset' in data[0]) {
            setXAxis('time_offset');
        }
    }, [data]);

    const subjects = useMemo(() => {
        return Array.from(new Set(data.map(row => row.Subject_ID))).sort((a, b) => a - b);
    }, [data]);

    const emotionGroups = useMemo(() => {
        const groups: { emotion: string; marker: number; data: StudyData[] }[] = [];
        const markerMap = new Map<number, StudyData[]>();

        data.forEach(row => {
            const marker = row.marker;
            if (!markerMap.has(marker)) {
                markerMap.set(marker, []);
            }
            markerMap.get(marker)!.push(row);
        });

        // Sort by marker and create groups with emotion names
        const sortedMarkers = Array.from(markerMap.keys()).sort((a, b) => a - b);
        sortedMarkers.forEach(marker => {
            const emotionName = MARKER_TO_EMOTION[marker] || `Marker ${marker}`;
            groups.push({
                emotion: emotionName,
                marker,
                data: markerMap.get(marker)!
            });
        });

        return groups;
    }, [data]);

    const availableEmotions = useMemo(() => {
        return emotionGroups.map(g => ({ marker: g.marker, emotion: g.emotion }));
    }, [emotionGroups]);

    useEffect(() => {
        if (availableEmotions.length > 0 && selectedEmotions.size === 0) {
            const initial = new Set(availableEmotions.slice(0, 2).map(e => e.marker));
            setSelectedEmotions(initial);
        }
    }, [availableEmotions, selectedEmotions.size]);

    const filteredEmotionGroups = useMemo(() => {
        if (selectedEmotions.size === 0) return emotionGroups;
        return emotionGroups.filter(g => selectedEmotions.has(g.marker));
    }, [emotionGroups, selectedEmotions]);

    const handleColumnToggle = useCallback((column: string) => {
        setSelectedColumns(prev => {
            if (prev.includes(column)) {
                return prev.filter(c => c !== column);
            }
            return [...prev, column];
        });
    }, []);

    const handleChartTypeChange = useCallback((type: ChartType) => {
        setChartType(type);
    }, []);

    const handleXAxisChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setXAxis(e.target.value);
    }, []);

    const handleEmotionToggle = useCallback((marker: number) => {
        setSelectedEmotions(prev => {
            const next = new Set(prev);
            if (next.has(marker)) {
                next.delete(marker);
            } else {
                next.add(marker);
            }
            return next;
        });
    }, []);

    const handleSelectAllEmotions = useCallback(() => {
        setSelectedEmotions(new Set(availableEmotions.map(e => e.marker)));
    }, [availableEmotions]);

    const handleClearEmotions = useCallback(() => {
        setSelectedEmotions(new Set());
    }, []);

    if (loading) {
        return (
            <div className="physiology-chart loading">
                <LoadingSpinner size="large" message="Loading chart data..." />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="physiology-chart empty">
                <p>Load data to visualize physiological measurements</p>
            </div>
        );
    }

    return (
        <div className="physiology-chart">
            <div className="chart-controls">
                <div className="control-group">
                    <label>Chart Type:</label>
                    <div className="button-group">
                        {(['line', 'scatter', 'bar'] as ChartType[]).map(type => (
                            <ChartTypeButton
                                key={type}
                                type={type}
                                isActive={chartType === type}
                                onClick={handleChartTypeChange}
                            />
                        ))}
                    </div>
                </div>

                <div className="control-group">
                    <label>X-Axis:</label>
                    <select value={xAxis} onChange={handleXAxisChange}>
                        {xAxisColumns.map(col => (
                            <option key={col} value={col}>{col}</option>
                        ))}
                    </select>
                </div>

                <div className="control-group column-selector">
                    <label>Y-Axis Variables:</label>
                    <div className="column-checkboxes">
                        {numericColumns.map(col => (
                            <ColumnCheckbox
                                key={col}
                                column={col}
                                isSelected={selectedColumns.includes(col)}
                                onToggle={handleColumnToggle}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Emotion selector */}
            <div className="emotion-selector">
                <div className="emotion-selector-header">
                    <label>Select Emotions to Display:</label>
                    <div className="emotion-actions">
                        <Button variant="ghost" size="small" onClick={handleSelectAllEmotions}>All</Button>
                        <Button variant="ghost" size="small" onClick={handleClearEmotions}>Clear</Button>
                    </div>
                </div>
                <div className="emotion-checkboxes">
                    {availableEmotions.map(({ marker, emotion }) => (
                        <label
                            key={marker}
                            className={`checkbox-label ${selectedEmotions.has(marker) ? 'checked' : ''}`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedEmotions.has(marker)}
                                onChange={() => handleEmotionToggle(marker)}
                            />
                            {emotion}
                        </label>
                    ))}
                </div>
            </div>

            {/* Title and subject legend */}
            <div className="chart-header">
                <h3>{title || 'Physiological Data by Emotion'}</h3>
                <div className="subject-legend">
                    {subjects.map((subjectId, idx) => (
                        <span key={subjectId} className="subject-legend-item">
                            <span
                                className="subject-color"
                                style={{ backgroundColor: SUBJECT_COLORS[idx % SUBJECT_COLORS.length] }}
                            />
                            Subject {subjectId}
                        </span>
                    ))}
                </div>
            </div>

            {/* Multi-panel emotion charts */}
            <div className="emotion-panels">
                {filteredEmotionGroups.map((group, idx) => (
                    <EmotionPanel
                        key={group.marker}
                        emotion={group.emotion}
                        emotionData={group.data}
                        selectedColumns={selectedColumns}
                        chartType={chartType}
                        xAxis={xAxis}
                        subjects={subjects}
                        showXAxis={idx === filteredEmotionGroups.length - 1}
                        panelIndex={idx}
                        isDark={isDark}
                    />
                ))}
            </div>
        </div>
    );
});

export default PhysiologyChart;
