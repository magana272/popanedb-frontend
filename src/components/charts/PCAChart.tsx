import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Plot from 'react-plotly.js';
import { PCAResponse, EmotionColorMap, STUDY_COLUMNS } from '../../types/popane';
import { popaneApi } from '../../services/popaneApi';
import { Button, LoadingSpinner, Card } from '../ui';
import { useTheme } from '../../context/ThemeContext';
import './PCAChart.css';

interface PCAChartProps {
    studyNumber: number;
    subjectIds?: number[];
    initialFeatures?: string[];
}

const PCALegend = memo(function PCALegend({
    emotions,
}: {
    emotions: EmotionColorMap[];
}) {
    return (
        <div className="pca-legend">
            {emotions.map(em => (
                <div key={em.emotion} className="legend-item">
                    <span
                        className="legend-marker"
                        style={{ backgroundColor: em.color }}
                    />
                    <span className="legend-label">{em.emotion}</span>
                </div>
            ))}
        </div>
    );
});

const PCAChart = memo(function PCAChart({
    studyNumber,
    subjectIds,
    initialFeatures = ['ECG', 'EDA', 'SBP', 'DBP'],
}: PCAChartProps): React.JSX.Element {
    const { isDark } = useTheme();
    const [data, setData] = useState<PCAResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sampleSize, setSampleSize] = useState(1000);

    // Filter features to only include those available in the current study
    const validFeatures = useMemo(() => {
        const studyColumns = STUDY_COLUMNS[studyNumber] || [];
        const filtered = initialFeatures.filter(f => studyColumns.includes(f));

        // PCA requires at least 2 features - add more available features if needed
        if (filtered.length < 2) {
            const physiologicalFeatures = ['ECG', 'EDA', 'SBP', 'DBP', 'CO', 'TPR', 'dzdt', 'dz', 'z0', 'temp', 'respiration'];
            const availableFeatures = physiologicalFeatures.filter(f => studyColumns.includes(f) && !filtered.includes(f));
            return [...filtered, ...availableFeatures].slice(0, 4); // Take up to 4 features
        }

        return filtered;
    }, [studyNumber, initialFeatures]);

    const fetchData = useCallback(async () => {
        if (!studyNumber || validFeatures.length < 2) {
            setError(validFeatures.length < 2 ? 'PCA requires at least 2 physiological features' : null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await popaneApi.getPCAAnalysis(
                studyNumber,
                subjectIds,
                validFeatures,
                sampleSize
            );
            setData(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load PCA data');
        } finally {
            setLoading(false);
        }
    }, [studyNumber, subjectIds, validFeatures, sampleSize]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const traces = useMemo(() => {
        if (!data) return [];

        const emotionGroups: Record<string, { pc1: number[]; pc2: number[]; color: string }> = {};

        data.data_points.forEach(point => {
            if (!emotionGroups[point.emotion]) {
                emotionGroups[point.emotion] = { pc1: [], pc2: [], color: point.color };
            }
            emotionGroups[point.emotion].pc1.push(point.pc1);
            emotionGroups[point.emotion].pc2.push(point.pc2);
        });

        return Object.entries(emotionGroups).map(([emotion, group]) => ({
            x: group.pc1,
            y: group.pc2,
            type: 'scatter' as const,
            mode: 'markers' as const,
            name: emotion,
            marker: {
                color: group.color,
                size: 4,
                opacity: 0.7,
            },
            hovertemplate: `Emotion: ${emotion}<br>PC1: %{x:.3f}<br>PC2: %{y:.3f}<extra></extra>`,
        }));
    }, [data]);

    const layout = useMemo((): Partial<Plotly.Layout> => {
        const variance = data?.explained_variance || [0, 0];
        const pc1Variance = (variance[0] * 100).toFixed(1);
        const pc2Variance = (variance[1] * 100).toFixed(1);

        const textColor = isDark ? '#a0aec0' : '#374151';
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
        const zerolineColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
        const paperBg = isDark ? '#1e1e1e' : '#ffffff';
        const plotBg = isDark ? '#2a2a2a' : '#f9fafb';

        return {
            title: {
                text: `PCA of Physiological Data - Study ${studyNumber}`,
                font: { size: 16, color: '#60a5fa' },
            },
            xaxis: {
                title: { text: `Principal Component 1 (${pc1Variance}% variance)`, font: { color: textColor } },
                gridcolor: gridColor,
                zeroline: true,
                zerolinecolor: zerolineColor,
                tickfont: { color: textColor },
            },
            yaxis: {
                title: { text: `Principal Component 2 (${pc2Variance}% variance)`, font: { color: textColor } },
                gridcolor: gridColor,
                zeroline: true,
                zerolinecolor: zerolineColor,
                tickfont: { color: textColor },
            },
            paper_bgcolor: paperBg,
            plot_bgcolor: plotBg,
            showlegend: false,
            hovermode: 'closest',
            margin: { l: 60, r: 30, t: 60, b: 60 },
            font: { color: textColor },
        };
    }, [data, studyNumber, isDark]);

    const handleSampleSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setSampleSize(parseInt(e.target.value));
    }, []);

    if (loading && !data) {
        return (
            <Card className="pca-chart loading">
                <LoadingSpinner size="large" message="Computing PCA analysis..." />
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="pca-chart error">
                <div className="error-message">
                    <p>Error: {error}</p>
                    <Button onClick={fetchData}>Retry</Button>
                </div>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card className="pca-chart empty">
                <p>Select a study to view PCA analysis</p>
            </Card>
        );
    }

    const totalVariance = ((data.explained_variance[0] + data.explained_variance[1]) * 100).toFixed(1);

    return (
        <Card className="pca-chart">
            <div className="chart-header">
                <div className="header-info">
                    <h3>PCA Analysis</h3>
                    <span className="info-text">
                        {data.data_points.length.toLocaleString()} time points •
                        {totalVariance}% total variance explained •
                        Features: {data.features_used.join(', ')}
                    </span>
                </div>
                <PCALegend emotions={data.emotions} />
            </div>

            <div className="chart-controls">
                <div className="control-group">
                    <label>Time Points:</label>
                    <select value={sampleSize} onChange={handleSampleSizeChange}>
                        <option value={1000}>1,000</option>
                        <option value={2500}>2,500</option>
                        <option value={5000}>5,000</option>
                        <option value={10000}>10,000</option>
                        <option value={25000}>25,000</option>
                        <option value={50000}>50,000</option>
                    </select>
                    <Button
                        variant="primary"
                        size="small"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        {loading ? 'Computing...' : 'Refresh'}
                    </Button>
                </div>
            </div>

            <div className="pca-plot">
                <Plot
                    data={traces as Plotly.Data[]}
                    layout={layout}
                    config={{
                        responsive: true,
                        displayModeBar: true,
                        modeBarButtonsToRemove: ['lasso2d', 'select2d'] as Plotly.ModeBarDefaultButtons[],
                        displaylogo: false,
                    }}
                    style={{ width: '100%', height: '500px' }}
                />
            </div>
        </Card>
    );
});

export default PCAChart;
