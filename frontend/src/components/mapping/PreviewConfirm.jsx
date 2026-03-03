import React from 'react';
import { Users, FileText, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

const PreviewConfirm = ({ data }) => {
    return (
        <div className="step-content">
            <div className="summary-card animate-fade-in">
                <div className="summary-section">
                    <div className="section-header">
                        <Users size={20} />
                        <h3>Target Audience</h3>
                    </div>
                    <div className="section-body">
                        <div className="summary-item">
                            <span className="summary-label">User Type</span>
                            <span className="summary-value">{data.userType}</span>
                        </div>
                        {data.userType === 'School' && (
                            <>
                                <div className="summary-item">
                                    <span className="summary-label">Grades</span>
                                    <span className="summary-value">
                                        {data.gradeIds.length > 0 ? data.gradeIds.join(', ') : 'All Grades'}
                                    </span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">School ID</span>
                                    <span className="summary-value">{data.schoolId || 'All Schools'}</span>
                                </div>
                            </>
                        )}
                        <div className="summary-item highlight">
                            <span className="summary-label">Total Users Affected</span>
                            <span className="summary-value">{data.affectedUsersCount} users</span>
                        </div>
                    </div>
                </div>

                <div className="summary-section">
                    <div className="section-header">
                        <FileText size={20} />
                        <h3>Assets to Assign</h3>
                    </div>
                    <div className="section-body">
                        <div className="selected-assets-list">
                            {data.selectedAssets.length > 0 ? (
                                data.selectedAssets.map(asset => (
                                    <div key={`${asset.type}-${asset.id}`} className="summary-asset-item">
                                        <span className="summary-asset-type">{asset.type}</span>
                                        <span className="summary-asset-name">{asset.title || asset.name}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="no-assets-warning">
                                    <AlertCircle size={16} />
                                    <span>No assets selected</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="summary-section">
                    <div className="section-header">
                        <Calendar size={20} />
                        <h3>Assignment Rules</h3>
                    </div>
                    <div className="section-body">
                        <div className="summary-item">
                            <span className="summary-label">Access Type</span>
                            <span className="summary-value" style={{ textTransform: 'capitalize' }}>
                                {data.accessType.replace('-', ' ')}
                            </span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Assignment Mode</span>
                            <span className="summary-value" style={{ textTransform: 'capitalize' }}>
                                {data.assignmentMode.replace('-', ' ')}
                            </span>
                        </div>
                        {(data.startDate || data.expiryDate) && (
                            <>
                                {data.startDate && (
                                    <div className="summary-item">
                                        <span className="summary-label">Starts At</span>
                                        <span className="summary-value">{data.startDate}</span>
                                    </div>
                                )}
                                {data.expiryDate && (
                                    <div className="summary-item">
                                        <span className="summary-label">Expires At</span>
                                        <span className="summary-value">{data.expiryDate}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="confirmation-notice">
                <CheckCircle2 size={18} />
                <p>Review the summary above. Once confirmed, access will be granted to the specified users immediately or as scheduled.</p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .summary-card {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 24px;
          background: #f8fafc;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 32px;
          margin-bottom: 32px;
        }

        .summary-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--primary);
        }

        .section-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-main);
        }

        .section-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .summary-item.highlight {
          margin-top: 8px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
        }

        .summary-label {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .summary-value {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-main);
        }

        .highlight .summary-value {
          color: var(--primary);
          font-size: 18px;
        }

        .selected-assets-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
        }

        .summary-asset-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: white;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .summary-asset-type {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 6px;
          background: #f1f5f9;
          color: #64748b;
          border-radius: 4px;
        }

        .summary-asset-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .no-assets-warning {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--danger);
          font-size: 14px;
          font-weight: 500;
        }

        .confirmation-notice {
          display: flex;
          gap: 12px;
          padding: 20px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: var(--radius-md);
          color: #065f46;
          font-size: 14px;
          line-height: 1.5;
        }
      ` }} />
        </div>
    );
};

export default PreviewConfirm;
