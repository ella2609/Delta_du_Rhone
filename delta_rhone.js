// CREATION DE LA CARTE //
// Définition de la carte //
var southWest = L.latLng(43.2, 4.3);
var northEast = L.latLng(43.8, 5.7);
var bounds = L.latLngBounds(southWest, northEast);

// Création de la carte avec limites de déplacement et de zoom //
var map = L.map('mapid', {
    center: [43.49580016945596, 4.990455533205567],
    zoom: 10,
    minZoom: 8,
    maxZoom: 12,
    maxBounds: bounds,
});

// Ajouter l'échelle sur la carte //
L.control.scale().addTo(map);

// Fond de carte simple //
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd'
}).addTo(map);


// ------------------------------------------------------------------------------------------------------------------------------------------------------------------- //
// LES POLYGONES DES DEPOTS //

// Dépôts anthropiques //
var anthroLayer = L.geoJSON(anthro, {
    style: function(feature) {
        return {
            fillColor: '#fa0000', 
            color: 'grey',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.5
        };
    },
    onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.Classe) {
            layer.bindPopup(feature.properties.Classe
            );
        }
    }
}).addTo(map);

// Dépôts d'inondation //
var inondLayer = L.geoJSON(inond, { 
    style: function(feature) {
        return {
            fillColor: '#2afa00',
            color: 'grey',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.5
        };
    },
    onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.Classe) {
            layer.bindPopup(feature.properties.Classe);
        }
    }
}).addTo(map);

// Dépôts des lacs //
var lacsLayer = L.geoJSON(lacs, { 
    style: function(feature) {
        return {
            fillColor: '#fcc5f0', 
            color: 'grey',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.5
        };
    },
    onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.Classe) {
            layer.bindPopup(feature.properties.Classe);
        }
    }
}).addTo(map);

// Dépôts de sables //
var sablesLayer = L.geoJSON(sables, {
    style: function(feature) {
        return {
            fillColor: '#fa8f02',
            color: 'grey',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.5
        };
    },
    onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.Classe) {
            layer.bindPopup(feature.properties.Classe);
        }
    }
}).addTo(map);


// ------------------------------------------------------------------------------------------------------------------------------------------------------------------- //
// LES POINTS DE CAROTTES //

// Création de la box qui donne le choix d'affichage des points //
document.getElementById('toggle-carotte-options').onclick = function() {
  const box = document.getElementById('carotte-options-box');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
};

// Définitions des points avec leur logique d'affichage //
function getColorByEnvi(envi) {
  if (envi === "Marin") return "#83d0e9";
  if (envi === "Freshwater/ terrestrial") return "#33a02c";
  return "#bbbbbb";
}
function getRadius(val, min=2005, max=2014) {
  if (!val && val !== 0) return 6;
  return 6 + 20 * ((val-min)/(max-min));
}

// Affichage des points de carottes selon les choix faits //
let carotteLayer;
function updateCarotteDisplay(mode) {
  if (carotteLayer) map.removeLayer(carotteLayer);
  carotteLayer = L.geoJSON(pts_carottes, {
    pointToLayer: function (feature, latlng) {
      const p = feature.properties;
      // Points affichées de base //
      let options = {radius: 7, color: "#000", fillColor: "#fc0303", fillOpacity: 1, weight: 1};
       // Selon l'environnement dominant //
      if (mode === "envi") {
        options.fillColor = getColorByEnvi(p.Envi_dominant);
        // Selon le nombre de dates disponibles //
      } else if (mode === "nb_Dates") {
        options.radius = getRadius(p.nb_Dates, 0, 22);
        options.fillColor = "#6d8cab";
        // Selon la profondeur //
      } else if (mode === "profondeur") {
        options.radius = getRadius(p.Profondeur, 3.4, 50);
        options.fillColor = "#41b6c4";
        // Selon la date //
      } else if (mode === "date") {
        options.fillColor = getColorByDate(p.Date, 1998, 2014);
        // Selon la date de publication //
      } else if (mode === "date_pub") {
        options.fillColor = getColorByDate(p.Date_publication, 2005, 2014);
      }
      return L.circleMarker(latlng, options);
    },
    onEachFeature: function (feature, layer) {
      layer.on('click', function () {
        const nomCarotte = feature.properties.Name;
        onPointClick(nomCarotte);
      });
      
    }
  }).addTo(map);
  updateCarotteLegend(mode);
}

// Définir l'affichage de base //
updateCarotteDisplay("default");
updateCarotteLegend("default");

// Changement de l'affichage selon le choix //
document.querySelectorAll('input[name="carotte-display"]').forEach(radio => {
  radio.addEventListener('change', function() {
    updateCarotteDisplay(this.value);
  });
});

// Légende pour les points de carottes //
function updateCarotteLegend(mode) {
    const legend = document.getElementById('carotte-legend');
    let html = "";
    // Environnement dominant //
    if (mode === "envi") {
        html = `<b>Environnement dominant</b><br>
        <span style="color:#83d0e9;font-size:1.5em;">&#9679;</span> Marin &nbsp;
        <span style="color:#52b432;font-size:1.5em;">&#9679;</span> Freshwater/terrestrial`;
        // Nombre de dates disponibles //
    } else if (mode === "nb_Dates") {
        html = `<b>Nombre de dates</b><br>
    <div style="display:flex;align-items:center;margin-bottom:1em;">
        <svg viewBox="0 0 32 32" width="2em" height="2em" style="display:inline-block;">
            <circle cx="16" cy="16" r="13" fill="#6d8cab" stroke="#000" stroke-width="1.5"/>
        </svg>
        <span style="margin-left:0.7em;">Beaucoup de dates</span>
    </div>
    <div style="display:flex;align-items:center;">
        <svg viewBox="0 0 32 32" width="1.5em" height="1.5em" style="display:inline-block;">
            <circle cx="16" cy="16" r="7" fill="#6d8cab" stroke="#000" stroke-width="2"/>
        </svg>
        <span style="margin-left:0.7em;">Peu de dates</span>
    </div>`;
        // Profondeur des carottes //
    } else if (mode === "profondeur") {
        html = `<b>Profondeur</b><br>
    <div style="display:flex;align-items:center;margin-bottom:1em;">
        <svg viewBox="0 0 32 32" width="2em" height="2em" style="display:inline-block;">
            <circle cx="16" cy="16" r="13" fill="#41b6c4" stroke="#000" stroke-width="1.5"/>
        </svg>
        <span style="margin-left:0.7em;">Grande profondeur</span>
    </div>
    <div style="display:flex;align-items:center;">
        <svg viewBox="0 0 32 32" width="1.5em" height="1.5em" style="display:inline-block;">
            <circle cx="16" cy="16" r="7" fill="#41b6c4" stroke="#000" stroke-width="2"/>
        </svg>
        <span style="margin-left:0.7em;">Faible profondeur</span>
    </div>`;
    } else {
        html = "";
    }
    if (html) {
        legend.innerHTML = html;
        legend.style.display = "block";
    } else {
        legend.style.display = "none";
    }
}

// ------------------------------------------------------------------------------------------------------------------------------------------------------------------- //
// LES ANCIENS TRACES //

// Prendre la date la plus récente pour chaque point (borne basse) //
function sortDateBP(dateStr) {
    if (!dateStr) return null;
    if (dateStr.includes('-')) {
        return parseInt(dateStr.split('-')[1], 10);
    }
    return parseInt(dateStr, 10);
}

// Code couleur pour les 3 hypothèses //
function getColorByDateArnaud(dateStr) {
    const date = sortDateBP(dateStr);
    if (date < 500) return " #3aa8ec";
    if (date < 2000) return " #328fd8";
    if (date < 4000) return " #2a77c5";
    if (date < 6000) return " #215fb1";
    if (date < 8000) return " #19479e";
    return " #112e8a";
}

function getColorByDateVella(dateStr) {
    const date = sortDateBP(dateStr);
    if (date < 350) return " #58ff42";
    if (date < 450) return " #4ddf37";
    if (date < 550) return " #42be2c";
    if (date < 5500) return " #379e21";
    if (date < 6000) return " #2b7e16";
    if (date < 7000) return " #205d0b";
    return " #153d00";
}

function getColorByDateMartinez(dateStr) {
    const date = sortDateBP(dateStr);
    if (date < 500) return " #ff42b3";
    if (date < 1100) return " #eb43b4";
    if (date < 2800) return " #d745b6";
    if (date < 3000) return " #c346b7";
    if (date < 4000) return " #b048b9";
    if (date < 7000) return " #9c49ba";
    return " #884bbc";
}

// Prendre le bon style pour chaque date //
function styleArnaudFassetta(feature) {
    return {
        color: getColorByDateArnaud(feature.properties["Date (BP)"]),
        weight: 3
    };
}

function styleVella(feature) {
    return {
        color: getColorByDateVella(feature.properties["Date (BP)"]),
        weight: 3
    };
}

function styleMartinez(feature) {
    return {
        color: getColorByDateMartinez(feature.properties["Date (BP)"]),
        weight: 3
    };
}

// Appliquer le style sur les couches //
var arnaudFassettaLayer = L.geoJSON(Arnaud_Fassetta, {
    style: styleArnaudFassetta
});
var vellaLayer = L.geoJSON(Vella, {
    style: styleVella
});
var martinezLayer = L.geoJSON(Martinez, {
    style: styleMartinez
});

var baseMaps = {
    "Arnaud-Fassetta et al., 2015": arnaudFassettaLayer,
    "Vella et al., 2005": vellaLayer,
    "Martinez et al., 2024": martinezLayer
};
L.control.layers(baseMaps, null, { collapsed: false, position: 'bottomleft' }).addTo(map);

// Ajouter un titre à la box des couches //
setTimeout(() => {
    const layersBox = document.querySelector('.leaflet-control-layers');
    if (layersBox) {
        const title = document.createElement('div');
        title.textContent = "Hypothèses des anciens tracés du Delta du Rhône";
        title.style.fontWeight = "bold";
        title.style.margin = "1% 2%";
        layersBox.insertBefore(title, layersBox.firstChild);
    }
}, 100);

// Ajouter les légendes pour les différentes couches //
var arnaudLegend = L.control({ position: 'bottomleft' });
arnaudLegend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = `
        <b>Hypothèse de tracés - Arnaud-Fassetta</b><br>
        <i style="background: #3aa8ec;width:18px;height:10px;display:inline-block;"></i> 300 BP<br>
        <i style="background: #328fd8;width:18px;height:10px;display:inline-block;"></i> 2150 - 1750 BP<br>
        <i style="background: #2a77c5;width:18px;height:10px;display:inline-block;"></i> 4500 - 3000 BP<br>
        <i style="background: #215fb1;width:18px;height:10px;display:inline-block;"></i> 6500 - 5000 BP<br>
        <i style="background: #19479e;width:18px;height:10px;display:inline-block;"></i> 7600 BP<br>
        <i style="background: #112e8a;width:18px;height:10px;display:inline-block;"></i> 9800 BP
    `;
    return div;
};

var vellaLegend = L.control({ position: 'bottomleft' });
vellaLegend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = `
        <b>Hypothèse de tracés - Vella</b><br>
        <i style="background: #58ff42;width:18px;height:10px;display:inline-block;"></i> 300 BP<br>
        <i style="background: #4ddf37;width:18px;height:10px;display:inline-block;"></i> 500 - 400 BP<br>
        <i style="background: #42be2c;width:18px;height:10px;display:inline-block;"></i> 2000 - 500 BP<br>
        <i style="background: #379e21;width:18px;height:10px;display:inline-block;"></i> 5600 - 5350 BP<br>
        <i style="background: #2b7e16;width:18px;height:10px;display:inline-block;"></i> 6000 - 5850 BP<br>
        <i style="background: #205d0b;width:18px;height:10px;display:inline-block;"></i> 6500 - 6000 BP<br>
        <i style="background: #153d00;width:18px;height:10px;display:inline-block;"></i> 7200 BP<br>
    `;
    return div;
};

var martinezLegend = L.control({ position: 'bottomleft' });
martinezLegend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = `
        <b>Hypothèse de tracés - Martinez</b><br>
        <i style="background: #ff42b3;width:18px;height:10px;display:inline-block;"></i> 1000 - 300 BP<br>
        <i style="background: #eb43b4;width:18px;height:10px;display:inline-block;"></i> 2000 - 1000 BP<br>
        <i style="background: #d745b6;width:18px;height:10px;display:inline-block;"></i> 2800 - 2000 BP<br>
        <i style="background: #c346b7;width:18px;height:10px;display:inline-block;"></i> 3000 - 2800 BP<br>
        <i style="background: #b048b9;width:18px;height:10px;display:inline-block;"></i> 4300 - 3000 BP<br>
        <i style="background: #9c49ba;width:18px;height:10px;display:inline-block;"></i> 7000 - 4300 BP<br>
        <i style="background: #884bbc;width:18px;height:10px;display:inline-block;"></i> 15000 - 7000 BP<br>
    `;
    return div;
};


// Ajoute la légende de l'hypothèse affichée //
function removeAllLegends() {
    map.removeControl(arnaudLegend);
    map.removeControl(vellaLegend);
    map.removeControl(martinezLegend);
}

map.on('baselayerchange', function(e) {
    removeAllLegends();
    if (e.name === "Arnaud-Fassetta et al., 2015") {
        arnaudLegend.addTo(map);
    }
    if (e.name === "Vella et al., 2005") {
        vellaLegend.addTo(map);
    }
    if (e.name === "Martinez et al., 2024") {
        martinezLegend.addTo(map);
    }
   
});

// Permet d'afficher le texte d'information avec le clilc sur la carte //
if (typeof map !== "undefined") {
    map.on('click', function(e) {
        if (!e.originalEvent.target.closest('.leaflet-interactive')) {
            if (typeof showProjectInfo === 'function') showProjectInfo();
        }
    });
}