document.getElementById('screenMap').addEventListener('click', () => {
    let mbs = document.getElementById("cadenza-iframe").src.split("mapExtent=")[1].split("%2C")
    mbs[3] = mbs[3].split("&")[0]
    console.log("Map bounds: \n \t NW: ", mbs[0], mbs[1], "\n \t SE: ", mbs[2], mbs[3])

    simpleMapScreenshoter.takeScreen('blob').then(blob => {
        const imageBlob = blob;
        const mapExtent = map.getBounds();

        const formData = new FormData();
        formData.append('file', imageBlob, 'screen.png');
        formData.append('mapExtent', JSON.stringify(mapExtent));
        console.log(document.getElementById('cadenza-iframe'))//.getAttribute('NamedNodeMap'))
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
