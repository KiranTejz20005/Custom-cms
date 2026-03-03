import React from 'react';
import { Calendar, Info } from 'lucide-react';

const AssignmentRules = ({ data, updateData }) => {
    return (
        <div className="step-content">
            <div className="form-grid">
                <div className="form-group">
                    <label>Access Type</label>
                    <div className="select-wrapper">
                        <select
                            value={data.accessType}
                            onChange={(e) => updateData({ accessType: e.target.value })}
                            className="form-select"
                        >
                            <option value="immediate">Immediate Access</option>
                            <option value="scheduled">Scheduled Access</option>
                            <option value="temporary">Temporary Access</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Assignment Mode</label>
                    <div className="select-wrapper">
                        <select
                            value={data.assignmentMode}
                            onChange={(e) => updateData({ assignmentMode: e.target.value })}
                            className="form-select"
                        >
                            <option value="add">Add to Existing</option>
                            <option value="replace">Replace Existing</option>
                            <option value="remove">Remove Access</option>
                        </select>
                    </div>
                </div>

                {data.accessType === 'scheduled' && (
                    <div className="form-group animate-slide-in">
                        <label>Start Date</label>
                        <div className="input-wrapper">
                            <input
                                type="date"
                                value={data.startDate || ''}
                                onChange={(e) => updateData({ startDate: e.target.value })}
                                className="form-input"
                            />
                            <Calendar className="input-icon" size={18} />
                        </div>
                    </div>
                )}

                {(data.accessType === 'temporary' || data.accessType === 'scheduled') && (
                    <div className="form-group animate-slide-in">
                        <label>Expiry Date {data.accessType === 'scheduled' && '(Optional)'}</label>
                        <div className="input-wrapper">
                            <input
                                type="date"
                                value={data.expiryDate || ''}
                                onChange={(e) => updateData({ expiryDate: e.target.value })}
                                className="form-input"
                            />
                            <Calendar className="input-icon" size={18} />
                        </div>
                    </div>
                )}
            </div>

            <div className="form-group">
                <label>Admin Notes <span className="label-optional">(Optional)</span></label>
                <textarea
                    placeholder="Add any notes about this mapping..."
                    value={data.notes}
                    onChange={(e) => updateData({ notes: e.target.value })}
                    className="form-textarea"
                    maxLength={500}
                />
                <div className="textarea-footer">
                    <span className="char-count">{data.notes.length}/500 characters</span>
                </div>
            </div>

            <div className="rules-info">
                <Info size={18} className="info-icon" />
                <p>Assignment rules determine how and when users receive access to the selected assets.</p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .input-wrapper {
          position: relative;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          padding-right: 40px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: white;
          color: var(--text-main);
          font-size: 15px;
        }

        .form-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px var(--primary-light);
        }

        .input-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .label-optional {
          font-weight: 400;
          color: var(--text-muted);
          font-size: 13px;
        }

        .form-textarea {
          width: 100%;
          height: 120px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: white;
          color: var(--text-main);
          font-size: 15px;
          resize: none;
        }

        .form-textarea:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px var(--primary-light);
        }

        .textarea-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 4px;
        }

        .char-count {
          font-size: 12px;
          color: var(--text-muted);
        }

        .rules-info {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: #f1f5f9;
          border-radius: var(--radius-md);
          color: #475569;
          font-size: 14px;
        }

        .info-icon {
          color: #64748b;
          flex-shrink: 0;
        }
      ` }} />
        </div>
    );
};

export default AssignmentRules;
