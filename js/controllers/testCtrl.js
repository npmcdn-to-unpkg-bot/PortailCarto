

app.controller('testCtrl', [ '$scope', '$routeParams','mapsServices','leafletServices', '$location',
    'filterFilter','$http','$sce','$rootScope','$window',

  function($scope, $routeParams, mapsServices, leafletServices, $location, filterFilter, $http, $sce, $rootScope, $window) {
    $scope.mapinfo = mapsServices.getOne($routeParams.mapsId);

    if (! mapsServices.maps.length) {
      var dfd = mapsServices.loadData();
      dfd.then(function() {
        $scope.mapinfo = mapsServices.getOne($routeParams.mapsId);
        //$scope.$apply();
      });
    }

    $scope.$watch('mapinfo', function(scope){
      if (!$scope.mapinfo) {
        return;
      }

      if ($scope.map) {
        map.remove();
      }
      map = L.map('mapc', { zoomControl:true });
      $scope.map = map;

      //Display layers
      layerscontrol = [];
      angular.forEach($scope.mapinfo.layers.overlays, function(value, key) {
        if (value.type == 'geojson') {
          $http.get(value.url).then(
            function(results) {
              var lgeojson = new L.geoJson(results.data,eval("("+(value.options || {}) +")"));
              var feature_group = new L.featureGroup([]);
              feature_group.addLayer(lgeojson);
              map.addLayer(feature_group);
              layerscontrol[value.name] =feature_group ;
              layersControl.addOverlay(feature_group, value.name);
            }
          );
        }
        else {
          var l = leafletServices.loadData(value);
          map.addLayer(l.map);
          layerscontrol[l.name] = l.map;
        }
      }, $http);

      //Center
      if ($scope.mapinfo.center) {
        map.setView([$scope.mapinfo.center.lat, $scope.mapinfo.center.lng], $scope.mapinfo.center.zoom);
      }

      //baselayers
      $scope.baselayers = [];
      angular.forEach($scope.mapinfo.layers.baselayers, function(value, key) {
        var l = leafletServices.loadData(value);
        $scope.baselayers[key] = l;
        if (value.active) {
          $scope.baselayers[key].map.addTo(map);
        }
      });

      //Geosearch
      if (($scope.mapinfo.geosearch) && ($window.innerWidth>1000)) {
        var osmGeocoder = new L.Control.OSMGeocoder({
            collapsed: false,
            position: 'topright',
            text: 'Rechercher',
          });
        osmGeocoder.addTo(map);
      }

      //Control Layers
      var layersControl = L.control.layers({},layerscontrol,{collapsed:true}).addTo(map);

      //Legend
      if ($scope.mapinfo.legend) {
        var legend = L.control({position: 'bottomright'});
        legend.onAdd = function (map) {
          var div = L.DomUtil.create('div', 'info legend  visible-lg');
          div.innerHTML =$sce.trustAsHtml($scope.mapinfo.legend);
          return  div;
        };
        legend.addTo(map);
      }
      return $scope;
    }, true);


    $scope.changeTiles = function(nummap) {
      if ($scope.baselayers[nummap].active) {
        map.removeLayer($scope.baselayers[nummap].map);
        $scope.baselayers[nummap].active = false;
      }
      else {
        $scope.baselayers[nummap].map.addTo(map);
        $scope.baselayers[nummap].active = true;
      }
      angular.forEach($scope.baselayers, function(value, key) {
        if (key != nummap) {
          map.removeLayer($scope.baselayers[key].map);
          $scope.baselayers[key].active = false;
        }
      });
    };

    $scope.l_prev_sel = null;
    $scope.$on('feature:click', function(ev, item){
       if($scope.l_prev_sel != null && $scope.l_prev_sel.item.feature.geometry.type != "Point"){
            $scope.l_prev_sel.item.setStyle({color: $scope.l_prev_sel.color, fill: $scope.l_prev_sel.fill});
       }
       var prev_color = null;
       var prev_fill = null;
       if (item._layers) {
         for(x in item._layers){
             prev_color = item._layers[x].options.color;
             prev_fill = item._layers[x].options.fill;
             break;
         }
        }
        else {
          prev_color = item.options.color;
          prev_fill = item.options.fill;
        }
       $scope.l_prev_sel = {item: item, color: prev_color, fill:prev_fill};
       if(item.feature.geometry.type != "Point"){
          item.setStyle({color: 'yellow'});
        }
    });
  }

]);