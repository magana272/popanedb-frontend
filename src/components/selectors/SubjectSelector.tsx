import React, { memo, useCallback } from 'react';
import { SubjectInfo } from '../../types/popane';
import { Button } from '../ui';
import './SubjectSelector.css';

interface SubjectSelectorProps {
    subjects: SubjectInfo[];
    selectedSubjects: number[];
    onSubjectSelect: (subjectIds: number[]) => void;
    loading?: boolean;
    singleSelect?: boolean;
}

const SubjectCheckbox = memo(function SubjectCheckbox({
    subject,
    isSelected,
    onToggle,
    singleSelect = false,
}: {
    subject: SubjectInfo;
    isSelected: boolean;
    onToggle: (id: number, checked: boolean) => void;
    singleSelect?: boolean;
}): React.JSX.Element {
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onToggle(subject.id, e.target.checked);
        },
        [subject.id, onToggle]
    );

    return (
        <label className={`subject-checkbox ${isSelected ? 'selected' : ''}`}>
            <input
                type={singleSelect ? 'radio' : 'checkbox'}
                name={singleSelect ? 'subject-select' : undefined}
                checked={isSelected}
                onChange={handleChange}
            />
            <span className="subject-label">Subject {subject.id}</span>
            <span className="record-count">
                {subject.recordCount.toLocaleString()}
            </span>
        </label>
    );
});

const SubjectSelector = memo(function SubjectSelector({
    subjects,
    selectedSubjects,
    onSubjectSelect,
    loading = false,
    singleSelect = false,
}: SubjectSelectorProps): React.JSX.Element {
    const handleCheckboxChange = useCallback(
        (subjectId: number, checked: boolean) => {
            if (singleSelect) {
                // Single select mode - always replace selection
                onSubjectSelect(checked ? [subjectId] : []);
            } else {
                // Multi-select mode
                if (checked) {
                    onSubjectSelect([...selectedSubjects, subjectId]);
                } else {
                    onSubjectSelect(selectedSubjects.filter(id => id !== subjectId));
                }
            }
        },
        [selectedSubjects, onSubjectSelect, singleSelect]
    );

    const handleSelectAll = useCallback(() => {
        if (selectedSubjects.length === subjects.length) {
            onSubjectSelect([]);
        } else {
            onSubjectSelect(subjects.map(s => s.id));
        }
    }, [selectedSubjects.length, subjects, onSubjectSelect]);

    const handleSelectFirst = useCallback(
        (count: number) => {
            onSubjectSelect(subjects.slice(0, count).map(s => s.id));
        },
        [subjects, onSubjectSelect]
    );

    const handleClear = useCallback(() => {
        onSubjectSelect([]);
    }, [onSubjectSelect]);

    // Loading state
    if (loading) {
        return (
            <div className="subject-selector loading">
                <div className="loading-spinner" />
                <p>Loading subjects...</p>
            </div>
        );
    }

    const isAllSelected = selectedSubjects.length === subjects.length && subjects.length > 0;

    return (
        <div className="subject-selector">
            <h3>Select Subject{singleSelect ? '' : 's'}</h3>

            {!singleSelect && (
                <div className="quick-select">
                    <Button
                        size="small"
                        variant={isAllSelected ? 'primary' : 'secondary'}
                        onClick={handleSelectAll}
                    >
                        {isAllSelected ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button size="small" variant="secondary" onClick={() => handleSelectFirst(5)}>
                        First 5
                    </Button>
                    <Button size="small" variant="secondary" onClick={() => handleSelectFirst(10)}>
                        First 10
                    </Button>
                    <Button size="small" variant="ghost" onClick={handleClear}>
                        Clear
                    </Button>
                </div>
            )}

            <div className="subject-list-container">
                <div className="subject-checkboxes">
                    {subjects.map((subject) => (
                        <SubjectCheckbox
                            key={subject.id}
                            subject={subject}
                            isSelected={selectedSubjects.includes(subject.id)}
                            onToggle={handleCheckboxChange}
                            singleSelect={singleSelect}
                        />
                    ))}
                </div>
            </div>

            {subjects.length > 0 && (
                <p className="subject-count">
                    {selectedSubjects.length} of {subjects.length} subject{singleSelect ? '' : 's'} selected
                </p>
            )}
        </div>
    );
});

export default SubjectSelector;
