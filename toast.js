// Toast Notification System for Drive Lead Media Portal

// Create toast container if it doesn't exist
function createToastContainer() {
    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
    return document.getElementById('toast-container');
}

// Show toast notification
function showToast(message, type = 'success', duration = 4000) {
    const container = createToastContainer();

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Set colors based on type
    const colors = {
        success: { bg: '#059669', icon: '✓' },
        error: { bg: '#dc2626', icon: '✕' },
        warning: { bg: '#f59e0b', icon: '⚠' },
        info: { bg: '#3b82f6', icon: 'ℹ' }
    };

    const color = colors[type] || colors.info;

    toast.style.cssText = `
        background: ${color.bg};
        color: white;
        padding: 14px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 280px;
        max-width: 400px;
        animation: slideIn 0.3s ease;
        font-size: 0.95rem;
        font-weight: 500;
    `;

    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${color.icon}</span>
        <span style="flex: 1;">${message}</span>
        <button onclick="this.parentElement.remove()" style="background: transparent; border: none; color: white; font-size: 1.2rem; cursor: pointer; padding: 0; margin-left: 8px;">×</button>
    `;

    container.appendChild(toast);

    // Add slide-in animation
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Auto-remove toast after duration
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Convenience methods
function showSuccess(message, duration) {
    showToast(message, 'success', duration);
}

function showError(message, duration) {
    showToast(message, 'error', duration);
}

function showWarning(message, duration) {
    showToast(message, 'warning', duration);
}

function showInfo(message, duration) {
    showToast(message, 'info', duration);
}
