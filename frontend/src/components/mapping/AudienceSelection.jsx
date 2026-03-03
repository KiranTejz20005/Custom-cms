import React, { useState, useEffect } from 'react';
import { Users, Info, ChevronDown } from 'lucide-react';
import { getGrades, getSchools, getUserCount } from '../../services/api';

const AudienceSelection = ({ data, updateData }) => {
    const [grades, setGrades] = useState([]);
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [gradesRes, schoolsRes] = await Promise.all([getGrades(), getSchools()]);
                setGrades(Array.isArray(gradesRes) ? gradesRes : (gradesRes.data || []));
                setSchools(Array.isArray(schoolsRes) ? schoolsRes : (schoolsRes.data || []));
            } catch (err) {
                console.error("Failed to load audience data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const [countLoading, setCountLoading] = useState(false);

    useEffect(() => {
        const updateCount = async () => {
            if (!data.userType) return;
            setCountLoading(true);
            try {
                // Normalize "School" -> "premium" for Xano if required by business logic
                const userGroup = data.userType.toLowerCase() === 'school' ? 'premium' : data.userType.toLowerCase();

                const res = await getUserCount({
                    user_type: userGroup,
                    grade_id: data.gradeIds.join(','),
                    school_id: data.schoolId
                });

                // res is now the direct JSON body because of the new client.js
                const count = typeof res === 'number' ? res : (res.count || res.affected_users || 0);
                updateData({ affectedUsersCount: count });
            } catch (err) {
                console.error("Failed to fetch user count", err);
            } finally {
                setCountLoading(false);
            }
        };
        updateCount();
    }, [data.userType, data.gradeIds, data.schoolId]);

    const userTypes = ["Premium", "Ultra", "Basic", "School", "All"];

    return (
        <div className="step-content">
            <div className="form-group animate-fade-in">
                <label>User Type</label>
                <div className="select-wrapper">
                    <select
                        value={data.userType}
                        onChange={(e) => updateData({ userType: e.target.value })}
                        className="form-select"
                    >
                        <option value="">Select User Type</option>
                        {userTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    <ChevronDown className="select-icon" size={18} />
                </div>
            </div>

            {data.userType === 'School' && (
                <>
                    <div className="form-row animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="form-group">
                            <label>Select Grade</label>
                            <div className="select-wrapper">
                                <select
                                    multiple
                                    value={data.gradeIds}
                                    onChange={(e) => {
                                        const values = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                                        updateData({ gradeIds: values });
                                    }}
                                    className="form-select multi-select"
                                >
                                    {grades.map(grade => (
                                        <option key={grade.id} value={grade.number}>{grade.label}</option>
                                    ))}
                                </select>
                            </div>
                            <p className="field-hint">Hold Ctrl/Cmd to select multiple</p>
                        </div>

                        <div className="form-group">
                            <label>Select School</label>
                            <div className="select-wrapper">
                                <select
                                    value={data.schoolId}
                                    onChange={(e) => updateData({ schoolId: parseInt(e.target.value) })}
                                    className="form-select"
                                >
                                    <option value="0">All Schools</option>
                                    {schools.map(school => (
                                        <option key={school.id} value={school.id}>{school.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="select-icon" size={18} />
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="count-display animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="count-icon">
                    <Users size={24} />
                </div>
                <div className="count-info">
                    <span className={`count-value ${countLoading ? 'pulse' : ''}`}>
                        {countLoading ? 'Calculating...' : (data.affectedUsersCount?.toLocaleString() || '0')}
                    </span>
                    <span className="count-label">users match this criteria</span>
                </div>
                <div className="info-tooltip" title="Estimated based on current active user directory">
                    <Info size={16} />
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .step-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-main);
        }

        .select-wrapper {
          position: relative;
        }

        .form-select {
          width: 100%;
          padding: 12px 16px;
          padding-right: 40px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: white;
          color: var(--text-main);
          font-size: 15px;
          appearance: none;
          transition: var(--transition);
        }

        .form-select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px var(--primary-light);
        }

        .multi-select {
          height: 120px;
          padding: 8px;
        }

        .select-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .field-hint {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .count-display {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          background: var(--primary-light);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(99, 102, 241, 0.2);
          margin-top: 12px;
        }

        .count-icon {
          width: 48px;
          height: 48px;
          background: var(--primary);
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .count-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .count-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--primary);
          line-height: 1;
        }

        .count-label {
          font-size: 14px;
          color: #6366f1;
          font-weight: 500;
        }

        .count-value.pulse {
          animation: countPulse 1.5s infinite;
          opacity: 0.6;
        }

        @keyframes countPulse {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
      ` }} />
        </div>
    );
};

export default AudienceSelection;
