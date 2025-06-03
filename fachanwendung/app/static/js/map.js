import './cadenza3.0.4.js';

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cadenza-iframe')) {

    window.cadenzaClient = cadenza({
      baseUrl: 'http://localhost:8080/cadenza/',
      iframe: 'cadenza-iframe',
      debug: true,
      webApplication: {
        repositoryName: "Pc8YJDtHybIR3hDILuOJ",
        externalLinkId: "aDnoKxgW86U3nWUqn4ms"
      },
    });

    window.cadenzaClient.showMap('messstellenkarte', {
      useMapSrs: true,
      mapExtent: [
        852513.341856, 6511017.966314, 916327.095083, 7336950.728974
      ],

    });

    window.cadenzaClient.on('change:extent', (event) => {
        console.log(event)
    });
  }

  const colorButton = document.getElementById('colorbttn');
    const objectButton = document.getElementById('objbttn');
    
    // Get references to the dropdown items
    const colorOptions = document.querySelectorAll('.color-option');
    const objectOptions = document.querySelectorAll('.object-option');
    
    // Function to toggle dropup content
    function toggleDropup(dropupContent) {
        // Close all dropups first
        document.querySelectorAll('.dropup-content').forEach(content => {
            if (content !== dropupContent) {
                content.classList.remove('show');
            }
        });
        
        // Toggle the clicked dropup
        dropupContent.classList.toggle('show');
    }
    
    // Add click event listeners to dropup buttons
    colorButton.addEventListener('click', function() {
        const dropupContent = this.nextElementSibling;
        toggleDropup(dropupContent);
        this.classList.toggle('active');
    });
    
    objectButton.addEventListener('click', function() {
        const dropupContent = this.nextElementSibling;
        toggleDropup(dropupContent);
        this.classList.toggle('active');
    });
    
    // Close dropups when clicking outside
    window.addEventListener('click', function(event) {
        if (!event.target.matches('.dropbtn')) {
            document.querySelectorAll('.dropup-content').forEach(content => {
                if (content.classList.contains('show')) {
                    content.classList.remove('show');
                }
            });
            
            document.querySelectorAll('.dropbtn').forEach(button => {
                button.classList.remove('active');
            });
        }
    });
    
    // Add click event listeners to color options
    colorOptions.forEach(option => {
        option.addEventListener('click', (event) => {
            event.preventDefault();
            // Update the button text with the selected color
            colorButton.textContent = option.textContent.trim();
            // Close the dropup after selection
            option.closest('.dropup-content').classList.remove('show');
            colorButton.classList.remove('active');
        });
    });
    
    // Add click event listeners to object options
    objectOptions.forEach(option => {
        option.addEventListener('click', (event) => {
            event.preventDefault();
            // Update the button text with the selected object
            objectButton.textContent = option.textContent.trim();
            // Close the dropup after selection
            option.closest('.dropup-content').classList.remove('show');
            objectButton.classList.remove('active');
        });
    });
});