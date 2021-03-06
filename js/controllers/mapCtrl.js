app.controller('DetailMapController', [ '$scope', '$routeParams','MapsServices','baselayersServices',
	'overlaysServices', '$location', 'filterFilter','$http','$sce','$rootScope','$window',

	function($scope, $routeParams, MapsServices, baselayersServices, overlaysServices, $location,
		filterFilter, $http, $sce, $rootScope, $window) {
	$rootScope.mapinfo = MapsServices.getOne($routeParams.mapsId);

	if (! MapsServices.maps.length) {
		var dfd = MapsServices.loadData();
			dfd.then(function() {
			$scope.mapinfo = MapsServices.getOne($routeParams.mapsId);
			});
	}

	$scope.$watch('mapinfo', function(scope){
		if (!$scope.mapinfo) {
			return;
		}

		if ($scope.map) {
			map.remove();
		}
		map = L.map('mapx', {
			zoomControl: false
		});
		$scope.map = map;


		if ($rootScope.mapinfo && $rootScope.mapinfo.layers) {
			console.log("Nombre d'overlays dans le maps.json : " + $scope.mapinfo.layers.overlays.values['length']);
		}

	//Center
		if ($scope.mapinfo.center) {
			map.setView([$scope.mapinfo.center.lat, $scope.mapinfo.center.lng], $scope.mapinfo.center.zoom);
		}

	// Bounds control and min/max zoom control
	// Configuré dans le maps.json
		var southWest = L.latLng($scope.mapinfo.bounds.southWest.lat, $scope.mapinfo.bounds.southWest.long);
		var northEast = L.latLng($scope.mapinfo.bounds.northEast.lat, $scope.mapinfo.bounds.northEast.long);
		bounds = L.latLngBounds(southWest, northEast);
		map.options.maxBounds = bounds;
		map.options.minZoom = $scope.mapinfo.bounds.minZoom;
		map.options.maxZoom = $scope.mapinfo.bounds.maxZoom;

	//Geosearch
		if (($scope.mapinfo.geosearch) && ($window.innerWidth>800)) {
			var osmGeocoder = new L.Control.OSMGeocoder({
				collapsed: false,
				position: 'topright',
				text: 'Rechercher',
			});
			osmGeocoder.addTo(map);
		};

	// Zoom Control
		L.control.zoom({
			position: 'topright'
		}).addTo(map);

	//baselayers
		$scope.baselayers = [];
		angular.forEach($scope.mapinfo.layers.baselayers, function(value, key) {
			var l = baselayersServices.loadData(value);
			$scope.baselayers[key] = l;
			if (value.active) {
			$scope.baselayers[key].map.addTo(map);
			}
		});

	//overlays
		var overlaysObject = $scope.mapinfo.layers.overlays;
		var overlays = overlaysObject ? overlaysObject.values : null;
		var overlaysGroups = overlaysObject ? overlaysObject.groups : null;
		$scope.overlaysGroups = [];
		if (overlaysGroups) {
			$scope.overlaysGroups = overlaysGroups;
		}
		$scope.overlays = [];
		if (overlays && overlays.length > 0) {
			$scope.overlaysLoading = true;
			angular.forEach(overlays, function(value, key) {
				overlaysServices.getOverlay(value)
				.then(function (overlay) {
					$scope.overlays[key] = overlay;
					if (value.active) {
						$scope.overlays[key].feature.addTo(map);
					}
					if (overlays.length === $scope.overlays.length) {
						$scope.overlaysLoading = false;
					}
				});
			});
		}

	// Sidebar
		var sidebar = L.control.sidebar('sidebar').addTo(map);

	// Control emprise initiale EasyButton
		L.easyButton({
			position:"topright",
			states: [{
				icon: 'glyphicon glyphicon-home',
				title: 'Emprise initiale',
				onClick: function(control) {
					map.setView([$scope.mapinfo.center.lat, $scope.mapinfo.center.lng], $scope.mapinfo.center.zoom);
				}
			}]
		}).addTo(map);

	// Control échelle
		L.control.scale({
			imperial: false,
			position: 'bottomright',
			updateWhenIdle: false
		}).addTo(map);

	// Control FullScreen
		L.control.fullscreen({
				pseudoFullscreen: true // if true, fullscreen to page width and height
		}).addTo(map);



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

	$scope.toggleOverlay = function(overlay) {
		if (!overlay.active && map.hasLayer(overlay.feature)) {
			map.removeLayer(overlay.feature);
		}
		if (overlay.active && !map.hasLayer(overlay.feature)) {
			map.addLayer(overlay.feature);
		}
	};

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
			if (key !== nummap) {
				map.removeLayer($scope.baselayers[key].map);
				$scope.baselayers[key].active = false;
			}
		});
	};

	$scope.l_prev_sel = null;
	$scope.$on('feature:click', function(ev, item){
		if($scope.l_prev_sel !== null && $scope.l_prev_sel.item.feature.geometry.type !== "Point"){
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
		if(item.feature.geometry.type !== "Point"){
			item.setStyle({color: 'yellow'});
		}
	});
	}

]);
