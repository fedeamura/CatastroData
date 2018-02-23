var token;

$(function() {
  $("#btn_Login").click(function() {
    var user = $("#input_Usuario").val();
    if (user.trim() == "") {
      Materialize.toast("Por favor ingrese el usuario", 4000);
      $("#input_Usuario").focus();
      return;
    }

    var pass = $("#input_Password").val();
    if (pass.trim() == "") {
      Materialize.toast("Por favor ingrese la contraseña", 4000);
      $("#input_Password").focus();
      return;
    }

    iniciarSesion(
      user,
      pass,
      function(tokenNuevo) {
        token = tokenNuevo;
        $("#contenedor_Login").removeClass("visible");
        $("#contenedor_Contenido").removeClass("blur");
      },
      function(error) {
        Materialize.toast(error, 4000);
      }
    );
  });

  $("#input_Usuario, #input_Password").keypress(function(e) {
    if (e.which == 13) {
      $("#btn_Login").trigger("click");
    }
  });
});

var map;

function initMap() {
  var styles = [
    {
      featureType: "poi",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "transit.station.bus",
      stylers: [{ visibility: "off" }]
    }
  ];

  map = new google.maps.Map(document.getElementById("mapa"), {
    center: {
      lat: -31.416239,
      lng: -64.19112
    },
    zoom: 16
  });
  map.setOptions({ styles: styles });

  google.maps.event.addListener(map, "click", function(event) {
    placeMarker(event.latLng);
  });
}

function placeMarker(location) {
  let marcador = new google.maps.Marker({
    map: map,
    position: location
  });

  let infoWindow = new google.maps.InfoWindow({
    content: "Cargando..."
  });

  infoWindow.open(map, marcador);
  infoWindow.set("marcador", marcador);

  google.maps.event.addListener(infoWindow, "closeclick", function() {
    this.get("marcador").setMap(null);
  });

  buscarDatosMarcador(
    location.lat(),
    location.lng(),
    function(result) {
      infoWindow.setContent(
        "Barrio: " +
          result.Barrio.Nombre +
          "<br/>CPC: Nº " +
          result.Cpc.Numero +
          " - " +
          result.Cpc.Nombre
      );
    },
    function(result) {
      infoWindow.setContent(result);
    }
  );
}

//Funciones
function iniciarSesion(user, pass, callback, callbackError) {
  const url =
    "https://servicios.cordoba.gov.ar/WSSigo_Bridge/BridgeUsuario.asmx/IniciarSesion";

  const data = {
    user: user,
    pass: pass
  };

  var settings = {
    async: true,
    crossDomain: true,
    url: url,
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cache-control": "no-cache",
      "postman-token": "5e021da7-6863-6b71-e5ce-4d27ff8fdbfa"
    },
    data: JSON.stringify(data)
  };

  $.ajax(settings).done(function(response) {
    console.log(response);
  });
}

function buscarDatosMarcador(lat, lng, callback, callbackError) {
  const url =
    "https://servicios.cordoba.gov.ar/WSSigo_Bridge/BridgeDomicilio.asmx/ValidarDomicilio";

  fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      token: token,
      domicilio: {
        porBarrio: true,
        XGoogle: lat,
        YGoogle: lng
      }
    })
  })
    .then(response => response.json())
    .then(responseJson => {
      var data = responseJson.d;

      if (!data.Ok) {
        callbackError(data.Error);
        return;
      }

      callback(data.Return);
    })
    .catch(error => {
      callbackError("Error porcesando la solicitud");
    });
}
