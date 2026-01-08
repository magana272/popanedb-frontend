import React, { memo, useCallback } from 'react';
import { STUDY_INFO, StudyMetadata } from '../../types/popane';
import { Card } from '../ui';
import './StudySelector.css';

interface StudySelectorProps {
    selectedStudy: number | null;
    onStudySelect: (studyNumber: number) => void;
}

const StudyCard = memo(function StudyCard({
    study,
    isSelected,
    onSelect,
}: {
    study: StudyMetadata;
    isSelected: boolean;
    onSelect: (studyNumber: number) => void;
}): React.JSX.Element {
    const handleClick = useCallback(() => {
        onSelect(study.studyNumber);
    }, [study.studyNumber, onSelect]);

    return (
        <Card
            selected={isSelected}
            onClick={handleClick}
            className="study-card"
        >
            <h3>{study.name}</h3>
            <p className="study-description">{study.description}</p>
            <div className="study-columns">
                <span className="column-count">
                    {study.columns.length} measurements
                </span>
                <div className="column-tags">
                    {study.columns.slice(0, 5).map((col) => (
                        <span key={col} className="column-tag">{col}</span>
                    ))}
                    {study.columns.length > 5 && (
                        <span className="column-tag more">+{study.columns.length - 5}</span>
                    )}
                </div>
            </div>
        </Card>
    );
});

const StudySelector = memo(function StudySelector({
    selectedStudy,
    onStudySelect,
}: StudySelectorProps): React.JSX.Element {
    return (
        <div className="study-selector">
            <h2>Select a Study</h2>
            <div className="study-grid">
                {STUDY_INFO.map((study: StudyMetadata) => (
                    <StudyCard
                        key={study.studyNumber}
                        study={study}
                        isSelected={selectedStudy === study.studyNumber}
                        onSelect={onStudySelect}
                    />
                ))}
            </div>
        </div>
    );
});

export default StudySelector;
