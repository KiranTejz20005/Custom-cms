import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import config from '../../config/config';

const AdminDeleteModal = ({ isOpen, onClose, onConfirm, itemName, type = 'Course', title, actionText }) => {
    const [passkey, setPasskey] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        const correctPasskey = String(config.xano.adminPasskey || 'admin123').trim();
        if (passkey.trim() === correctPasskey) {
            onConfirm();
            setPasskey('');
            setError('');
        } else {
            setError('Invalid admin passkey');
            toast.error('Wrong password! Please try again.', {
                id: 'admin-passkey-error',
                duration: 3000,
            });
        }
    };

    return (
        <div className="admin-modal-overlay">
            <div className="admin-modal-container animate-fade-in">
                <div className="admin-modal-left">
                    <div className="warning-icon-wrapper">
                        <AlertTriangle size={48} color="#E11D48" />
                    </div>
                </div>
                <div className="admin-modal-right">
                    <div className="admin-modal-header">
                        <h3>{title || `Move ${type} to Bin`}</h3>
                        <button className="admin-close-btn" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>

                    <div className="admin-modal-content">
                        <p className="main-text">
                            {actionText ? `Are you sure you want to permanently delete ` : `Are you sure you want to move `}
                            <strong>"{itemName}"</strong> {actionText ? '?' : 'to Bin.'}
                        </p>
                        <p className="sub-text">
                            {actionText ? "This action cannot be undone. Please be certain." : `This will temporarily "UN-map" ${type}, you can undo this action from "Bin"`}
                        </p>

                        <div className={`passkey-input-group ${error ? 'has-error' : ''}`}>
                            <div className="passkey-label">
                                Enter admin passkey *
                            </div>
                            <input
                                type="password"
                                placeholder="******"
                                value={passkey}
                                onChange={(e) => {
                                    setPasskey(e.target.value);
                                    if (error) setError('');
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                            />
                        </div>
                        {error && <span className="error-message">{error}</span>}

                        <div className="admin-modal-actions">
                            <button className="discard-btn" onClick={onClose}>
                                Discard
                            </button>
                            <button className="confirm-btn" onClick={handleConfirm}>
                                {actionText || `Yes, move to Bin`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .admin-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    padding: 20px;
                }

                .admin-modal-container {
                    background: white;
                    width: 100%;
                    max-width: 650px;
                    border-radius: 12px;
                    display: flex;
                    overflow: hidden;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }

                .admin-modal-left {
                    background: #FFF1F1;
                    width: 140px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .warning-icon-wrapper {
                    padding: 20px;
                }

                .admin-modal-right {
                    flex: 1;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                }

                .admin-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .admin-modal-header h3 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 700;
                    color: #111827;
                }

                .admin-close-btn {
                    background: transparent;
                    border: none;
                    color: #374151;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                }

                .admin-close-btn:hover {
                    background: #F3F4F6;
                }

                .admin-modal-content {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .main-text {
                    font-size: 16px;
                    color: #374151;
                    margin: 0;
                    line-height: 1.5;
                }

                .sub-text {
                    font-size: 16px;
                    color: #111827;
                    margin: 0;
                    line-height: 1.5;
                }

                .passkey-input-group {
                    display: flex;
                    border: 1px solid #D1D5DB;
                    border-radius: 6px;
                    overflow: hidden;
                    margin-top: 8px;
                }

                .passkey-input-group.has-error {
                    border-color: #EF4444;
                }

                .passkey-label {
                    background: #F9FAFB;
                    padding: 10px 16px;
                    color: #6B7280;
                    font-size: 14px;
                    border-right: 1px solid #D1D5DB;
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                }

                .passkey-input-group input {
                    flex: 1;
                    border: none;
                    padding: 10px 16px;
                    font-size: 14px;
                    outline: none;
                }

                .error-message {
                    color: #EF4444;
                    font-size: 12px;
                    margin-top: -8px;
                }

                .admin-modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 12px;
                }

                .discard-btn {
                    padding: 10px 24px;
                    background: white;
                    border: 1px solid #D1D5DB;
                    border-radius: 6px;
                    color: #2563EB;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 15px;
                }

                .discard-btn:hover {
                    background: #F9FAFB;
                }

                .confirm-btn {
                    padding: 10px 24px;
                    background: #E11D48;
                    border: none;
                    border-radius: 6px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 15px;
                }

                .confirm-btn:hover {
                    background: #BE123C;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .animate-fade-in {
                    animation: fadeIn 0.2s ease-out forwards;
                }
                `
            }} />
        </div>
    );
};

export default AdminDeleteModal;
