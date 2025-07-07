import { createLocationPage } from "./locationPage.js";
import { initUI, startStop } from "./speedtest-integration.js";

export function createTestPage() {
    const container = document.querySelector('div.container');
    if (!container) {
        console.error('The container element was not found in the DOM.');
        return;
    }
    // Clear any existing hardcoded HTML
    container.innerHTML = '';

    const header = document.createElement('header');
    const ctaButton = document.createElement('button');
    ctaButton.id = 'cta';
    ctaButton.textContent = 'Check Average Speed';
    ctaButton.addEventListener("click", () => {
        createLocationPage();
    });

    const infoImg = document.createElement('img');
    infoImg.src = '../assets/info.svg';
    infoImg.alt = 'more-information';
    header.appendChild(ctaButton);
    header.appendChild(infoImg);

    const testWrapper = document.createElement('div');
    testWrapper.id = 'testWrapper';

    const ipArea = document.createElement('div');
    ipArea.id = 'ipArea';
    const ipSpan = document.createElement('span');
    ipSpan.id = 'ip';
    ipArea.appendChild(ipSpan);

    const test = document.createElement('div');
    test.id = 'test';

    const testGroup1 = document.createElement('div');
    testGroup1.className = 'testGroup';

    const testAreaPing = document.createElement('div');
    testAreaPing.className = 'testArea2';
    const testNamePing = document.createElement('div');
    testNamePing.className = 'testName';
    testNamePing.textContent = 'Ping';
    const pingText = document.createElement('div');
    pingText.id = 'pingText';
    pingText.className = 'meterText';
    pingText.style.color = '#c5ff33';
    const unitPing = document.createElement('div');
    unitPing.className = 'unit';
    unitPing.textContent = 'ms';
    testAreaPing.appendChild(testNamePing);
    testAreaPing.appendChild(pingText);
    testAreaPing.appendChild(unitPing);

    const testAreaJitter = document.createElement('div');
    testAreaJitter.className = 'testArea2';
    const testNameJitter = document.createElement('div');
    testNameJitter.className = 'testName';
    testNameJitter.textContent = 'Jitter';
    const jitText = document.createElement('div');
    jitText.id = 'jitText';
    jitText.className = 'meterText';
    jitText.style.color = '#c5ff33';
    const unitJitter = document.createElement('div');
    unitJitter.className = 'unit';
    unitJitter.textContent = 'ms';
    testAreaJitter.appendChild(testNameJitter);
    testAreaJitter.appendChild(jitText);
    testAreaJitter.appendChild(unitJitter);

    testGroup1.appendChild(testAreaPing);
    testGroup1.appendChild(testAreaJitter);

    const testGroup2 = document.createElement('div');
    testGroup2.className = 'testGroup';

    const testAreaDl = document.createElement('div');
    testAreaDl.className = 'testArea';
    const dlMeter = document.createElement('canvas');
    dlMeter.id = 'dlMeter';
    dlMeter.className = 'meter';
    const dlText = document.createElement('div');
    dlText.id = 'dlText';
    dlText.className = 'meterText';
    const unitDl = document.createElement('div');
    unitDl.className = 'unit';
    unitDl.textContent = 'Mbps';
    const testNameDl = document.createElement('div');
    testNameDl.className = 'testName';
    testNameDl.textContent = 'Download';
    testAreaDl.appendChild(dlMeter);
    testAreaDl.appendChild(dlText);
    testAreaDl.appendChild(unitDl);
    testAreaDl.appendChild(testNameDl);

    const testAreaUl = document.createElement('div');
    testAreaUl.className = 'testArea';
    const ulMeter = document.createElement('canvas');
    ulMeter.id = 'ulMeter';
    ulMeter.className = 'meter';
    const ulText = document.createElement('div');
    ulText.id = 'ulText';
    ulText.className = 'meterText';
    const unitUl = document.createElement('div');
    unitUl.className = 'unit';
    unitUl.textContent = 'Mbps';
    const testNameUl = document.createElement('div');
    testNameUl.className = 'testName';
    testNameUl.textContent = 'Upload';
    testAreaUl.appendChild(ulMeter);
    testAreaUl.appendChild(ulText);
    testAreaUl.appendChild(unitUl);
    testAreaUl.appendChild(testNameUl);

    testGroup2.appendChild(testAreaDl);
    testGroup2.appendChild(testAreaUl);

    test.appendChild(testGroup1);
    test.appendChild(testGroup2);

    const startStopBtn = document.createElement('div');
    startStopBtn.id = 'startStopBtn';
    startStopBtn.addEventListener("click", () => {
        startStop();
    });

    testWrapper.appendChild(ipArea);
    testWrapper.appendChild(test);
    testWrapper.appendChild(startStopBtn);

    const footer = document.createElement('footer');
    footer.innerHTML = 'Powered by <a href="https://github.com/librespeed/speedtest">Librespeed</a>';

    container.appendChild(header);
    container.appendChild(testWrapper);
    container.appendChild(footer);

    setTimeout(function () {
        initUI();
    }, 100);
}