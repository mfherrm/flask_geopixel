/**
 * Dropup Controls Functionality
 * Handles all dropup button interactions (Color, Object, Tiles)
 */

document.addEventListener('DOMContentLoaded', function() {
    // Function to handle MSFF checkbox initialization and events
    function setupMSFFCheckbox() {
        const checkbox = document.getElementById('msff-checkbox');
        if (!checkbox) return;
        
        // Initialize checkbox state from upscalingConfig if available
        try {
            if (window.upscalingConfig) {
                checkbox.checked = window.upscalingConfig.msff || false;
            }
            console.log(`Initialized MSFF checkbox: ${checkbox.checked}`);
        } catch (e) {
            console.error('Error initializing MSFF checkbox:', e);
        }
        
        // Add change event listener
        checkbox.addEventListener('change', function(e) {
            if (window.updateUpscalingConfig) {
                // Get current scale from button text
                const currentScaleText = document.getElementById('upscalingbttn').textContent;
                const scaleMatch = currentScaleText.match(/x(\d+)/);
                const currentScale = scaleMatch ? parseInt(scaleMatch[1]) : 1;
                
                // Update with current scale and new MSFF state
                window.updateUpscalingConfig(currentScale, this.checked);
                console.log(`MSFF checkbox changed: ${this.checked}`);
            }
        });
    }
    
    // Handle dropdown button clicks to show/hide content
    document.querySelectorAll('.menu-button').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Close all other dropups first
            document.querySelectorAll('.menu-button-content').forEach(content => {
                if (content !== this.nextElementSibling) {
                    content.classList.remove('show');
                    content.style.display = 'none';
                }
            });
            
            // Toggle the clicked dropup
            const dropupContent = this.nextElementSibling;
            if (dropupContent) {
                const isCurrentlyVisible = dropupContent.style.display === 'block';
                if (isCurrentlyVisible) {
                    dropupContent.style.display = 'none';
                    dropupContent.classList.remove('show');
                } else {
                    dropupContent.style.display = 'block';
                    dropupContent.classList.add('show');
                }
            }
        });
    });
    
    // Close dropups when clicking outside
    document.addEventListener('click', function(e) {
        // Check if the click is outside any dropup container
        const clickedInsideDropup = e.target.closest('.menu-button');
        if (!clickedInsideDropup) {
            document.querySelectorAll('.menu-button-content').forEach(content => {
                content.classList.remove('show');
                content.style.display = 'none';
            });
        }
    });
    
    // Handle option selections
    document.querySelectorAll('.tiles-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const tileCount = parseInt(this.dataset.tiles);
            document.getElementById('tilesbttn').textContent = `Tiles: ${tileCount}`;
            const dropupContent = this.closest('.menu-button-content');
            dropupContent.classList.remove('show');
            dropupContent.style.display = 'none';
            
            // Update tile configuration if function is available
            if (window.updateTileConfig) {
                window.updateTileConfig(tileCount);
            }
        });
    });
    
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById('colorbttn').textContent = this.textContent;
            const dropupContent = this.closest('.menu-button-content');
            dropupContent.classList.remove('show');
            dropupContent.style.display = 'none';
        });
    });
    
    document.querySelectorAll('.object-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById('objbttn').textContent = this.textContent;
            const dropupContent = this.closest('.menu-button-content');
            dropupContent.classList.remove('show');
            dropupContent.style.display = 'none';
        });
    });
    
    document.querySelectorAll('.upscaling-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const scaleValue = parseInt(this.dataset.scale);
            document.getElementById('upscalingbttn').textContent = `Upscaling: x${scaleValue}`;
            const dropupContent = this.closest('.menu-button-content');
            dropupContent.classList.remove('show');
            dropupContent.style.display = 'none';
            
            // Get current MSFF state
            const checkbox = document.getElementById('msff-checkbox');
            const msffEnabled = checkbox ? checkbox.checked : false;
            
            // Update upscaling configuration if function is available
            if (window.updateUpscalingConfig) {
                window.updateUpscalingConfig(scaleValue, msffEnabled);
            }
        });
    });
    
    // Handle category interactions - with bounds checking
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const categoryGroup = this.closest('.category-group');
            const submenu = categoryGroup.querySelector('.subcategory-menu');
            const dropupContent = this.closest('.menu-button-content');
            
            // Close all other submenus first
            document.querySelectorAll('.category-group').forEach(group => {
                if (group !== categoryGroup) {
                    group.classList.remove('show-submenu');
                    const otherSubmenu = group.querySelector('.subcategory-menu');
                    if (otherSubmenu) {
                        otherSubmenu.style.display = 'none';
                    }
                }
            });
            
            // Toggle current submenu
            if (categoryGroup.classList.contains('show-submenu')) {
                categoryGroup.classList.remove('show-submenu');
                submenu.style.display = 'none';
            } else {
                categoryGroup.classList.add('show-submenu');
                submenu.style.display = 'block';
                
                // Ensure dropdown doesn't exceed bounds
                setTimeout(() => {
                    const dropupRect = dropupContent.getBoundingClientRect();
                    const maxAllowedHeight = 400;
                    
                    if (dropupRect.height > maxAllowedHeight) {
                        dropupContent.style.maxHeight = maxAllowedHeight + 'px';
                        dropupContent.style.overflowY = 'auto';
                    }
                }, 10);
            }
        });
    });
    
    // Handle window resize to reset mobile states
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            // Reset mobile-specific states when switching back to desktop
            document.querySelectorAll('.category-group').forEach(group => {
                group.classList.remove('active');
                const submenu = group.querySelector('.subcategory-menu');
                if (submenu) {
                    submenu.style.display = '';
                }
            });
        }
    });
    
    // Prevent subcategory menus from closing the main dropdown when clicking inside them
    document.querySelectorAll('.subcategory-menu').forEach(menu => {
        menu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
    
    // Initialize MSFF checkbox
    setupMSFFCheckbox();
});