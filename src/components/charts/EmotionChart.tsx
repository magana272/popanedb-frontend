import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Plot from 'react-plotly.js';
import {
    EmotionColoredSignalsResponse,
    SignalSeries,
    EmotionColorMap
} from '../../types/popane';
import { popaneApi } from '../../services/popaneApi';
import { Button, LoadingSpinner, Card } from '../ui';
import { useTheme } from '../../context/ThemeContext';
import './EmotionChart.css';

interface EmotionChartProps {
    studyNumber: number;
    subjectId: number;
    initialFeatures?: string[];
}

const LegendItem = memo(function LegendItem({
    emotion,
    color
}: EmotionColorMap) {
    return (
        <div className="legend-item">
            <span
                className="legend-color"
                style={{ backgroundColor: color }}
            />
            <span className="legend-label">{emotion}</span>
        </div>
    );
});

const PANEL_BACKGROUNDS = ['#fafafa', '#f0f4f8'];

const SignalPanel = memo(function SignalPanel({
    signal,
    emotionColors,
    showXAxis,
    isDark,
}: {
    signal: SignalSeries;
    emotionColors: Record<string, string>;
    showXAxis: boolean;
    isDark: boolean;
}) {
    const traces = useMemo(() => {
        const emotionGroups: Record<string, { x: number[]; y: (number | null)[] }> = {};

        signal.data_points.forEach(point => {
            if (!emotionGroups[point.emotion]) {
                emotionGroups[point.emotion] = { x: [], y: [] };
            }
            emotionGroups[point.emotion].x.push(point.time_offset);
            emotionGroups[point.emotion].y.push(point.value);
        });

        return Object.entries(emotionGroups).map(([emotion, data]) => ({
            x: data.x,
            y: data.y,
            type: 'scatter' as const,
            mode: 'lines' as const,
            name: emotion,
            line: {
                color: emotionColors[emotion] || '#666',
                width: 1.5,
            },
            hovertemplate: `${signal.feature}: %{y:.4f}<br>Time: %{x:.3f}s<br>Emotion: ${emotion}<extra></extra>`,
        }));
    }, [signal, emotionColors]);

    const textColor = isDark ? '#a0aec0' : '#374151';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const paperBg = isDark ? '#1e1e1e' : '#ffffff';
    const plotBg = isDark ? '#2a2a2a' : '#f9fafb';

    const layout = useMemo((): Partial<Plotly.Layout> => ({
        height: 120,
        margin: { l: 60, r: 20, t: 30, b: showXAxis ? 40 : 10 },
        showlegend: false,
        title: {
            text: signal.title,
            font: { size: 12, color: textColor },
            x: 0.98,
            xanchor: 'right',
            y: 0.95,
        },
        xaxis: {
            showticklabels: showXAxis,
            title: showXAxis ? { text: 'Time (seconds)', font: { size: 10, color: textColor } } : undefined,
            gridcolor: gridColor,
            zeroline: false,
            tickfont: { color: textColor },
        },
        yaxis: {
            title: {
                text: `${signal.feature}\n(${signal.unit})`,
                font: { size: 9, color: textColor },
            },
            gridcolor: gridColor,
            zeroline: false,
            tickfont: { color: textColor },
        },
        paper_bgcolor: paperBg,
        plot_bgcolor: plotBg,
        font: { color: textColor },
    }), [signal, showXAxis, textColor, gridColor, paperBg, plotBg]);

    return (
        <div className="signal-panel">
            <Plot
                data={traces as Plotly.Data[]}
                layout={layout}
                config={{
                    responsive: true,
                    displayModeBar: false,
                    staticPlot: false,
                }}
                style={{ width: '100%' }}
            />
        </div>
    );
});

const EmotionChart = memo(function EmotionChart({
    studyNumber,
    subjectId,
    initialFeatures = ['ECG', 'EDA', 'SBP'],
}: EmotionChartProps): React.JSX.Element {
    const { isDark } = useTheme();
    const [data, setData] = useState<EmotionColoredSignalsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedFeatures, setSelectedFeatures] = useState<string[]>(initialFeatures);
    const [secondsPerEmotion, setSecondsPerEmotion] = useState(5);

    // Fetch emotion-colored data (first N seconds of each emotion)
    const fetchData = useCallback(async () => {
        if (!studyNumber || !subjectId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await popaneApi.getEmotionColoredSignals(
                studyNumber,
                subjectId,
                selectedFeatures.length > 0 ? selectedFeatures : undefined,
                0,
                0,
                secondsPerEmotion
            );
            setData(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [studyNumber, subjectId, selectedFeatures, secondsPerEmotion]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const emotionColors = useMemo(() => {
        if (!data) return {};
        return data.emotions.reduce((acc, em) => {
            acc[em.emotion] = em.color;
            return acc;
        }, {} as Record<string, string>);
    }, [data]);

    const handleFeatureToggle = useCallback((feature: string) => {
        setSelectedFeatures(prev => {
            if (prev.includes(feature)) {
                return prev.filter(f => f !== feature);
            }
            return [...prev, feature];
        });
    }, []);

    const handleSecondsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 5;
        setSecondsPerEmotion(Math.max(1, Math.min(60, value)));
    }, []);

    if (loading && !data) {
        return (
            <Card className="emotion-chart loading">
                <LoadingSpinner size="large" message="Loading emotion-colored data..." />
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="emotion-chart error">
                <div className="error-message">
                    <p>Error: {error}</p>
                    <Button onClick={fetchData}>Retry</Button>
                </div>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card className="emotion-chart empty">
                <p>Select a study and subject to view emotion-colored signals</p>
            </Card>
        );
    }

    return (
        <Card className="emotion-chart">
            <div className="chart-header">
                <h3>
                    {data.study_name} - Subject {data.subject_id}
                    <span className="subtitle">Signals colored by emotion</span>
                </h3>

                {/* Emotion Legend */}
                <div className="emotion-legend">
                    {data.emotions.map(em => (
                        <LegendItem key={em.emotion} {...em} />
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="chart-controls">
                <div className="control-group">
                    <label>Features:</label>
                    <div className="feature-toggles">
                        {data.available_features.map(feature => (
                            <label
                                key={feature}
                                className={`feature-toggle ${selectedFeatures.includes(feature) ? 'active' : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedFeatures.includes(feature)}
                                    onChange={() => handleFeatureToggle(feature)}
                                />
                                {feature}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="control-group time-range">
                    <label>Seconds per emotion:</label>
                    <input
                        type="number"
                        value={secondsPerEmotion}
                        onChange={handleSecondsChange}
                        min={1}
                        max={60}
                        step={1}
                    />
                    <div className="preset-buttons">
                        <button
                            className={secondsPerEmotion === 5 ? 'active' : ''}
                            onClick={() => setSecondsPerEmotion(5)}
                        >
                            5s
                        </button>
                        <button
                            className={secondsPerEmotion === 10 ? 'active' : ''}
                            onClick={() => setSecondsPerEmotion(10)}
                        >
                            10s
                        </button>
                        <button
                            className={secondsPerEmotion === 30 ? 'active' : ''}
                            onClick={() => setSecondsPerEmotion(30)}
                        >
                            30s
                        </button>
                    </div>
                    <Button
                        variant="primary"
                        size="small"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Update'}
                    </Button>
                </div>
            </div>

            {/* Signal Panels - Stacked */}
            <div className="signal-panels">
                {data.signals.map((signal, idx) => (
                    <SignalPanel
                        key={signal.feature}
                        signal={signal}
                        emotionColors={emotionColors}
                        showXAxis={idx === data.signals.length - 1}
                        isDark={isDark}
                    />
                ))}
            </div>
        </Card>
    );
});

export default EmotionChart;
