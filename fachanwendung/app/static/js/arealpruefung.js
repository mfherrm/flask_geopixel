import { cadenza } from './cadenza2.2.4.js';

const config = document.body.dataset;

window.addEventListener('DOMContentLoaded', () => {
  // Anlageanmeldung
  if(document.getElementById('cadenza-flaeche-create')){
    const form = document.forms['arealpruefung'];
    const flaecheModalEl = document.getElementById('flaecheModal');
    let cadenzaFlaecheClientInitalized = false;
    let geom = form.elements['geom'].value;
    if(geom){geom = JSON.parse(geom);};

    // Fläche display
    const updateFlaeche = () => {
      form.elements['geom'].value = JSON.stringify(geom);
      document.getElementById('flaeche-eintragen').innerHTML = "Fläche bearbeiten";
      document.getElementById('flaeche-display').innerHTML = 'Fläche erfolgreich erstellt';
    }

    // create cadenza client
    const cadenzaFlaecheCreateClient = cadenza(config.cadenzaUri, {
      debug: true,
      iframe: 'cadenza-flaeche-create',
      webApplication: {
        repositoryName: config.cadenzaRepositoryName,
        externalLinkId: config.cadenzaExternalLinkId
      },
    });

    // check if there is any valid input in lat/long formfields and update the standort display
    if(geom){
      updateFlaeche();
    }

    // check if there is any valid input in the geom formfield and then go with create or edit geometry
    flaecheModalEl.addEventListener('shown.bs.modal', () => {
      if(geom){
        updateFlaeche();
        cadenzaFlaecheCreateClient.editGeometry('windkraftanlage-erfassen',
          {
            "type": "Polygon",
            "coordinates": [geom],
          }
        );
      } else {
        cadenzaFlaecheCreateClient.createGeometry('windkraftanlage-erfassen', 'Polygon');
      };
    });

    cadenzaFlaecheCreateClient.on('editGeometry:ok', (event) => {
      console.log('Geometry editing was completed', event.detail.geometry);
      // add geometrie into form fields
      geom = event.detail.geometry.coordinates[0];
      updateFlaeche();
      // close modal
      closeFlaecheModal();
    });

    cadenzaFlaecheCreateClient.on('editGeometry:cancel', (event) => {
      console.log('Geometry editing was cancled', event.detail);
      closeFlaecheModal();
    });
    const closeFlaecheModal = () => {
      const flaecheModal = bootstrap.Modal.getInstance(flaecheModalEl);
      flaecheModal.hide();
    }
  }
});


