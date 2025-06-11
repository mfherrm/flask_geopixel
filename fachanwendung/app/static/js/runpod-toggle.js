/**
 * RunPod Control Panel Toggle Functionality
 * Handles showing/hiding the RunPod control panel
 */

document.addEventListener('DOMContentLoaded', function() {
    // Handle RunPod Control button toggle
    const runpodToggleBtn = document.getElementById('runpod-toggle-btn');
    
    if (runpodToggleBtn) {
        runpodToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const runpodPanel = document.getElementById('runpod-panel');
            const runpodButton = document.getElementById('runpod-toggle-btn');
            const isCurrentlyVisible = runpodPanel.style.display !== 'none';
            
            if (isCurrentlyVisible) {
                runpodPanel.style.display = 'none';
                document.getElementById('cadenza-container').classList.remove('runpod-panel-visible');
            } else {
                // Position the panel to align borders with the button
                const buttonRect = runpodButton.getBoundingClientRect();
                const containerRect = document.getElementById('button-container').getBoundingClientRect();
                
                // Account for button border and padding to align the blue borders
                const buttonStyle = window.getComputedStyle(runpodButton);
                const buttonBorderLeft = parseInt(buttonStyle.borderLeftWidth) || 0;
                const buttonPaddingLeft = parseInt(buttonStyle.paddingLeft) || 0;
                
                // Calculate offset to align the blue borders
                const leftOffset = buttonRect.left - containerRect.left - buttonBorderLeft;
                
                runpodPanel.style.display = 'block';
                runpodPanel.style.marginLeft = leftOffset + 'px';
                runpodPanel.style.marginRight = 'auto';
                runpodPanel.style.marginBottom = '15px'; // Add reduced bottom margin
                document.getElementById('cadenza-container').classList.add('runpod-panel-visible');
                
                // Scroll to the RunPod Control Panel smoothly
                setTimeout(() => {
                    runpodPanel.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                        inline: 'nearest'
                    });
                }, 100); // Small delay to ensure panel is visible before scrolling
            }
        });
    }
});