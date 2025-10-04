// Form Validation Utilities for Drive Lead Media Portal

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Phone validation (US format)
function isValidPhone(phone) {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    // Check if it's 10 or 11 digits (with country code)
    return cleaned.length === 10 || cleaned.length === 11;
}

// URL validation
function isValidURL(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
}

// Validate and show error for input field
function validateField(inputElement, validationFn, errorMessage) {
    const value = inputElement.value.trim();

    if (!value) {
        // Empty field - remove any error styling
        inputElement.classList.remove('input-error');
        const existingError = inputElement.parentElement.querySelector('.validation-error');
        if (existingError) existingError.remove();
        return true; // Empty is OK unless field is required
    }

    if (!validationFn(value)) {
        // Invalid - show error
        inputElement.classList.add('input-error');

        // Remove existing error message if present
        const existingError = inputElement.parentElement.querySelector('.validation-error');
        if (existingError) existingError.remove();

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error';
        errorDiv.textContent = errorMessage;
        errorDiv.style.color = '#dc2626';
        errorDiv.style.fontSize = '0.85rem';
        errorDiv.style.marginTop = '4px';
        inputElement.parentElement.appendChild(errorDiv);

        return false;
    } else {
        // Valid - remove error
        inputElement.classList.remove('input-error');
        const existingError = inputElement.parentElement.querySelector('.validation-error');
        if (existingError) existingError.remove();
        return true;
    }
}

// Add validation CSS class
function addValidationStyles() {
    if (!document.getElementById('validation-styles')) {
        const style = document.createElement('style');
        style.id = 'validation-styles';
        style.textContent = `
            .input-error {
                border-color: #dc2626 !important;
                background-color: #fef2f2 !important;
            }
            .validation-error {
                color: #dc2626;
                font-size: 0.85rem;
                margin-top: 4px;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize validation styles on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addValidationStyles);
} else {
    addValidationStyles();
}

// Format phone number as user types
function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');

    if (value.length <= 3) {
        input.value = value;
    } else if (value.length <= 6) {
        input.value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    } else if (value.length <= 10) {
        input.value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
    } else {
        input.value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
    }
}
