const map = L.map('map').setView([49.015, 8.325], 13);


const tiles = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
}).addTo(map);

var simpleMapScreenshoter = L.simpleMapScreenshoter({
    hidden: true
}).addTo(map);

document.getElementById('screenMap').addEventListener('click', () => {
    simpleMapScreenshoter.takeScreen('blob').then(blob => {
        const imageBlob = blob;
        const mapExtent = map.getBounds();

        const formData = new FormData();
        formData.append('file', imageBlob, 'screen.png');
        formData.append('mapExtent', JSON.stringify(mapExtent));

        console.log(formData);
        fetch('http://127.0.0.1:5000/receive', {
            method: 'POST',
            body: formData
        }).then(response => response.json())
            .then(data => {
                console.log(data);
                if (data.message === 'Image received and saved successfully' && data.image_url && data.mapExtent) {
                    const imageUrl = data.image_url + '?' + Date.now(); // Add cache-busting parameter
                    const southWest = L.latLng(data.mapExtent._southWest.lat, data.mapExtent._southWest.lng);
                    const northEast = L.latLng(data.mapExtent._northEast.lat, data.mapExtent._northEast.lng);
                    const bounds = L.latLngBounds(southWest, northEast);

                    // Simply add the new image overlay
                    L.imageOverlay(imageUrl, bounds, { className: 'no-white-bars' }).addTo(map);

                } else if (data.error) {
                    alert(`Error: ${data.error}`);
                }
            });

    }).catch(e => {
        alert(e.toString());
    });
});
