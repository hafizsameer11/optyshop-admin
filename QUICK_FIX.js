// QUICK FIX - Copy this entire block into browser console

// Block form submissions in modals
document.addEventListener('submit', function(e) {
    if (e.target.closest('.fixed')) {
        console.log('🚫 Modal form submission prevented');
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}, true);

// Block navigation during modal operations
let blockNav = false;
const originalPush = history.pushState;
history.pushState = function(...args) {
    if (blockNav) {
        console.log('🚫 Navigation blocked');
        return;
    }
    return originalPush.apply(this, args);
};

// Auto-detect modals
new MutationObserver(() => {
    const modal = document.querySelector('.fixed.inset-0');
    blockNav = !!modal;
    console.log('🔧 Modal detected:', blockNav ? 'YES' : 'NO');
}).observe(document.body, {childList: true, subtree: true});

console.log('✅ Quick fix applied! Try adding a lens option now.');
