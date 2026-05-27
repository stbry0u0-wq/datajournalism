document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimation();
    renderMap();
    renderBubbleChart();
});

/**
 * Intersection Observer for Fade-in Animation
 */
function initScrollAnimation() {
    const sections = document.querySelectorAll('.section');
    const options = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, options);

    sections.forEach(section => {
        observer.observe(section);
    });
}

/**
 * Leaflet Map - 시도별 사고건수 단계구분도
 */
function renderMap() {
    const REGION_DATA = {
        "전북": 1907, "제주": 615, "경남": 2675, "경북": 3054, "전남": 1685,
        "충남": 1494, "충북": 1725, "경기": 10032, "세종": 151, "울산": 817,
        "대전": 1436, "광주": 1276, "인천": 1223, "대구": 5903, "부산": 4206,
        "서울": 18132, "강원": 1013
    };
    const SIDO_NAME_MAP = {
        "서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구", "인천광역시": "인천",
        "광주광역시": "광주", "대전광역시": "대전", "울산광역시": "울산", "세종특별자치시": "세종",
        "경기도": "경기", "강원특별자치도": "강원", "강원도": "강원", "충청북도": "충북",
        "충청남도": "충남", "전북특별자치도": "전북", "전라북도": "전북", "전라남도": "전남",
        "경상북도": "경북", "경상남도": "경남", "제주특별자치도": "제주", "제주도": "제주"
    };

    function getColor(v) {
        return v > 15000 ? '#08306b' :
               v > 10000 ? '#08519c' :
               v >  5000 ? '#2171b5' :
               v >  3000 ? '#4292c6' :
               v >  1500 ? '#6baed6' :
               v >   500 ? '#9ecae1' :
                           '#deebf7';
    }

    const GRADES = [0, 500, 1500, 3000, 5000, 10000, 15000];
    const GEOJSON_URL = 'https://cdn.jsdelivr.net/gh/southkorea/southkorea-maps@master/kostat/2018/json/skorea-provinces-2018-geo.json';

    const map = L.map('map').setView([36.3, 127.8], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Info Panel
    const infoCtrl = L.control({ position: 'topleft' });
    infoCtrl.onAdd = function () {
        this._div = L.DomUtil.create('div', 'info-box');
        this.update();
        return this._div;
    };
    infoCtrl.update = function (props, value) {
        this._div.innerHTML = props
            ? `<b>${props}</b><br>사고 ${value.toLocaleString()}건`
            : '<b>시도별 사고건수</b><br>마우스를 올려보세요';
    };
    infoCtrl.addTo(map);

    function styleFeature(feature) {
        const sido = SIDO_NAME_MAP[feature.properties.name] || feature.properties.name;
        const v = REGION_DATA[sido] || 0;
        return {
            fillColor: getColor(v),
            fillOpacity: 0.78,
            color: 'white',
            weight: 1.2
        };
    }

    function highlight(e) {
        const layer = e.target;
        layer.setStyle({ weight: 3, color: '#1e3a8a', fillOpacity: 0.92 });
        layer.bringToFront();
        const sido = SIDO_NAME_MAP[layer.feature.properties.name] || layer.feature.properties.name;
        infoCtrl.update(sido, REGION_DATA[sido] || 0);
    }
    function resetHL(e) {
        geoLayer.resetStyle(e.target);
        infoCtrl.update();
    }

    let geoLayer;
    fetch(GEOJSON_URL)
        .then(r => r.json())
        .then(geo => {
            geoLayer = L.geoJSON(geo, {
                style: styleFeature,
                onEachFeature: (feature, layer) => {
                    const sido = SIDO_NAME_MAP[feature.properties.name] || feature.properties.name;
                    const v = REGION_DATA[sido] || 0;
                    layer.bindPopup(`<b>${sido}</b><br>사고건수: ${v.toLocaleString()}건`);
                    layer.bindTooltip(sido, { permanent: true, direction: 'center', className: 'sido-label' });
                    layer.on({ mouseover: highlight, mouseout: resetHL });
                }
            }).addTo(map);
            map.fitBounds(geoLayer.getBounds());
        });

    // Legend
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'info-box legend');
        let html = '<b>사고건수</b><br>';
        for (let i = 0; i < GRADES.length; i++) {
            const from = GRADES[i];
            const to = GRADES[i + 1];
            html += `<i style="background:${getColor(from + 1)}"></i>` +
                    `${from.toLocaleString()}${to ? '&ndash;' + to.toLocaleString() : '+'}<br>`;
        }
        div.innerHTML = html;
        return div;
    };
    legend.addTo(map);

    // Resize handling
    window.addEventListener('resize', () => {
        map.invalidateSize();
    });
}

/**
 * Chart.js - 시도별 교통사고 현황 버블차트
 */
function renderBubbleChart() {
    const rawData = [
        { "sido": "전북특별자치도", "x": 1907, "y": 136, "casualties": 1971 },
        { "sido": "제주특별자치도", "x": 615, "y": 15, "casualties": 640 },
        { "sido": "경상남도", "x": 2675, "y": 116, "casualties": 2778 },
        { "sido": "경상북도", "x": 3054, "y": 123, "casualties": 3173 },
        { "sido": "전라남도", "x": 1685, "y": 134, "casualties": 1809 },
        { "sido": "충청남도", "x": 1494, "y": 77, "casualties": 1534 },
        { "sido": "충청북도", "x": 1725, "y": 87, "casualties": 1841 },
        { "sido": "경기도", "x": 10032, "y": 406, "casualties": 10563 },
        { "sido": "세종특별자치시", "x": 151, "y": 2, "casualties": 161 },
        { "sido": "울산광역시", "x": 817, "y": 27, "casualties": 873 },
        { "sido": "대전광역시", "x": 1436, "y": 88, "casualties": 1518 },
        { "sido": "광주광역시", "x": 1276, "y": 78, "casualties": 1339 },
        { "sido": "인천광역시", "x": 1223, "y": 78, "casualties": 1273 },
        { "sido": "대구광역시", "x": 5903, "y": 177, "casualties": 6175 },
        { "sido": "부산광역시", "x": 4206, "y": 204, "casualties": 4430 },
        { "sido": "서울특별시", "x": 18132, "y": 585, "casualties": 19324 },
        { "sido": "강원특별자치도", "x": 1013, "y": 66, "casualties": 1055 }
    ];

    const colors = [
        'rgba(139, 26, 26, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 
        'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
        'rgba(199, 199, 199, 0.6)', 'rgba(83, 102, 255, 0.6)', 'rgba(255, 99, 255, 0.6)',
        'rgba(99, 255, 132, 0.6)', 'rgba(255, 159, 159, 0.6)', 'rgba(159, 255, 64, 0.6)',
        'rgba(64, 159, 255, 0.6)', 'rgba(206, 86, 255, 0.6)', 'rgba(86, 206, 255, 0.6)',
        'rgba(255, 86, 86, 0.6)', 'rgba(86, 255, 206, 0.6)'
    ];

    const datasets = rawData.map((d, index) => ({
        label: d.sido,
        data: [{
            x: d.x,
            y: d.y,
            r: Math.sqrt(d.casualties) * 0.3,
            casualtiesRaw: d.casualties
        }],
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace('0.6', '1'),
        borderWidth: 1
    }));

    const ctx = document.getElementById('bubbleChart').getContext('2d');
    new Chart(ctx, {
        type: 'bubble',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
                legend: {
                    position: window.innerWidth < 768 ? 'bottom' : 'right',
                    labels: { boxWidth: 12, font: { size: 10 } }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const raw = context.raw;
                            return [
                                context.dataset.label,
                                `사고건수: ${raw.x.toLocaleString()}건`,
                                `사망자수: ${raw.y.toLocaleString()}명`,
                                `사상자수: ${raw.casualtiesRaw.toLocaleString()}명`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: { title: { display: true, text: '사고건수 (건)' } },
                y: { title: { display: true, text: '사망자수 (명)' } }
            }
        }
    });
}
