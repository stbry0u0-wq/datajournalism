document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initBubbleChart();
    initScrollAnimations();
});

/* ── Leaflet Map: 시도별 사고건수 코로플레스 ───────────────── */
function initMap() {
    const REGION_DATA = {
        "전북": 1907, "제주": 615, "경남": 2675, "경북": 3054, "전남": 1685,
        "충남": 1494, "충북": 1725, "경기": 10032, "세종": 151, "울산": 817,
        "대전": 1436, "광주": 1276, "인천": 1223, "대구": 5903, "부산": 4206,
        "서울": 18132, "강원": 1013
    };

    const SIDO_NAME_MAP = {
        "서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구",
        "인천광역시": "인천", "광주광역시": "광주", "대전광역시": "대전",
        "울산광역시": "울산", "세종특별자치시": "세종", "경기도": "경기",
        "강원특별자치도": "강원", "강원도": "강원", "충청북도": "충북",
        "충청남도": "충남", "전북특별자치도": "전북", "전라북도": "전북",
        "전라남도": "전남", "경상북도": "경북", "경상남도": "경남",
        "제주특별자치도": "제주", "제주도": "제주"
    };

    function getColor(v) {
        return v > 15000 ? '#8c510a' :
               v > 10000 ? '#bf812d' :
               v >  5000 ? '#dfc27d' :
               v >  3000 ? '#f6e8c3' :
               v >  1500 ? '#c7eae5' :
               v >   500 ? '#80cdc1' :
                           '#35978f';
    }

    const map = L.map('map').setView([36.3, 127.8], 7);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    const GEOJSON_URL = 'https://cdn.jsdelivr.net/gh/southkorea/southkorea-maps@master/kostat/2018/json/skorea-provinces-2018-geo.json';

    fetch(GEOJSON_URL)
        .then(r => r.json())
        .then(geo => {
            const geoLayer = L.geoJSON(geo, {
                style: (feature) => {
                    const sido = SIDO_NAME_MAP[feature.properties.name] || feature.properties.name;
                    const v = REGION_DATA[sido] || 0;
                    return {
                        fillColor: getColor(v),
                        fillOpacity: 0.8,
                        color: 'white',
                        weight: 1
                    };
                },
                onEachFeature: (feature, layer) => {
                    const sido = SIDO_NAME_MAP[feature.properties.name] || feature.properties.name;
                    const v = REGION_DATA[sido] || 0;
                    layer.bindPopup(`<b>${sido}</b>: ${v.toLocaleString()}건`);
                }
            }).addTo(map);
            map.fitBounds(geoLayer.getBounds());
        });
}

/* ── Chart.js: 17개 시도별 교통사고 현황 버블차트 ─────────────── */
function initBubbleChart() {
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

    const ctx = document.getElementById('bubbleChart').getContext('2d');
    new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: rawData.map((d, i) => ({
                label: d.sido,
                data: [{ x: d.x, y: d.y, r: Math.sqrt(d.casualties) * 0.4 }],
                backgroundColor: `rgba(200, 147, 44, 0.6)`, // Point Color with Alpha
                borderColor: '#C8932C',
                borderWidth: 1
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { title: { display: true, text: '사고건수' } },
                y: { title: { display: true, text: '사망자수' } }
            }
        }
    });
}

/* ── Scroll Animations: Intersection Observer ───────────────── */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}
