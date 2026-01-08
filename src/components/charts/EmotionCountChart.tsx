import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Plot from 'react-plotly.js';
import { popaneApi } from '../../services/popaneApi';
import { EMOTION_COLORS } from '../../types/popane';
import { Button, LoadingSpinner, Card } from '../ui';
import { useTheme } from '../../context/ThemeContext';
import './EmotionCountChart.css';

interface EmotionCount {
    emotion: string;
    color: string;
    count: number;
    subjects: number[];
}

interface EmotionCountChartProps {
    studyNumber: number;
    subjectIds: number[];
}

const EmotionCountChart = memo(function EmotionCountChart({
    studyNumber,
    subjectIds,
}: EmotionCountChartProps): React.JSX.Element {
    const { isDark } = useTheme();
    const [emotionCounts, setEmotionCounts] = useState<EmotionCount[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEmotionCounts = useCallback(async () => {
        if (!studyNumber || subjectIds.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            // Use the new efficient endpoint that returns aggregated emotion data
            const response = await popaneApi.getEmotionSummary(studyNumber, subjectIds);

            // Convert response to EmotionCount array
            const counts: EmotionCount[] = Object.entries(response.emotionCounts).map(([emotion, count]) => ({
                emotion,
                count,
                color: EMOTION_COLORS[emotion] || '#666666',
                subjects: response.subjectsPerEmotion[emotion] || [],
            }));

            setEmotionCounts(counts.sort((a, b) => b.count - a.count));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load emotion data');
        } finally {
            setLoading(false);
        }
    }, [studyNumber, subjectIds]);

    useEffect(() => {
        fetchEmotionCounts();
    }, [fetchEmotionCounts]);

    const textColor = isDark ? '#a0aec0' : '#374151';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const paperBg = isDark ? '#1e1e1e' : '#ffffff';
    const plotBg = isDark ? '#2a2a2a' : '#f9fafb';

    const traces = useMemo(() => {
        if (emotionCounts.length === 0) return [];

        return [{
            x: emotionCounts.map(e => e.emotion),
            y: emotionCounts.map(e => e.count),
            type: 'bar' as const,
            marker: {
                color: emotionCounts.map(e => e.color),
            },
            text: emotionCounts.map(e => `${e.count} subject${e.count > 1 ? 's' : ''}`),
            textposition: 'auto' as const,
            hovertemplate: '%{x}<br>Count: %{y}<br>Subjects: %{customdata}<extra></extra>',
            customdata: emotionCounts.map(e => e.subjects.join(', ')),
        }];
    }, [emotionCounts]);

    const layout = useMemo((): Partial<Plotly.Layout> => ({
        title: {
            text: `Emotion Distribution - Study ${studyNumber}`,
            font: { size: 16, color: '#60a5fa' },
        },
        xaxis: {
            title: { text: 'Emotion', font: { color: textColor } },
            tickfont: { color: textColor },
            gridcolor: gridColor,
        },
        yaxis: {
            title: { text: 'Number of Subjects', font: { color: textColor } },
            tickfont: { color: textColor },
            gridcolor: gridColor,
            dtick: 10,
        },
        height: 400,
        margin: { l: 60, r: 30, t: 60, b: 80 },
        paper_bgcolor: paperBg,
        plot_bgcolor: plotBg,
        font: { color: textColor },
        showlegend: false,
    }), [studyNumber, textColor, gridColor, paperBg, plotBg]);

    if (loading && emotionCounts.length === 0) {
        return (
            <Card className="emotion-count-chart loading">
                <LoadingSpinner size="large" message="Loading emotion distribution..." />
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="emotion-count-chart error">
                <div className="error-message">
                    <p>Error: {error}</p>
                    <Button onClick={fetchEmotionCounts}>Retry</Button>
                </div>
            </Card>
        );
    }

    if (emotionCounts.length === 0) {
        return (
            <Card className="emotion-count-chart empty">
                <p>Select subjects to view emotion distribution</p>
            </Card>
        );
    }

    return (
        <Card className="emotion-count-chart">
            <div className="chart-header">
                <h3>
                    Emotion Distribution
                    <span className="subtitle">
                        {subjectIds.length} subject{subjectIds.length > 1 ? 's' : ''} selected
                    </span>
                </h3>
                <div className="chart-info">
                    <span className="total-emotions">
                        {emotionCounts.length} unique emotion{emotionCounts.length > 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            <Plot
                data={traces as Plotly.Data[]}
                layout={layout}
                config={{
                    responsive: true,
                    displayModeBar: false,
                }}
                style={{ width: '100%' }}
            />

            <div className="emotion-summary">
                {emotionCounts.map(e => (
                    <div key={e.emotion} className="emotion-item">
                        <span
                            className="emotion-color"
                            style={{ backgroundColor: e.color }}
                        />
                        <span className="emotion-name">{e.emotion}</span>
                        <span className="emotion-count">{e.count}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
});

export default EmotionCountChart;
