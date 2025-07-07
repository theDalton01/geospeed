const THREE_DAYS_IN_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Creates and returns the location request modal element.
 * The modal explains why the location is needed and provides action buttons.
 * @returns {HTMLElement} The fully constructed modal element.
 */
function createModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const title = document.createElement('h2');
    title.textContent = 'Can we know your location?';

    const explanation = document.createElement('p');
    explanation.innerHTML = 'We use your location to map internet speed tests in your area. <br>This helps other users see the average internet speed before they visit, making the data more useful for everyone.';

    const allowButton = document.createElement('button');
    allowButton.id = 'allowLocation';
    allowButton.textContent = 'Allow';

    const laterButton = document.createElement('button');
    laterButton.id = 'denyLocation';
    laterButton.textContent = 'Maybe Later';

    modalContent.appendChild(title);
    modalContent.appendChild(explanation);
    modalContent.appendChild(allowButton);
    modalContent.appendChild(laterButton);
    modalOverlay.appendChild(modalContent);

    return modalOverlay;
}

/**
 * Handles the logic for showing the location modal on first visit
 * or reminding the user after a set period if they previously denied it.
 */
export function handleLocationModal() {
    const hasVisited = localStorage.getItem('hasVisited');
    const locationDeniedTimestamp = localStorage.getItem('locationDeniedTimestamp');

    const shouldShowModal = !hasVisited && 
        (!locationDeniedTimestamp || (Date.now() - locationDeniedTimestamp > THREE_DAYS_IN_MS));

    if (shouldShowModal) {
        const modal = createModal();
        document.body.appendChild(modal);

        document.getElementById('allowLocation').addEventListener('click', () => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log(`User granted location: Lat: ${latitude}, Lng: ${longitude}`);
                    // Here you would send the lat and lng to your backend
                    localStorage.setItem('hasVisited', 'true');
                    localStorage.removeItem('locationDeniedTimestamp'); // Clean up denial timestamp
                    document.body.removeChild(modal);
                },
                (error) => {
                    console.error(`Geolocation error: ${error.message}`);
                    localStorage.setItem('locationDeniedTimestamp', Date.now());
                    document.body.removeChild(modal);
                }
            );
        });

        document.getElementById('denyLocation').addEventListener('click', () => {
            localStorage.setItem('locationDeniedTimestamp', Date.now());
            document.body.removeChild(modal);
        });
    }
}
