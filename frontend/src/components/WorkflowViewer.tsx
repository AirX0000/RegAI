import React, { useState } from 'react';
import { Check, ChevronRight, ChevronDown } from 'lucide-react';

interface WorkflowStep {
    step: number;
    title: string;
    description: string;
    checklist: string[];
}

interface WorkflowViewerProps {
    steps: WorkflowStep[];
    title?: string;
}

export const WorkflowViewer: React.FC<WorkflowViewerProps> = ({ steps, title }) => {
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]));
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

    const toggleStep = (stepNumber: number) => {
        const newExpanded = new Set(expandedSteps);
        if (newExpanded.has(stepNumber)) {
            newExpanded.delete(stepNumber);
        } else {
            newExpanded.add(stepNumber);
        }
        setExpandedSteps(newExpanded);
    };

    const toggleChecklistItem = (stepNumber: number, itemIndex: number) => {
        const key = `${stepNumber}-${itemIndex}`;
        const newChecked = new Set(checkedItems);
        if (newChecked.has(key)) {
            newChecked.delete(key);
        } else {
            newChecked.add(key);
        }
        setCheckedItems(newChecked);
    };

    const isStepComplete = (step: WorkflowStep) => {
        return step.checklist.every((_, index) =>
            checkedItems.has(`${step.step}-${index}`)
        );
    };

    const getProgress = () => {
        const completedSteps = steps.filter(isStepComplete).length;
        return Math.round((completedSteps / steps.length) * 100);
    };

    return (
        <div className="workflow-viewer bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {title && (
                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${getProgress()}%` }}
                            />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            {getProgress()}%
                        </span>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {steps.map((step) => {
                    const isExpanded = expandedSteps.has(step.step);
                    const isComplete = isStepComplete(step);

                    return (
                        <div
                            key={step.step}
                            className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:border-blue-300"
                        >
                            {/* Step Header */}
                            <button
                                onClick={() => toggleStep(step.step)}
                                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isComplete
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {isComplete ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <span className="font-semibold">{step.step}</span>
                                    )}
                                </div>

                                <div className="flex-1 text-left">
                                    <h4 className="font-semibold text-gray-900">{step.title}</h4>
                                    <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">
                                        {step.checklist.filter((_, i) => checkedItems.has(`${step.step}-${i}`)).length}/{step.checklist.length}
                                    </span>
                                    {isExpanded ? (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </button>

                            {/* Step Content */}
                            {isExpanded && (
                                <div className="p-4 bg-white border-t border-gray-200">
                                    <div className="space-y-2">
                                        {step.checklist.map((item, index) => {
                                            const itemKey = `${step.step}-${index}`;
                                            const isChecked = checkedItems.has(itemKey);

                                            return (
                                                <label
                                                    key={index}
                                                    className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleChecklistItem(step.step, index)}
                                                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <span className={`flex-1 text-sm ${isChecked
                                                        ? 'text-gray-500 line-through'
                                                        : 'text-gray-700'
                                                        }`}>
                                                        {item}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-blue-900">
                            Progress: {steps.filter(isStepComplete).length} of {steps.length} steps completed
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                            {checkedItems.size} of {steps.reduce((sum, s) => sum + s.checklist.length, 0)} items checked
                        </p>
                    </div>
                    {getProgress() === 100 && (
                        <div className="flex items-center gap-2 text-emerald-700">
                            <Check className="w-5 h-5" />
                            <span className="text-sm font-semibold">Complete!</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkflowViewer;
