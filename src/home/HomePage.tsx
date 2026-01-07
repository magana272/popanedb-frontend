import React, { useState, useEffect, useCallback } from 'react';
import Plot from 'react-plotly.js';
import {
    Header,
    StudySelector,
    SubjectSelector,
    DataTable,
    PhysiologyChart,
    EmotionChart,
    PCAChart,
    FeatureAnalysisChart,
    EmotionCountChart,
    FFTChart,
    ComprehensiveFeatureTable
} from '../components';
import { popaneApi } from '../services/popaneApi';
import { StudyData, SubjectInfo, STUDY_COLUMNS } from '../types/popane';
import { useTheme } from '../context/ThemeContext';
import './HomePage.css';

type ViewMode = 'table' | 'chart' | 'emotion' | 'pca' | 'signals' | 'features' | 'all';

interface FeaturePCAData {
    features: string[];
    points: Array<{
        subjectId: number;
        emotion: string;
        color: string;
        pc1: number;
        pc2: number;
    }>;
    variance: [number, number];
}

export default function HomePage() {
    const { isDark } = useTheme();
    const [selectedStudy, setSelectedStudy] = useState<number | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
    const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
    const [data, setData] = useState<StudyData[]>([]);
    const [loading, setLoading] = useState(false);
    const [subjectsLoading, setSubjectsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('emotion');
    const [error, setError] = useState<string | null>(null);
    const [featurePCAData, setFeaturePCAData] = useState<FeaturePCAData | null>(null);
    const [showComprehensiveTable, setShowComprehensiveTable] = useState(false);

    // Load subjects when study changes
    useEffect(() => {
        if (selectedStudy) {
            setSubjectsLoading(true);
            setSelectedSubjects([]);
            setData([]);
            setError(null);
            setShowComprehensiveTable(false);
            setFeaturePCAData(null);

            popaneApi.getSubjects(selectedStudy)
                .then(setSubjects)
                .catch(err => setError(`Failed to load subjects: ${err.message}`))
                .finally(() => setSubjectsLoading(false));
        } else {
            setSubjects([]);
            setSelectedSubjects([]);
            setData([]);
            setShowComprehensiveTable(false);
            setFeaturePCAData(null);
        }
    }, [selectedStudy]);

    const loadData = useCallback(async () => {
        if (!selectedStudy || selectedSubjects.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            // Calculate limit per subject to balance data load
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

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Reset feature table when subjects change
    useEffect(() => {
        setShowComprehensiveTable(false);
        setFeaturePCAData(null);
    }, [selectedSubjects]);

    const currentColumns = selectedStudy ? STUDY_COLUMNS[selectedStudy] : [];

    return (
        <div className="home-page">
            <Header subtitle="Emotion Database Explorer" />

            <main className="main-content">
                {error && (
                    <div className="error-banner">
                        <span>{error}</span>
                        <button onClick={() => setError(null)}>×</button>
                    </div>
                )}

                <section id="studies" className="section">
                    <StudySelector
                        selectedStudy={selectedStudy}
                        onStudySelect={setSelectedStudy}
                    />
                </section>

                {selectedStudy && (
                    <section className="section controls-section">
                        <div className="controls-row">
                            <SubjectSelector
                                subjects={subjects}
                                selectedSubjects={selectedSubjects}
                                onSubjectSelect={setSelectedSubjects}
                                loading={subjectsLoading}
                                singleSelect={viewMode === 'signals' || viewMode === 'features'}
                            />

                            <div className="view-controls">
                                <span>View Mode:</span>
                                <div className="view-buttons">
                                    <button
                                        className={viewMode === 'emotion' ? 'active' : ''}
                                        onClick={() => setViewMode('emotion')}
                                        title="Emotion distribution across subjects"
                                    >
                                        Emotion
                                    </button>
                                    <button
                                        className={viewMode === 'signals' ? 'active' : ''}
                                        onClick={() => {
                                            setViewMode('signals');
                                            // Keep only first subject when switching to signals mode
                                            if (selectedSubjects.length > 1) {
                                                setSelectedSubjects([selectedSubjects[0]]);
                                            }
                                        }}
                                        title="Emotion-colored signals (POPANEpy style)"
                                    >
                                        Signals
                                    </button>
                                    <button
                                        className={viewMode === 'pca' ? 'active' : ''}
                                        onClick={() => setViewMode('pca')}
                                        title="PCA analysis colored by emotion"
                                    >
                                        PCA
                                    </button>
                                    <button
                                        className={viewMode === 'features' ? 'active' : ''}
                                        onClick={() => {
                                            setViewMode('features');
                                            // Keep only first subject when switching to features mode
                                            if (selectedSubjects.length > 1) {
                                                setSelectedSubjects([selectedSubjects[0]]);
                                            }
                                        }}
                                        title="Time and frequency domain feature analysis"
                                    >
                                        Features
                                    </button>
                                    <button
                                        className={viewMode === 'chart' ? 'active' : ''}
                                        onClick={() => setViewMode('chart')}
                                        title="Standard chart view"
                                    >
                                        Chart
                                    </button>
                                    <button
                                        className={viewMode === 'table' ? 'active' : ''}
                                        onClick={() => setViewMode('table')}
                                        title="Data table view"
                                    >
                                        Table
                                    </button>
                                    <button
                                        className={viewMode === 'all' ? 'active' : ''}
                                        onClick={() => setViewMode('all')}
                                        title="Show all views"
                                    >
                                        All
                                    </button>
                                </div>
                            </div>

                            {selectedSubjects.length > 0 && (
                                <button className="refresh-btn" onClick={loadData} disabled={loading}>
                                    {loading ? 'Loading...' : 'Refresh Data'}
                                </button>
                            )}
                        </div>
                    </section>
                )}

                {selectedStudy && selectedSubjects.length > 0 && (
                    <div key={`viz-${selectedStudy}`}>
                        {/* Emotion Distribution Chart */}
                        {(viewMode === 'emotion' || viewMode === 'all') && (
                            <section id="emotion-viz" className="section">
                                <EmotionCountChart
                                    studyNumber={selectedStudy}
                                    subjectIds={selectedSubjects}
                                />
                            </section>
                        )}

                        {/* Emotion-Colored Signals (POPANEpy Style) */}
                        {(viewMode === 'signals' || viewMode === 'all') && (
                            <section id="signals-viz" className="section">
                                <EmotionChart
                                    studyNumber={selectedStudy}
                                    subjectId={selectedSubjects[0]}
                                    initialFeatures={['ECG', 'EDA', 'SBP']}
                                />
                            </section>
                        )}

                        {/* PCA Analysis */}
                        {(viewMode === 'pca' || viewMode === 'all') && (
                            <section id="pca-viz" className="section">
                                <PCAChart
                                    key={`pca-${selectedStudy}`}
                                    studyNumber={selectedStudy}
                                    subjectIds={selectedSubjects}
                                    initialFeatures={['ECG', 'EDA', 'SBP', 'DBP']}
                                />
                            </section>
                        )}

                        {/* Feature Analysis - Time and Frequency Domain */}
                        {(viewMode === 'features' || viewMode === 'all') && (
                            <section id="feature-analysis" className="section feature-section">
                                <div className="feature-section-header">
                                    <h2>Feature Analysis</h2>
                                    <p className="section-description">Time-domain and frequency-domain analysis of physiological signals</p>
                                </div>
                                <div className="feature-charts-container">
                                    <div className="feature-chart-card">
                                        <FeatureAnalysisChart
                                            studyNumber={selectedStudy}
                                            subjectId={selectedSubjects[0]}
                                            feature="ECG"
                                            samplingRate={1000}
                                            height={500}
                                        />
                                    </div>
                                    <div className="feature-chart-card">
                                        <h3>Frequency Spectrum Analysis</h3>
                                        <FFTChart
                                            studyNumber={selectedStudy}
                                            subjectId={selectedSubjects[0]}
                                            availableColumns={currentColumns}
                                            feature="ECG"
                                            maxFreq={2.0}
                                            height={400}
                                        />
                                    </div>

                                    <div className="feature-chart-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px' }}>
                                        <button
                                            onClick={() => setShowComprehensiveTable(true)}
                                            style={{
                                                padding: '12px 24px',
                                                backgroundColor: isDark ? '#3b82f6' : '#2563eb',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = isDark ? '#2563eb' : '#1d4ed8'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = isDark ? '#3b82f6' : '#2563eb'}
                                        >
                                            Generate Features for All Subjects in Study ({subjects.length})
                                        </button>
                                        <p style={{
                                            marginTop: '8px',
                                            fontSize: '0.875rem',
                                            color: isDark ? '#94a3b8' : '#64748b'
                                        }}>
                                            Click to compute time-domain, frequency-domain, and HRV features for all {subjects.length} subjects in Study {selectedStudy}
                                        </p>
                                    </div>

                                    {showComprehensiveTable && (
                                        <div className="feature-chart-card" style={{ gridColumn: '1 / -1' }}>
                                            <h3>Comprehensive Feature Summary</h3>
                                            <ComprehensiveFeatureTable
                                                studyNumber={selectedStudy}
                                                subjectIds={subjects.map(s => s.id)}
                                                availableColumns={currentColumns}
                                                onGeneratePCA={(features, tableData, variance) => {
                                                    if (tableData.length > 0) {
                                                        const pcaPoints = tableData.map(d => ({
                                                            subjectId: d.subjectId,
                                                            emotion: d.emotion,
                                                            color: d.color,
                                                            pc1: d.pc1 ?? 0,
                                                            pc2: d.pc2 ?? 0
                                                        }));
                                                        setFeaturePCAData({
                                                            features,
                                                            points: pcaPoints,
                                                            variance: variance ?? [50, 50]
                                                        });
                                                    }
                                                }}
                                            />                                            {featurePCAData && (
                                                <div style={{ marginTop: '24px' }}>
                                                    <h4 style={{
                                                        margin: '0 0 16px 0',
                                                        color: isDark ? '#f1f5f9' : '#1e293b',
                                                        fontSize: '1rem'
                                                    }}>
                                                        PCA from Engineered Features
                                                    </h4>
                                                    <Plot
                                                        data={(() => {
                                                            // Group points by emotion for legend
                                                            const emotionGroups = new Map<string, typeof featurePCAData.points>();
                                                            featurePCAData.points.forEach(p => {
                                                                if (!emotionGroups.has(p.emotion)) {
                                                                    emotionGroups.set(p.emotion, []);
                                                                }
                                                                emotionGroups.get(p.emotion)!.push(p);
                                                            });

                                                            return Array.from(emotionGroups.entries()).map(([emotion, points]) => ({
                                                                type: 'scatter' as const,
                                                                mode: 'markers' as const,
                                                                name: emotion,
                                                                x: points.map(p => p.pc1),
                                                                y: points.map(p => p.pc2),
                                                                text: points.map(p => `Subject ${p.subjectId}<br>${p.emotion}`),
                                                                hovertemplate: '%{text}<br>PC1: %{x:.3f}<br>PC2: %{y:.3f}<extra></extra>',
                                                                marker: {
                                                                    color: points[0].color,
                                                                    size: 12,
                                                                    opacity: 0.8,
                                                                    line: {
                                                                        color: isDark ? '#1e293b' : '#fff',
                                                                        width: 1
                                                                    }
                                                                }
                                                            }));
                                                        })()}
                                                        layout={{
                                                            title: { text: `PCA from ${featurePCAData.features.length} Features` },
                                                            xaxis: {
                                                                title: { text: `PC1 (${featurePCAData.variance[0].toFixed(1)}% var)` },
                                                                gridcolor: isDark ? '#334155' : '#e2e8f0',
                                                                zerolinecolor: isDark ? '#475569' : '#cbd5e1',
                                                                color: isDark ? '#94a3b8' : '#64748b'
                                                            },
                                                            yaxis: {
                                                                title: { text: `PC2 (${featurePCAData.variance[1].toFixed(1)}% var)` },
                                                                gridcolor: isDark ? '#334155' : '#e2e8f0',
                                                                zerolinecolor: isDark ? '#475569' : '#cbd5e1',
                                                                color: isDark ? '#94a3b8' : '#64748b'
                                                            },
                                                            paper_bgcolor: 'transparent',
                                                            plot_bgcolor: isDark ? '#1e293b' : '#f8fafc',
                                                            font: { color: isDark ? '#f1f5f9' : '#1e293b' },
                                                            showlegend: true,
                                                            legend: {
                                                                orientation: 'h',
                                                                y: -0.15,
                                                                x: 0.5,
                                                                xanchor: 'center'
                                                            },
                                                            margin: { t: 50, r: 30, b: 80, l: 60 },
                                                            height: 450
                                                        }}
                                                        config={{
                                                            responsive: true,
                                                            displayModeBar: true,
                                                            modeBarButtonsToRemove: ['lasso2d', 'select2d']
                                                        }}
                                                        style={{ width: '100%' }}
                                                    />
                                                    <p style={{
                                                        fontSize: '12px',
                                                        color: isDark ? '#94a3b8' : '#64748b',
                                                        marginTop: '8px',
                                                        textAlign: 'center'
                                                    }}>
                                                        Features used: {featurePCAData.features.slice(0, 8).join(', ')}
                                                        {featurePCAData.features.length > 8 && ` (+${featurePCAData.features.length - 8} more)`}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Standard Chart */}
                        {(viewMode === 'chart' || viewMode === 'all') && (
                            <section id="visualization" className="section">
                                <PhysiologyChart
                                    data={data}
                                    columns={currentColumns}
                                    title={`Study ${selectedStudy} - ${selectedSubjects.length} Subject${selectedSubjects.length > 1 ? 's' : ''}`}
                                />
                            </section>
                        )}

                        {/* Data Table */}
                        {(viewMode === 'table' || viewMode === 'all') && (
                            <section id="data" className="section">
                                <DataTable
                                    data={data}
                                    columns={currentColumns}
                                    loading={loading}
                                />
                            </section>
                        )}
                    </div>
                )}

                {selectedStudy && selectedSubjects.length === 0 && (
                    <div className="placeholder-message">
                        <p>Select one or more subjects to view their physiological data</p>
                    </div>
                )}
            </main>

            <footer className="app-footer">
                <div className="footer-content">
                    <div className="footer-about">
                        <p>
                            POPANEdb is a comprehensive physiological database for emotion research,
                            featuring ECG, EDA, blood pressure, and other biosignals.
                        </p>
                    </div>
                    <div className="footer-citation">
                        <span className="citation-label">Cite:</span>
                        <em>"POPANE: A Physiological Open-source Platform for Affective Neuroscience and Emotion Research"</em>
                    </div>
                    <p className="copyright">© 2026 POPANEdb</p>
                </div>
            </footer>
        </div>
    );
}



