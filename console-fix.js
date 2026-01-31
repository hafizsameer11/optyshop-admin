/**
 * CONSOLE FIX FOR LENS OPTIONS NO-REFRESH ISSUE
 * 
 * Copy and paste this entire code block into your browser console
 * when on the Lens Options page to apply the ultimate fix.
 */

// 1. Override any potential form submission interference
const originalSubmit = HTMLFormElement.prototype.submit;
HTMLFormElement.prototype.submit = function() {
    console.log('🚫 Form submission blocked - Lens Options fix active');
    return false;
};

// 2. Prevent any browser navigation during form operations
let navigationBlocked = false;
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
    if (navigationBlocked) {
        console.log('🚫 Navigation blocked during Lens Options operation');
        return;
    }
    return originalPushState.apply(this, args);
};

history.replaceState = function(...args) {
    if (navigationBlocked) {
        console.log('🚫 Navigation blocked during Lens Options operation');
        return;
    }
    return originalReplaceState.apply(this, args);
};

// 3. Block window.location changes
const originalLocationAssign = window.location.assign;
const originalLocationReplace = window.location.replace;
const originalLocationHref = window.location;

Object.defineProperty(window.location, 'href', {
    get() {
        return originalLocationHref.href;
    },
    set(value) {
        if (navigationBlocked) {
            console.log('🚫 Location change blocked during Lens Options operation');
            return;
        }
        originalLocationHref.href = value;
    }
});

window.location.assign = function(url) {
    if (navigationBlocked) {
        console.log('🚫 Location assign blocked during Lens Options operation');
        return;
    }
    return originalLocationAssign.call(this, url);
};

window.location.replace = function(url) {
    if (navigationBlocked) {
        console.log('🚫 Location replace blocked during Lens Options operation');
        return;
    }
    return originalLocationReplace.call(this, url);
};

// 4. Monitor and prevent any form submissions globally
document.addEventListener('submit', function(e) {
    const form = e.target;
    const isModalForm = form.closest('.fixed') || form.closest('[role="dialog"]');
    
    if (isModalForm) {
        console.log('🚫 Modal form submission prevented - Lens Options fix');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    }
}, true);

// 5. Monitor button clicks that might trigger navigation
document.addEventListener('click', function(e) {
    const button = e.target.closest('button');
    const link = e.target.closest('a');
    
    if (button && navigationBlocked) {
        console.log('🚫 Button click monitored during Lens Options operation');
    }
    
    if (link && navigationBlocked) {
        console.log('🚫 Link click blocked during Lens Options operation');
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}, true);

// 6. Helper function to enable/disable navigation blocking
window.setNavigationBlocked = function(blocked) {
    navigationBlocked = blocked;
    console.log(`🔧 Navigation blocking ${blocked ? 'ENABLED' : 'DISABLED'}`);
};

// 7. Auto-enable blocking when modal opens
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
                // Check if a modal was added
                const modal = node.querySelector ? node.querySelector('.fixed.inset-0') : null;
                const isModal = node.classList && node.classList.contains('fixed') && node.classList.contains('inset-0');
                
                if (modal || isModal) {
                    console.log('🔧 Modal detected - enabling navigation protection');
                    setNavigationBlocked(true);
                }
            }
        });
        
        mutation.removedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
                // Check if a modal was removed
                const wasModal = node.classList && node.classList.contains('fixed') && node.classList.contains('inset-0');
                
                if (wasModal) {
                    console.log('🔧 Modal closed - disabling navigation protection');
                    setNavigationBlocked(false);
                }
            }
        });
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('✅ Lens Options No-Refresh Fix Applied Successfully!');
console.log('🔧 Navigation protection is active during modal operations');
console.log('📋 Test by adding/editing a lens option - page should NOT refresh');
