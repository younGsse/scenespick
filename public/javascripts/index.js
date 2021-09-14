var host = 'localhost:3000';

var map = callMap();

// 함수로 맵을 불러오니 지도 다시 안불러오고 마커만 변경된다. 뭐지?
function callMap() {
  var container = document.getElementById('map');
  var options = {
    center: new kakao.maps.LatLng(33.37903821496581, 126.55043597716713),
    level: 9,
    scrollwheel: false,
  };
  return new kakao.maps.Map(container, options);
}

function viewTotal() {
  var map = callMap();

  fetch(`http://${host}/api/stores`).then(data => {
    return data.json();
  }).then(stores => {
    makeMarker(map, stores);
  })
}

function viewPart(e) {
  var map = callMap();

  fetch(`http://${host}/api/stores/${e.id}`).then(data => {
    return data.json();
  }).then(stores => {
    makeMarker(map, stores);
  })
}

function makeMarker(map, stores) {
  for (let store of stores) {
    var geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(store.addr, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
        var marker = new kakao.maps.Marker({
          map: map,
          position: coords,
          clickable: true
        });
        var infowindow = new kakao.maps.InfoWindow({
          content : `<div style="width:150px; text-align:center;">${store.name}</div>`
        })

        kakao.maps.event.addListener(marker, 'mouseover', makeOverListener(map, marker, infowindow));
        kakao.maps.event.addListener(marker, 'mouseout', makeOutListener(infowindow));
        
        selectMarker = null;
        kakao.maps.event.addListener(marker, 'click', function() {
          if (!selectMarker || selectMarker !== marker) {
            var detail = document.getElementById('detail');
            detail.style.visibility = 'visible';
            detail.innerHTML = `
            <div class="container my-3">
              <h2>${store.name}</h2>
              <p>${store.review}</p>
              <p>${store.addr}</p>
            </div>
            `;
          }
          selectMarker = marker;
        })
      }
    })
  }
}

function makeOverListener(map, marker, infowindow) {
  return function() {
    infowindow.open(map, marker);
  }
}

function makeOutListener(infowindow) {
  return function() {
    infowindow.close();
  }
}

function makeClickListener() {
  var detail = document.getElementById('detail');
  if (detail.style.visibility == 'hidden') {
    detail.style.visibility = 'visible';
  } else {
    detail.style.visibility = 'hidden';
  }
}