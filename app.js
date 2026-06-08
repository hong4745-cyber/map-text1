/* ===========================
   매장 데이터 (가상)
=========================== */
const STORES = [
  {
    id: 1,
    name: '바삭공장 홍대점',
    address: '서울 마포구 와우산로 94',
    hours: '11:00 – 22:00 (월요일 휴무)',
    phone: '02-333-1234',
    isOpen: true,
    lat: 37.5519,
    lng: 126.9245,
  },
  {
    id: 2,
    name: '바삭공장 강남점',
    address: '서울 강남구 강남대로 396',
    hours: '10:30 – 22:30',
    phone: '02-555-5678',
    isOpen: true,
    lat: 37.4969,
    lng: 127.0278,
  },
  {
    id: 3,
    name: '바삭공장 성수점',
    address: '서울 성동구 성수이로 78',
    hours: '11:00 – 21:00 (화요일 휴무)',
    phone: '02-467-9012',
    isOpen: false,
    lat: 37.5448,
    lng: 127.0568,
  },
  {
    id: 4,
    name: '바삭공장 이태원점',
    address: '서울 용산구 이태원로 178',
    hours: '12:00 – 23:00',
    phone: '02-749-3456',
    isOpen: true,
    lat: 37.5345,
    lng: 126.9940,
  },
  {
    id: 5,
    name: '바삭공장 건대점',
    address: '서울 광진구 능동로 217',
    hours: '11:30 – 22:00',
    phone: '02-456-7890',
    isOpen: true,
    lat: 37.5403,
    lng: 127.0693,
  },
];

/* ===========================
   전역 상태
=========================== */
let map = null;
let markers = [];
let infoWindows = [];
let searchCircle = null;
let activeIndex = -1;

/* ===========================
   지도 초기화
=========================== */
function initMap() {
  map = new naver.maps.Map('map', {
    center: new naver.maps.LatLng(37.5254, 127.0001),
    zoom: 12,
    mapTypeId: naver.maps.MapTypeId.NORMAL,
    scaleControl: false,
    logoControl: true,
    mapDataControl: false,
    zoomControl: true,
    zoomControlOptions: {
      position: naver.maps.Position.TOP_RIGHT,
    },
  });

  renderStoreList();
  renderMarkers();
}

/* ===========================
   매장 목록 렌더링
=========================== */
function renderStoreList() {
  const list = document.getElementById('storeList');
  list.innerHTML = '';

  STORES.forEach((store, i) => {
    const li = document.createElement('li');
    li.className = 'store-card';
    li.dataset.index = i;

    li.innerHTML = `
      <div class="store-card-top">
        <div class="store-name-wrap">
          <span class="store-index">${i + 1}</span>
          <span class="store-name">${store.name}</span>
        </div>
        <span class="store-status ${store.isOpen ? 'open' : 'closed'}">
          ${store.isOpen ? '영업중' : '영업종료'}
        </span>
      </div>
      <div class="store-info-row">
        <span class="info-label">주소</span>
        <span class="info-value">${store.address}</span>
      </div>
      <div class="store-info-row">
        <span class="info-label">시간</span>
        <span class="info-value">${store.hours}</span>
      </div>
      <div class="store-info-row">
        <span class="info-label">전화</span>
        <span class="info-value">${store.phone}</span>
      </div>
    `;

    li.addEventListener('click', () => selectStore(i));
    list.appendChild(li);
  });
}

/* ===========================
   마커 렌더링
=========================== */
function renderMarkers() {
  STORES.forEach((store, i) => {
    const position = new naver.maps.LatLng(store.lat, store.lng);

    // 커스텀 마커 — 검정 사각형
    const markerIcon = {
      content: `
        <div style="
          width: 28px; height: 28px;
          background: #111111;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Pretendard', sans-serif;
          font-size: 11px; font-weight: 600;
          color: #ffffff;
          cursor: pointer;
          position: relative;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        ">
          ${i + 1}
          <div style="
            position: absolute; bottom: -5px; left: 50%;
            transform: translateX(-50%);
            width: 0; height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid #111111;
          "></div>
        </div>
      `,
      anchor: new naver.maps.Point(14, 33),
    };

    const marker = new naver.maps.Marker({
      position,
      map,
      icon: markerIcon,
      title: store.name,
    });

    // 인포윈도우 생성
    const infoWindow = new naver.maps.InfoWindow({
      content: `
        <div class="info-window">
          <div class="iw-name">${store.name}</div>
          <div class="iw-addr">${store.address}</div>
          <div class="iw-hours">${store.hours}</div>
        </div>
      `,
      borderWidth: 0,
      backgroundColor: 'transparent',
      anchorSize: new naver.maps.Size(0, 0),
      pixelOffset: new naver.maps.Point(0, -38),
    });

    marker.addListener('click', () => selectStore(i));

    markers.push(marker);
    infoWindows.push(infoWindow);
  });
}

/* ===========================
   매장 선택
=========================== */
function selectStore(index) {
  // 이전 선택 해제
  if (activeIndex >= 0) {
    // 이전 마커 복원
    updateMarkerStyle(activeIndex, false);
    infoWindows[activeIndex].close();
    document.querySelectorAll('.store-card')[activeIndex].classList.remove('active');
  }

  // 같은 카드 재클릭 시 해제
  if (activeIndex === index) {
    activeIndex = -1;
    return;
  }

  activeIndex = index;

  // 카드 활성화
  const cards = document.querySelectorAll('.store-card');
  cards[index].classList.add('active');
  cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // 마커 활성화 스타일
  updateMarkerStyle(index, true);

  // 지도 이동
  const store = STORES[index];
  const position = new naver.maps.LatLng(store.lat, store.lng);

  map.panTo(position);

  // 인포윈도우 표시
  infoWindows[index].open(map, markers[index]);
}

/* ===========================
   마커 스타일 업데이트
=========================== */
function updateMarkerStyle(index, isActive) {
  const bg = isActive ? '#D72C1A' : '#111111';
  const size = isActive ? '32px' : '28px';

  markers[index].setIcon({
    content: `
      <div style="
        width: ${size}; height: ${size};
        background: ${bg};
        display: flex; align-items: center; justify-content: center;
        font-family: 'Pretendard', sans-serif;
        font-size: 11px; font-weight: 600;
        color: #ffffff;
        cursor: pointer;
        position: relative;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${index + 1}
        <div style="
          position: absolute; bottom: -5px; left: 50%;
          transform: translateX(-50%);
          width: 0; height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid ${bg};
        "></div>
      </div>
    `,
    anchor: new naver.maps.Point(isActive ? 16 : 14, isActive ? 37 : 33),
  });
}

/* ===========================
   주소 검색 + 반경 표시
=========================== */
function searchAddress() {
  const query = document.getElementById('searchInput').value.trim();
  const hint = document.getElementById('searchHint');

  if (!query) {
    hint.textContent = '검색어를 입력하세요.';
    hint.className = 'search-hint error';
    return;
  }

  hint.textContent = '검색 중...';
  hint.className = 'search-hint';

  naver.maps.Service.geocode({ query }, function (status, response) {
    if (status !== naver.maps.Service.Status.OK) {
      hint.textContent = '검색 결과를 찾을 수 없습니다.';
      hint.className = 'search-hint error';
      return;
    }

    const result = response.v2.addresses[0];

    if (!result) {
      hint.textContent = '검색 결과가 없습니다.';
      hint.className = 'search-hint error';
      return;
    }

    const lat = parseFloat(result.y);
    const lng = parseFloat(result.x);
    const position = new naver.maps.LatLng(lat, lng);

    // 기존 반경 원 제거
    if (searchCircle) {
      searchCircle.setMap(null);
      searchCircle = null;
    }

    // 반경 1km 원 표시
    searchCircle = new naver.maps.Circle({
      map,
      center: position,
      radius: 1000,
      fillColor: '#D72C1A',
      fillOpacity: 0.08,
      strokeColor: '#D72C1A',
      strokeOpacity: 0.4,
      strokeWeight: 1.5,
    });

    // 지도 이동 + 줌
    map.setCenter(position);
    map.setZoom(14);

    hint.textContent = `"${result.roadAddress || result.jibunAddress}" — 반경 1km 표시`;
    hint.className = 'search-hint success';
  });
}

/* ===========================
   지도 타입 전환
=========================== */
function setMapType(type) {
  const btnNormal = document.getElementById('btnNormal');
  const btnSatellite = document.getElementById('btnSatellite');

  if (type === 'normal') {
    map.setMapTypeId(naver.maps.MapTypeId.NORMAL);
    btnNormal.classList.add('active');
    btnSatellite.classList.remove('active');
  } else {
    map.setMapTypeId(naver.maps.MapTypeId.SATELLITE);
    btnSatellite.classList.add('active');
    btnNormal.classList.remove('active');
  }
}

/* ===========================
   이벤트 바인딩
=========================== */
document.getElementById('searchBtn').addEventListener('click', searchAddress);
document.getElementById('searchInput').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') searchAddress();
});

/* ===========================
   초기 실행
=========================== */
window.addEventListener('load', initMap);