/**
 * Dropup Controls Functionality
 * Handles all dropup button interactions (Color, Object, Tiles)
 */

document.addEventListener('DOMContentLoaded', function() {
    // Handle dropdown button clicks to show/hide content
    document.querySelectorAll('.dropbtn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Close all other dropups first
            document.querySelectorAll('.dropup-content').forEach(content => {
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
        const clickedInsideDropup = e.target.closest('.dropup');
        if (!clickedInsideDropup) {
            document.querySelectorAll('.dropup-content').forEach(content => {
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
            const dropupContent = this.closest('.dropup-content');
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
            const dropupContent = this.closest('.dropup-content');
            dropupContent.classList.remove('show');
            dropupContent.style.display = 'none';
        });
    });
    
    document.querySelectorAll('.object-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById('objbttn').textContent = this.textContent;
            const dropupContent = this.closest('.dropup-content');
            dropupContent.classList.remove('show');
            dropupContent.style.display = 'none';
        });
    });
});