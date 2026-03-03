import React from 'react';
import { Check } from 'lucide-react';

const StepProgress = ({ currentStep, steps }) => {
    return (
        <div className="step-progress">
            {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isCompleted = currentStep > stepNumber;
                const isActive = currentStep === stepNumber;

                return (
                    <React.Fragment key={step}>
                        <div className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                            <div className="step-number">
                                {isCompleted ? <Check size={16} /> : stepNumber}
                            </div>
                            <span className="step-label">{step}</span>
                        </div>
                        {index < steps.length - 1 && <div className={`step-divider ${isCompleted ? 'completed' : ''}`} />}
                    </React.Fragment>
                );
            })}

            <style dangerouslySetInnerHTML={{
                __html: `
        .step-progress {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 40px;
          padding: 0 40px;
        }

        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: white;
          border: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          color: #94a3b8;
          transition: var(--transition);
        }

        .step-item.active .step-number {
          border-color: var(--primary);
          color: var(--primary);
          box-shadow: 0 0 0 4px var(--primary-light);
        }

        .step-item.completed .step-number {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .step-label {
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          white-space: nowrap;
        }

        .step-item.active .step-label {
          color: var(--text-main);
          font-weight: 600;
        }

        .step-item.completed .step-label {
          color: var(--primary);
        }

        .step-divider {
          flex: 1;
          height: 2px;
          background: #e2e8f0;
          margin: 0 12px;
          margin-bottom: 24px;
          transition: var(--transition);
        }

        .step-divider.completed {
          background: var(--primary);
        }
      ` }} />
        </div>
    );
};

export default StepProgress;
