import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Data, Layout } from 'plotly.js';
import { useTheme } from '../../context/ThemeContext';

interface TimeDomainMetrics {
    mean: number;
    std: number;
    min_val: number;
    max_val: number;
    range_val: number;
    rmssd: number | null;
    sdnn: number | null;
    sdsd: number | null;
    pnn50: number | null;
    pnn20: number | null;
    n_samples: number;
    duration_sec: number;
}

interface FrequencyDomainMetrics {
    vlf_power: number;
    lf_power: number;
    hf_power: number;
    total_power: number;
    lf_nu: number;
    hf_nu: number;
    lf_hf_ratio: number;
    vlf_peak: number;
    lf_peak: number;
    hf_peak: number;
    n_samples: number;
    sampling_rate: number;
}

interface EmotionFeatures {
    emotion: string;
    color: string;
    time_domain: TimeDomainMetrics;
    frequency_domain: FrequencyDomainMetrics;
}

interface FeatureAnalysisResponse {
    study_number: number;
    subject_id: number;
    feature: string;
    feature_title: string;
    feature_unit: string;
    emotions: EmotionFeatures[];
    summary: {
        n_emotions: number;
        total_samples: number;
        sampling_rate: number;
    };
}

interface PowerSpectrumData {
    emotion: string;
    color: string;
    data: Array<{ frequency: number; power: number }>;
}

interface PowerSpectrumResponse {
    study_number: number;
    subject_id: number;
    feature: string;
    spectra: PowerSpectrumData[];
    frequency_bands: {
        vlf: { min: number; max: number; label: string };
        lf: { min: number; max: number; label: string };
        hf: { min: number; max: number; label: string };
    };
}

// FFT response interface matching the /viz/fft endpoint
interface FFTEmotionData {
    emotion: string;
    color: string;
    spectrum: Array<{ frequency: number; magnitude: number }>;
    dominant_frequency: number;
    signal_energy: number;
    n_samples: number;
}

interface FFTResponse {
    study_number: number;
    subject_id: number;
    feature: string;
    feature_title: string;
    sampling_interval: number;
    max_frequency: number;
    emotions: FFTEmotionData[];
}

interface FeatureAnalysisChartProps {
    studyNumber: number;
    subjectId: number;
    feature?: string;
    samplingRate?: number;
    height?: number;
}

export const FeatureAnalysisChart: React.FC<FeatureAnalysisChartProps> = ({
    studyNumber,
    subjectId,
    feature = 'EDA',
    samplingRate = 1000,
    height = 500,
}) => {
    const { isDark } = useTheme();
    const [data, setData] = useState<FeatureAnalysisResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'time' | 'frequency' | 'both'>('both');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            const vizUrl = process.env.REACT_APP_VIZ_URL || 'http://localhost:8000/viz';
            try {
                const response = await fetch(
                    `${vizUrl}/analysis/${studyNumber}/${subjectId}?feature=${feature}&sampling_rate=${samplingRate}`
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [studyNumber, subjectId, feature, samplingRate]);

    if (loading) {
        return <div className="loading">Loading feature analysis...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    if (!data || data.emotions.length === 0) {
        return <div className="no-data">No feature data available</div>;
    }

    const emotions = data.emotions.map(e => e.emotion);
    const colors = data.emotions.map(e => e.color);

    const timeDomainTraces: Data[] = [
        {
            name: 'Mean',
            type: 'bar',
            x: emotions,
            y: data.emotions.map(e => e.time_domain.mean),
            marker: { color: colors },
        },
        {
            name: 'Std Dev',
            type: 'bar',
            x: emotions,
            y: data.emotions.map(e => e.time_domain.std),
            marker: { color: colors.map(c => c + '99') },
        },
    ];

    const freqDomainTraces: Data[] = [
        {
            name: 'VLF Power',
            type: 'bar',
            x: emotions,
            y: data.emotions.map(e => e.frequency_domain.vlf_power),
            marker: { color: '#ff6b6b' },
        },
        {
            name: 'LF Power',
            type: 'bar',
            x: emotions,
            y: data.emotions.map(e => e.frequency_domain.lf_power),
            marker: { color: '#4ecdc4' },
        },
        {
            name: 'HF Power',
            type: 'bar',
            x: emotions,
            y: data.emotions.map(e => e.frequency_domain.hf_power),
            marker: { color: '#45b7d1' },
        },
    ];

    const ratioTrace: Data = {
        name: 'LF/HF Ratio',
        type: 'scatter',
        mode: 'lines+markers',
        x: emotions,
        y: data.emotions.map(e => e.frequency_domain.lf_hf_ratio),
        marker: { color: '#f39c12', size: 10 },
        line: { color: '#f39c12', width: 2 },
        yaxis: 'y2',
    };

    const textColor = isDark ? '#a0aec0' : '#374151';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const paperBg = isDark ? '#1e1e1e' : '#ffffff';
    const plotBg = isDark ? '#2a2a2a' : '#f9fafb';

    const timeDomainLayout: Partial<Layout> = {
        title: { text: `Time-Domain Features: ${data.feature_title}`, font: { color: '#60a5fa' } },
        barmode: 'group',
        xaxis: { title: { text: 'Emotion', font: { color: textColor } }, tickfont: { color: textColor }, gridcolor: gridColor },
        yaxis: { title: { text: `Value (${data.feature_unit})`, font: { color: textColor } }, tickfont: { color: textColor }, gridcolor: gridColor },
        height: height / 2,
        margin: { t: 50, b: 50, l: 60, r: 40 },
        showlegend: true,
        legend: { orientation: 'h', y: -0.2, font: { color: textColor } },
        paper_bgcolor: paperBg,
        plot_bgcolor: plotBg,
        font: { color: textColor },
    };

    const freqDomainLayout: Partial<Layout> = {
        title: { text: 'Frequency-Domain Power by Band', font: { color: '#60a5fa' } },
        barmode: 'stack',
        xaxis: { title: { text: 'Emotion', font: { color: textColor } }, tickfont: { color: textColor }, gridcolor: gridColor },
        yaxis: { title: { text: 'Power', font: { color: textColor } }, tickfont: { color: textColor }, gridcolor: gridColor },
        yaxis2: {
            title: { text: 'LF/HF Ratio', font: { color: textColor } },
            overlaying: 'y',
            side: 'right',
            tickfont: { color: textColor },
            gridcolor: gridColor,
        },
        height: height / 2,
        margin: { t: 50, b: 50, l: 60, r: 60 },
        showlegend: true,
        legend: { orientation: 'h', y: -0.2, font: { color: textColor } },
        paper_bgcolor: paperBg,
        plot_bgcolor: plotBg,
        font: { color: textColor },
    };

    return (
        <div className="feature-analysis-chart">
            <div className="view-mode-selector" style={{ marginBottom: '10px' }}>
                <button
                    onClick={() => setViewMode('time')}
                    className={viewMode === 'time' ? 'active' : ''}
                    style={{ marginRight: '5px', padding: '5px 10px' }}
                >
                    Time Domain
                </button>
                <button
                    onClick={() => setViewMode('frequency')}
                    className={viewMode === 'frequency' ? 'active' : ''}
                    style={{ marginRight: '5px', padding: '5px 10px' }}
                >
                    Frequency Domain
                </button>
                <button
                    onClick={() => setViewMode('both')}
                    className={viewMode === 'both' ? 'active' : ''}
                    style={{ padding: '5px 10px' }}
                >
                    Both
                </button>
            </div>

            {(viewMode === 'time' || viewMode === 'both') && (
                <Plot
                    data={timeDomainTraces}
                    layout={timeDomainLayout}
                    config={{ responsive: true }}
                    style={{ width: '100%' }}
                />
            )}

            {(viewMode === 'frequency' || viewMode === 'both') && (
                <Plot
                    data={[...freqDomainTraces, ratioTrace]}
                    layout={freqDomainLayout}
                    config={{ responsive: true }}
                    style={{ width: '100%' }}
                />
            )}

            <div className="feature-summary" style={{ marginTop: '20px', overflowX: 'auto', background: '#1e1e1e', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ color: '#a0aec0', marginBottom: '12px' }}>{data.feature_title} Feature Summary</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#a0aec0' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
                            <th style={{ textAlign: 'left', padding: '8px', color: '#a0aec0' }}>Emotion</th>
                            <th style={{ textAlign: 'right', padding: '8px', color: '#a0aec0' }}>{feature} Mean ({data.feature_unit})</th>
                            <th style={{ textAlign: 'right', padding: '8px', color: '#a0aec0' }}>{feature} Std ({data.feature_unit})</th>
                            <th style={{ textAlign: 'right', padding: '8px', color: '#a0aec0' }}>LF Power</th>
                            <th style={{ textAlign: 'right', padding: '8px', color: '#a0aec0' }}>HF Power</th>
                            <th style={{ textAlign: 'right', padding: '8px', color: '#a0aec0' }}>LF/HF</th>
                            <th style={{ textAlign: 'right', padding: '8px', color: '#a0aec0' }}>Samples</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.emotions.map((e, i) => (
                            <tr key={e.emotion} style={{
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                backgroundColor: i % 2 === 0 ? '#2a2a2a' : '#1e1e1e'
                            }}>
                                <td style={{ padding: '8px' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        width: '12px',
                                        height: '12px',
                                        backgroundColor: e.color,
                                        marginRight: '8px',
                                        borderRadius: '2px'
                                    }}></span>
                                    {e.emotion}
                                </td>
                                <td style={{ textAlign: 'right', padding: '8px' }}>
                                    {e.time_domain.mean.toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', padding: '8px' }}>
                                    {e.time_domain.std.toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', padding: '8px' }}>
                                    {e.frequency_domain.lf_power.toExponential(2)}
                                </td>
                                <td style={{ textAlign: 'right', padding: '8px' }}>
                                    {e.frequency_domain.hf_power.toExponential(2)}
                                </td>
                                <td style={{ textAlign: 'right', padding: '8px' }}>
                                    {e.frequency_domain.lf_hf_ratio.toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', padding: '8px' }}>
                                    {e.time_domain.n_samples.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface PowerSpectrumChartProps {
    studyNumber: number;
    subjectId: number;
    feature?: string;
    samplingRate?: number;
    maxFreq?: number;
    height?: number;
}

export const PowerSpectrumChart: React.FC<PowerSpectrumChartProps> = ({
    studyNumber,
    subjectId,
    feature = 'EDA',
    samplingRate = 1000,
    maxFreq = 0.5,
    height = 400,
}) => {
    const { isDark } = useTheme();
    const [data, setData] = useState<PowerSpectrumResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            const vizUrl = process.env.REACT_APP_VIZ_URL || 'http://localhost:8000/viz';
            try {
                const response = await fetch(
                    `${vizUrl}/spectrum/${studyNumber}/${subjectId}?feature=${feature}&sampling_rate=${samplingRate}&max_freq=${maxFreq}`
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [studyNumber, subjectId, feature, samplingRate, maxFreq]);

    if (loading) {
        return <div className="loading">Loading power spectrum...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    if (!data || data.spectra.length === 0) {
        return <div className="no-data">No spectrum data available</div>;
    }

    const traces: Data[] = data.spectra.map(spectrum => ({
        name: spectrum.emotion,
        type: 'scatter',
        mode: 'lines',
        x: spectrum.data.map(d => d.frequency),
        y: spectrum.data.map(d => d.power),
        line: { color: spectrum.color, width: 1.5 },
        fill: 'tozeroy',
        fillcolor: spectrum.color + '20',
    }));

    const shapes = [
        {
            type: 'rect' as const,
            xref: 'x' as const,
            yref: 'paper' as const,
            x0: data.frequency_bands.vlf.min,
            x1: data.frequency_bands.vlf.max,
            y0: 0,
            y1: 1,
            fillcolor: 'rgba(255, 107, 107, 0.1)',
            line: { width: 0 },
        },
        {
            type: 'rect' as const,
            xref: 'x' as const,
            yref: 'paper' as const,
            x0: data.frequency_bands.lf.min,
            x1: data.frequency_bands.lf.max,
            y0: 0,
            y1: 1,
            fillcolor: 'rgba(78, 205, 196, 0.1)',
            line: { width: 0 },
        },
        {
            type: 'rect' as const,
            xref: 'x' as const,
            yref: 'paper' as const,
            x0: data.frequency_bands.hf.min,
            x1: data.frequency_bands.hf.max,
            y0: 0,
            y1: 1,
            fillcolor: 'rgba(69, 183, 209, 0.1)',
            line: { width: 0 },
        },
    ];

    const annotations = [
        {
            x: (data.frequency_bands.vlf.min + data.frequency_bands.vlf.max) / 2,
            y: 1,
            xref: 'x' as const,
            yref: 'paper' as const,
            text: 'VLF',
            showarrow: false,
            font: { size: 10, color: '#ff6b6b' },
        },
        {
            x: (data.frequency_bands.lf.min + data.frequency_bands.lf.max) / 2,
            y: 1,
            xref: 'x' as const,
            yref: 'paper' as const,
            text: 'LF',
            showarrow: false,
            font: { size: 10, color: '#4ecdc4' },
        },
        {
            x: (data.frequency_bands.hf.min + data.frequency_bands.hf.max) / 2,
            y: 1,
            xref: 'x' as const,
            yref: 'paper' as const,
            text: 'HF',
            showarrow: false,
            font: { size: 10, color: '#45b7d1' },
        },
    ];

    const textColor = isDark ? '#a0aec0' : '#374151';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const paperBg = isDark ? '#1e1e1e' : '#ffffff';
    const plotBg = isDark ? '#2a2a2a' : '#f9fafb';

    const layout: Partial<Layout> = {
        title: { text: `Power Spectral Density: ${feature}`, font: { color: '#60a5fa' } },
        xaxis: {
            title: { text: 'Frequency (Hz)', font: { color: textColor } },
            range: [0, maxFreq],
            tickfont: { color: textColor },
            gridcolor: gridColor,
        },
        yaxis: {
            title: { text: 'Power Spectral Density', font: { color: textColor } },
            type: 'log',
            tickfont: { color: textColor },
            gridcolor: gridColor,
        },
        height: height,
        margin: { t: 50, b: 50, l: 70, r: 40 },
        showlegend: true,
        legend: { orientation: 'h', y: -0.15, font: { color: textColor } },
        shapes: shapes,
        annotations: annotations,
        paper_bgcolor: paperBg,
        plot_bgcolor: plotBg,
        font: { color: textColor },
    };

    return (
        <div className="power-spectrum-chart">
            <Plot
                data={traces}
                layout={layout}
                config={{ responsive: true }}
                style={{ width: '100%' }}
            />
        </div>
    );
};

const FFT_SUPPORTED_FEATURES = ['ECG', 'EDA', 'SBP', 'DBP', 'temp', 'respiration', 'dzdt', 'dz', 'z0'];

interface FFTChartProps {
    studyNumber: number;
    subjectId: number;
    availableColumns?: string[];
    feature?: string;
    maxFreq?: number;
    height?: number;
    onGeneratePCA?: (feature: string, studyNumber: number) => void;
}

export const FFTChart: React.FC<FFTChartProps> = ({
    studyNumber,
    subjectId,
    availableColumns = [],
    feature = 'ECG',
    maxFreq = 2.0,
    height = 400,
    onGeneratePCA,
}) => {
    const { isDark } = useTheme();
    const [data, setData] = useState<FFTResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter to only FFT-supported features that are available in this study
    const availableFFTFeatures = availableColumns.filter(col =>
        FFT_SUPPORTED_FEATURES.includes(col)
    );

    const defaultFeature = availableFFTFeatures.includes(feature)
        ? feature
        : availableFFTFeatures[0] || 'ECG';

    const [selectedFeature, setSelectedFeature] = useState(defaultFeature);

    // Reset selection when available features change (study switch)
    useEffect(() => {
        if (availableFFTFeatures.length > 0 && !availableFFTFeatures.includes(selectedFeature)) {
            setSelectedFeature(availableFFTFeatures[0]);
        }
    }, [availableColumns, availableFFTFeatures, selectedFeature]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            const vizUrl = process.env.REACT_APP_VIZ_URL || 'http://localhost:8000/viz';
            try {
                const response = await fetch(
                    `${vizUrl}/fft/${studyNumber}/${subjectId}?feature=${selectedFeature}&max_freq=${maxFreq}`
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch FFT data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [studyNumber, subjectId, selectedFeature, maxFreq]);

    const textColor = isDark ? '#a0aec0' : '#374151';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const paperBg = isDark ? '#1e1e1e' : '#ffffff';
    const plotBg = isDark ? '#2a2a2a' : '#f9fafb';

    if (loading) {
        return <div className="loading">Loading frequency analysis...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    if (!data || !data.emotions || data.emotions.length === 0) {
        return <div className="no-data">No FFT data available</div>;
    }

    // Create traces for each emotion's frequency spectrum
    const traces: Data[] = data.emotions.map(emotionData => ({
        name: emotionData.emotion,
        type: 'scatter',
        mode: 'lines',
        x: emotionData.spectrum.map(d => d.frequency),
        y: emotionData.spectrum.map(d => d.magnitude),
        line: { color: emotionData.color, width: 1.5 },
    }));

    const layout: Partial<Layout> = {
        title: {
            text: `Frequency Spectrum: ${selectedFeature}`,
            font: { color: '#60a5fa', size: 16 }
        },
        xaxis: {
            title: { text: 'Frequency (Hz)', font: { color: textColor } },
            range: [0, maxFreq],
            tickfont: { color: textColor },
            gridcolor: gridColor,
        },
        yaxis: {
            title: { text: 'Normalized Magnitude', font: { color: textColor } },
            range: [0, 8],
            tickfont: { color: textColor },
            gridcolor: gridColor,
        },
        height: height,
        margin: { t: 50, b: 60, l: 70, r: 40 },
        showlegend: true,
        legend: {
            orientation: 'h',
            y: -0.2,
            font: { color: textColor },
            bgcolor: 'transparent',
        },
        paper_bgcolor: paperBg,
        plot_bgcolor: plotBg,
        font: { color: textColor },
    };

    return (
        <div className="fft-chart">
            <div className="fft-controls" style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ color: textColor }}>Signal:</label>
                <select
                    value={selectedFeature}
                    onChange={(e) => setSelectedFeature(e.target.value)}
                    style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: isDark ? '#2a2a2a' : '#fff',
                        color: textColor,
                        border: `1px solid ${gridColor}`
                    }}
                >
                    {availableFFTFeatures.map(feat => (
                        <option key={feat} value={feat}>{feat}</option>
                    ))}
                </select>
            </div>

            <Plot
                data={traces}
                layout={layout}
                config={{ responsive: true, displayModeBar: false }}
                style={{ width: '100%' }}
            />

            <div className="fft-summary" style={{
                marginTop: '15px',
                overflowX: 'auto',
                background: isDark ? '#1e1e1e' : '#ffffff',
                borderRadius: '8px',
                padding: '16px'
            }}>
                <h4 style={{ color: textColor, marginBottom: '12px' }}>
                    {selectedFeature} Frequency Features — Subject {subjectId}
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: textColor }}>
                    <thead>
                        <tr style={{ borderBottom: `2px solid ${gridColor}` }}>
                            <th style={{ textAlign: 'left', padding: '8px', color: textColor }}>Emotion</th>
                            <th style={{ textAlign: 'right', padding: '8px', color: textColor }}>Dominant Freq (Hz)</th>
                            <th style={{ textAlign: 'right', padding: '8px', color: textColor }}>Signal Energy</th>
                            <th style={{ textAlign: 'right', padding: '8px', color: textColor }}>N Samples</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.emotions.map((emotionData, i) => (
                            <tr
                                key={emotionData.emotion}
                                style={{
                                    borderBottom: `1px solid ${gridColor}`,
                                    backgroundColor: i % 2 === 0
                                        ? (isDark ? '#2a2a2a' : '#f9fafb')
                                        : (isDark ? '#1e1e1e' : '#ffffff')
                                }}
                            >
                                <td style={{ padding: '8px' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        width: '12px',
                                        height: '12px',
                                        backgroundColor: emotionData.color,
                                        marginRight: '8px',
                                        borderRadius: '2px'
                                    }}></span>
                                    {emotionData.emotion}
                                </td>
                                <td style={{ textAlign: 'right', padding: '8px' }}>
                                    {emotionData.dominant_frequency.toFixed(4)}
                                </td>
                                <td style={{ textAlign: 'right', padding: '8px' }}>
                                    {emotionData.signal_energy.toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', padding: '8px' }}>
                                    {emotionData.n_samples.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {onGeneratePCA && (
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => onGeneratePCA(selectedFeature, studyNumber)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#3b82f6',
                                color: '#fff',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            Generate PCA from {selectedFeature} Frequency Features
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Response interface for /pca/frequency endpoint
interface FrequencyPCAResponse {
    study_number: number;
    features_used: string[];
    n_subjects: number;
    n_emotions: number;
    n_points: number;
    variance_explained: [number, number];
    // Backend returns data_points with PCA coordinates
    data_points: Array<{
        subject_id: number;
        emotion: string;
        color: string;
        pc1: number;
        pc2: number;
    }>;
}

// Response from /features/matrix endpoint - raw feature values for table display
interface FeatureMatrixResponse {
    study_number: number;
    columns: string[];  // List of feature column names (includes 'Subject', 'Emotion')
    signals_used: string[];
    n_subjects: number;
    n_emotions: number;
    n_features: number;
    rows: Array<{
        Subject: number;
        Emotion: string;
        _color: string;
        [key: string]: number | string;
    }>;
}

const featureMatrixCache = new Map<string, {
    data: SubjectEmotionFeatureRow[];
    columns: string[];
    timestamp: number;
}>();

const pcaCache = new Map<string, {
    result: FrequencyPCAResponse;
    timestamp: number;
}>();

const CACHE_DURATION_MS = 5 * 60 * 1000;

const getCacheKey = (studyNumber: number, features: string[], subjectIds: number[]) => {
    return `${studyNumber}:${features.sort().join(',')}:${subjectIds.sort((a, b) => a - b).join(',')}`;
};

// Comprehensive Feature Table - shows all signals' frequency features + time-domain features
// One row per (subject, emotion) combination for PCA analysis
// Uses /features/matrix for table display, /pca/frequency when generating PCA
interface ComprehensiveFeatureTableProps {
    studyNumber: number;
    subjectIds: number[];  // All subjects to include
    availableColumns: string[];
    onGeneratePCA?: (features: string[], data: SubjectEmotionFeatureRow[], variance?: [number, number]) => void;
}

interface SubjectEmotionFeatureRow {
    subjectId: number;
    emotion: string;
    color: string;
    features: Record<string, number>; // e.g., { ECG_dom_freq: 1.2, ECG_energy: 30.5, ECG_mean: 75.2, ... }
    pc1?: number;
    pc2?: number;
}

export const ComprehensiveFeatureTable: React.FC<ComprehensiveFeatureTableProps> = ({
    studyNumber,
    subjectIds,
    availableColumns,
    onGeneratePCA,
}) => {
    const { isDark } = useTheme();
    const [data, setData] = useState<SubjectEmotionFeatureRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingPCA, setLoadingPCA] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [featureColumns, setFeatureColumns] = useState<string[]>([]);
    const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, currentBatch: 0, totalBatches: 0 });

    // Filter to only FFT-supported features
    const fftFeatures = availableColumns.filter(col =>
        FFT_SUPPORTED_FEATURES.includes(col)
    );

    // Fetch raw feature matrix for table display - parallel with concurrency limit of 5
    useEffect(() => {
        const CONCURRENCY_LIMIT = 5;

        const fetchFeatureMatrix = async () => {
            if (subjectIds.length === 0 || fftFeatures.length === 0) {
                setData([]);
                setLoading(false);
                return;
            }

            // Check client-side cache first
            const cacheKey = getCacheKey(studyNumber, fftFeatures, subjectIds);
            const cached = featureMatrixCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION_MS) {
                setData(cached.data);
                setFeatureColumns(cached.columns);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            setData([]); // Clear existing data

            const vizUrl = process.env.REACT_APP_VIZ_URL || 'http://localhost:8000/viz';
            const featuresParam = fftFeatures.join(',');

            setLoadingProgress({ current: 0, total: subjectIds.length, currentBatch: 0, totalBatches: subjectIds.length });

            const allRows: SubjectEmotionFeatureRow[] = [];
            let featureCols: string[] = [];
            let completedCount = 0;

            // Fetch single subject data
            const fetchSubject = async (subjectId: number): Promise<SubjectEmotionFeatureRow[]> => {
                const response = await fetch(
                    `${vizUrl}/features/matrix/${studyNumber}?features=${featuresParam}&subject_ids=${subjectId}`
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result: FeatureMatrixResponse = await response.json();

                if (!result.rows || !Array.isArray(result.rows)) {
                    return [];
                }

                // Get feature columns from first response
                if (featureCols.length === 0 && result.columns) {
                    featureCols = result.columns.filter(col =>
                        col !== 'Subject' && col !== 'Emotion' && col !== '_color'
                    );
                    setFeatureColumns(featureCols);
                }

                // Transform rows
                return result.rows.map(item => {
                    const features: Record<string, number> = {};
                    for (const col of featureCols) {
                        if (typeof item[col] === 'number') {
                            features[col] = item[col] as number;
                        }
                    }
                    return {
                        subjectId: item.Subject,
                        emotion: item.Emotion,
                        color: item._color,
                        features
                    };
                });
            };

            try {
                // Process subjects with concurrency limit (thread pool pattern)
                const queue = [...subjectIds];
                const inFlight: Promise<void>[] = [];

                const processNext = async (): Promise<void> => {
                    if (queue.length === 0) return;

                    const subjectId = queue.shift()!;
                    try {
                        const rows = await fetchSubject(subjectId);
                        allRows.push(...rows);
                        completedCount++;

                        // Update progress and data
                        setLoadingProgress(prev => ({
                            ...prev,
                            current: completedCount,
                            currentBatch: completedCount
                        }));
                        setData([...allRows]);
                    } catch (err) {
                        console.error(`Failed to fetch subject ${subjectId}:`, err);
                    }

                    // Process next item in queue
                    await processNext();
                };

                // Start initial batch of concurrent requests
                for (let i = 0; i < Math.min(CONCURRENCY_LIMIT, subjectIds.length); i++) {
                    inFlight.push(processNext());
                }

                // Wait for all to complete
                await Promise.all(inFlight);

                // Cache the results
                featureMatrixCache.set(cacheKey, {
                    data: allRows,
                    columns: featureCols,
                    timestamp: Date.now()
                });

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch feature matrix data');
            } finally {
                setLoading(false);
            }
        };

        fetchFeatureMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studyNumber, subjectIds.join(','), availableColumns.join(',')]);

    const textColor = isDark ? '#a0aec0' : '#374151';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    if (loading) {
        const progressPercent = loadingProgress.total > 0
            ? Math.round((loadingProgress.current / loadingProgress.total) * 100)
            : 0;

        return (
            <div className="loading" style={{ padding: '20px', textAlign: 'center' }}>
                <div>Loading comprehensive feature analysis...</div>
                <div style={{ marginTop: '10px', color: textColor, fontSize: '12px' }}>
                    {loadingProgress.current} of {loadingProgress.total} subjects ({progressPercent}%) — 5 parallel requests
                </div>
                <div style={{
                    marginTop: '12px',
                    width: '100%',
                    maxWidth: '300px',
                    margin: '12px auto',
                    height: '8px',
                    backgroundColor: isDark ? '#374151' : '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${progressPercent}%`,
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
                {data.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: textColor, opacity: 0.7 }}>
                        {data.length} rows loaded...
                    </div>
                )}
            </div>
        );
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    if (data.length === 0) {
        return <div className="no-data">No feature data available</div>;
    }

    // Format column header nicely
    const formatHeader = (col: string) => {
        const parts = col.split('_');
        const signal = parts[0];
        const metric = parts.slice(1).join(' ');
        return (
            <span>
                <strong>{signal}</strong>
                <br />
                <span style={{ fontSize: '10px', opacity: 0.8 }}>{metric}</span>
            </span>
        );
    };

    // Format cell value
    const formatValue = (col: string, value: number | undefined) => {
        if (value === undefined) return '—';
        // Backend uses snake_case: dom_freq, energy, mean, std, etc.
        if (col.includes('dom_freq')) return value.toFixed(4);
        if (col.includes('energy')) return value.toFixed(2);
        if (col.includes('mean') || col.includes('std')) return value.toFixed(2);
        if (col.includes('power') || col.includes('ratio')) return value.toFixed(4);
        return value.toFixed(3);
    };

    // Get unique subjects and emotions for summary
    const uniqueSubjects = Array.from(new Set(data.map(d => d.subjectId)));
    const uniqueEmotions = Array.from(new Set(data.map(d => d.emotion)));

    return (
        <div className="comprehensive-feature-table" style={{
            overflowX: 'auto',
            background: isDark ? '#1e1e1e' : '#ffffff',
            borderRadius: '8px',
            padding: '16px'
        }}>
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
            <h4 style={{ color: textColor, marginBottom: '12px' }}>
                Comprehensive Feature Summary — Study {studyNumber}
            </h4>
            <p style={{ color: textColor, opacity: 0.7, fontSize: '12px', marginBottom: '12px' }}>
                {data.length} rows ({uniqueSubjects.length} subjects × {uniqueEmotions.length} emotions) • {featureColumns.length} features across {fftFeatures.length} signals
            </p>

            <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '11px',
                    color: textColor,
                    minWidth: `${200 + featureColumns.length * 80}px`
                }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                        <tr style={{ borderBottom: `2px solid ${gridColor}`, background: isDark ? '#1e1e1e' : '#ffffff' }}>
                            <th style={{
                                textAlign: 'left',
                                padding: '8px',
                                position: 'sticky',
                                left: 0,
                                background: isDark ? '#1e1e1e' : '#ffffff',
                                zIndex: 3
                            }}>
                                Subject
                            </th>
                            <th style={{
                                textAlign: 'left',
                                padding: '8px',
                                position: 'sticky',
                                left: '60px',
                                background: isDark ? '#1e1e1e' : '#ffffff',
                                zIndex: 3
                            }}>
                                Emotion
                            </th>
                            {featureColumns.map(col => (
                                <th key={col} style={{
                                    textAlign: 'right',
                                    padding: '6px 8px',
                                    whiteSpace: 'nowrap',
                                    background: isDark ? '#1e1e1e' : '#ffffff'
                                }}>
                                    {formatHeader(col)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr
                                key={`${row.subjectId}-${row.emotion}`}
                                style={{
                                    borderBottom: `1px solid ${gridColor}`,
                                    backgroundColor: i % 2 === 0
                                        ? (isDark ? '#2a2a2a' : '#f9fafb')
                                        : (isDark ? '#1e1e1e' : '#ffffff')
                                }}
                            >
                                <td style={{
                                    padding: '6px 8px',
                                    position: 'sticky',
                                    left: 0,
                                    background: i % 2 === 0
                                        ? (isDark ? '#2a2a2a' : '#f9fafb')
                                        : (isDark ? '#1e1e1e' : '#ffffff'),
                                    zIndex: 1,
                                    fontWeight: 500
                                }}>
                                    {row.subjectId}
                                </td>
                                <td style={{
                                    padding: '6px 8px',
                                    position: 'sticky',
                                    left: '60px',
                                    background: i % 2 === 0
                                        ? (isDark ? '#2a2a2a' : '#f9fafb')
                                        : (isDark ? '#1e1e1e' : '#ffffff'),
                                    zIndex: 1
                                }}>
                                    <span style={{
                                        display: 'inline-block',
                                        width: '10px',
                                        height: '10px',
                                        backgroundColor: row.color,
                                        marginRight: '6px',
                                        borderRadius: '2px'
                                    }}></span>
                                    {row.emotion}
                                </td>
                                {featureColumns.map(col => (
                                    <td key={col} style={{ textAlign: 'right', padding: '6px 8px' }}>
                                        {formatValue(col, row.features[col])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {onGeneratePCA && featureColumns.length >= 2 && data.length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ color: textColor, fontSize: '12px', opacity: 0.7 }}>
                        {data.length} data points × {featureColumns.length} features
                    </span>
                    <button
                        disabled={loadingPCA}
                        onClick={async () => {
                            setLoadingPCA(true);
                            setError(null);
                            const vizUrl = process.env.REACT_APP_VIZ_URL || 'http://localhost:8000/viz';

                            try {
                                // Check PCA cache first
                                const pcaCacheKey = getCacheKey(studyNumber, fftFeatures, subjectIds);
                                const cachedPCA = pcaCache.get(pcaCacheKey);

                                let pcaResult: FrequencyPCAResponse;

                                if (cachedPCA && (Date.now() - cachedPCA.timestamp) < CACHE_DURATION_MS) {
                                    pcaResult = cachedPCA.result;
                                } else {
                                    const featuresParam = fftFeatures.join(',');
                                    const subjectsParam = subjectIds.join(',');

                                    const response = await fetch(
                                        `${vizUrl}/pca/frequency/${studyNumber}?features=${featuresParam}&subject_ids=${subjectsParam}`
                                    );

                                    if (!response.ok) {
                                        throw new Error(`HTTP error! status: ${response.status}`);
                                    }

                                    pcaResult = await response.json();

                                    pcaCache.set(pcaCacheKey, {
                                        result: pcaResult,
                                        timestamp: Date.now()
                                    });
                                }

                                if (!pcaResult.data_points || !Array.isArray(pcaResult.data_points)) {
                                    throw new Error('Invalid PCA response: data_points not found');
                                }

                                const dataWithPCA: SubjectEmotionFeatureRow[] = pcaResult.data_points.map(item => {
                                    // Find matching row to get feature values
                                    const matchingRow = data.find(
                                        d => d.subjectId === item.subject_id && d.emotion === item.emotion
                                    );
                                    return {
                                        subjectId: item.subject_id,
                                        emotion: item.emotion,
                                        color: item.color,
                                        features: matchingRow?.features || {},
                                        pc1: item.pc1,
                                        pc2: item.pc2
                                    };
                                });

                                onGeneratePCA(featureColumns, dataWithPCA, pcaResult.variance_explained);
                            } catch (err) {
                                console.error('PCA generation failed:', err);
                                setError(err instanceof Error ? err.message : 'Failed to generate PCA');
                            } finally {
                                setLoadingPCA(false);
                            }
                        }}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: `2px solid ${isDark ? '#3b82f6' : '#2563eb'}`,
                            background: loadingPCA ? (isDark ? '#4b5563' : '#9ca3af') : (isDark ? '#3b82f6' : '#2563eb'),
                            color: '#fff',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            cursor: loadingPCA ? 'wait' : 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {loadingPCA && (
                            <span style={{
                                display: 'inline-block',
                                width: '14px',
                                height: '14px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: '#fff',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite'
                            }} />
                        )}
                        {loadingPCA ? 'Generating PCA...' : `Generate PCA from ${featureColumns.length} Features`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default FeatureAnalysisChart;
