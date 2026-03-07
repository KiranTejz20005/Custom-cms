import React from 'react';
import { Edit2, Trash2, Calendar, Eye, AlertTriangle, CheckCircle } from 'lucide-react';

const MappingTable = ({ mappings, onEdit, onDelete, deletingId, assetType, hideActions }) => {
  const formatGradesDisplay = (gradeIds) => {
    const normalized = (Array.isArray(gradeIds) ? gradeIds : [gradeIds])
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));

    if (normalized.length === 0) return '';

    const uniqueSorted = [...new Set(normalized)].sort((a, b) => a - b);
    const isAllGrades = uniqueSorted.length >= 12 && uniqueSorted.every((value, index) => value === index + 1);

    return isAllGrades ? 'All Grades' : uniqueSorted.join(',');
  };

  const getCategoryDisplay = (mapping) => {
    if (!mapping) return '—';
    // Prefer actual course category (e.g. "Foundations"); never use content_type ("course") for Category column
    const preferredCategory =
      mapping.category_name ||
      mapping.content_category ||
      mapping.course_category ||
      mapping.category ||
      mapping.A_category ||
      (mapping.course && (mapping.course.category || mapping.course.A_category)) ||
      (mapping.content && (mapping.content.category || mapping.content.A_category));

    const normalized = String(preferredCategory || '').trim();
    if (normalized) return normalized;

    return '—';
  };

  const getDisplayId = (mapping) => {
    if (!mapping) return '—';

    const courseId = Number(mapping.course);
    if (Number.isFinite(courseId) && courseId > 0) {
      return courseId;
    }

    const contentIdNumber = Number(mapping.content_id);
    if (Number.isFinite(contentIdNumber) && String(mapping.content_id ?? '').trim() !== '') {
      return contentIdNumber;
    }

    const rowId = Number(mapping.id);
    if (Number.isFinite(rowId)) {
      return rowId;
    }

    return '—';
  };

  const getTypeClass = (mapping) => {
    const aliases = {
      course: 'course',
      courses: 'course',
      workshop: 'workshop',
      workshops: 'workshop',
      book: 'book',
      books: 'book',
      byte: 'byte',
      bytes: 'byte',
      category: 'category',
      categories: 'category',
    };

    const fromType = String(mapping?.content_type || '').trim().toLowerCase();
    if (aliases[fromType]) return aliases[fromType];

    const fromCategory = String(mapping?.category || '').trim().toLowerCase();
    if (aliases[fromCategory]) return aliases[fromCategory];

    return 'unknown';
  };

  const getStatusBadge = (mapping) => {
    const now = new Date();
    if (mapping.expires_at && new Date(mapping.expires_at) < now) {
      return <span className="badge badge-expired"><AlertTriangle size={12} /> Expired</span>;
    }
    if (mapping.starts_at && new Date(mapping.starts_at) > now) {
      return <span className="badge badge-scheduled"><Calendar size={12} /> Scheduled</span>;
    }
    return <span className="badge badge-active"><CheckCircle size={12} /> Active</span>;
  };

  const getAudienceDisplay = (m) => {
    if (!m) return 'Public';

    let text = '';
    if (m.type === 'school') {
      text = 'School Assignment';
    } else {
      text = m.subscription_type ? (m.subscription_type.charAt(0).toUpperCase() + m.subscription_type.slice(1)) : 'All Users';
    }

    if (m.grade_ids && m.grade_ids.length > 0) {
      const gradesText = formatGradesDisplay(m.grade_ids);
      if (gradesText) {
        text += gradesText === 'All Grades' ? ' • All Grades' : ` • Grades ${gradesText}`;
      }
    }

    // Check both school and school_id for compatibility
    const schoolVal = m.school_id || m.school;
    if (schoolVal && schoolVal !== 0) {
      text += ` • School ${typeof schoolVal === 'object' ? (schoolVal.name || schoolVal.id) : schoolVal}`;
    }

    return text;
  };

  const isWorkshop = assetType === 'workshop';
  const idLabel = isWorkshop ? 'Workshop ID' : 'Course ID';
  const titleLabel = isWorkshop ? 'Workshop Title' : 'Course Title';

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ textTransform: 'none' }}>{idLabel}</th>
            <th style={{ textTransform: 'none' }}>{titleLabel}</th>
            <th style={{ textTransform: 'none' }}>Category</th>
            <th style={{ textTransform: 'none' }}>Grades</th>
            <th style={{ textTransform: 'uppercase' }}>USERS</th>
            <th style={{ textTransform: 'uppercase' }}>STATUS</th>
            {!hideActions && <th className="actions-cell" style={{ textTransform: 'uppercase' }}>ACTIONS</th>}
          </tr>
        </thead>
        <tbody>
          {mappings.length > 0 ? (
            mappings.map((m) => (
              <tr key={m.id}>
                <td className="asset-id-cell">
                  <span style={{ color: '#3b82f6', fontWeight: '500' }}>#{getDisplayId(m)}</span>
                </td>
                <td className="asset-title-cell">
                  <span style={{ color: '#3b82f6', fontWeight: '500' }}>{m.content_title || 'Untitled'}</span>
                </td>
                <td>
                  <span style={{ color: '#3b82f6', fontWeight: '500' }}>{getCategoryDisplay(m)}</span>
                </td>
                <td className="grades-cell" style={{ color: '#1e293b', fontWeight: '500' }}>
                  {formatGradesDisplay(m.grade_ids) || '—'}
                </td>
                <td className="user-count-cell">
                  <span style={{ color: '#3b82f6', fontWeight: '500' }}>{m.user_count || 0}</span>
                </td>
                <td>
                  {getStatusBadge(m)}
                </td>
                {!hideActions && (
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button className="icon-btn edit" title="Edit" onClick={() => onEdit(getDisplayId(m))} disabled={deletingId === m.id}>
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="icon-btn delete"
                        title="Delete"
                        onClick={() => onDelete(m)}
                        disabled={deletingId === m.id}
                      >
                        <Trash2 size={16} className={deletingId === m.id ? 'spinning' : ''} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="empty-row">
                <div className="empty-state">
                  <Eye size={40} className="empty-icon" />
                  <h3>No mappings found</h3>
                  <p>Try adjusting your search or filters to see more results.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <style dangerouslySetInnerHTML={{
        __html: `
        .table-container {
          overflow-x: auto;
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .data-table th {
          padding: 16px 24px;
          background: #f8fafc;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border-color);
        }

        .data-table td {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }

        .data-table tr:hover {
          background: #fefeff;
        }

        .asset-cell {
          min-width: 250px;
        }

        .asset-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .asset-name {
          font-weight: 600;
          color: var(--text-main);
          font-size: 15px;
        }

        .asset-id {
          font-size: 12px;
          color: var(--text-muted);
        }

        .type-tag {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .category-stack {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: flex-start;
        }

        .subject-tag {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 999px;
          background: #f8fafc;
          color: #475569;
        }

        .tag-course { background: #eef2ff; color: #4f46e5; }
        .tag-workshop { background: #f3e8ff; color: #7c3aed; }
        .tag-book { background: #dcfce7; color: #166534; }
        .tag-byte { background: #fff7ed; color: #c2410c; }
        .tag-category { background: #f1f5f9; color: #475569; }
        .tag-unknown { background: #f1f5f9; color: #475569; }

        .audience-cell {
          font-size: 14px;
          max-width: 300px;
        }

        .text-muted { color: #64748b; }

        .count-pill {
          padding: 4px 12px;
          background: #f1f5f9;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-active { background: #d1fae5; color: #065f46; }
        .badge-scheduled { background: #fef3c7; color: #92400e; }
        .badge-expired { background: #fee2e2; color: #991b1b; }

        .actions-cell {
          width: 100px;
          text-align: right;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .icon-btn {
          padding: 8px;
          border-radius: 8px;
          background: transparent;
          color: #94a3b8;
          transition: var(--transition);
        }

        .icon-btn:hover {
          background: #f1f5f9;
        }

        .icon-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .icon-btn.edit:hover {
          color: var(--primary);
        }

        .icon-btn.delete:hover {
          color: var(--danger);
        }

        .empty-row {
          padding: 80px 0;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: var(--text-muted);
        }

        .empty-icon {
          color: #cbd5e1;
        }

        .empty-state h3 {
          margin: 0;
          color: var(--text-main);
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` }} />
    </div>
  );
};

export default MappingTable;
