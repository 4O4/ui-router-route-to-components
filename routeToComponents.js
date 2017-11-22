(function(){
	'use strict';

	angular
	.module('ui.router.components', ['ui.router'])
	.config(registerComponentDecorator);

	var args2Array = function args2Array(_args) {
		return Array.prototype.slice.call(_args);
	};

	function bindResolves() {
		var injectNames = controller.$inject = ['$scope'].concat(args2Array(arguments));

		function controller($scope) {
			var injectValues = args2Array(arguments);
			for (var i = 1; i < injectValues.length; i++) {
				$scope[injectNames[i]] = injectValues[i];
			}
		}

		return controller;
	}

	var getCompInputs = function getCompInputs($injector, componentName, resolve) {
		return $injector.get(componentName + "Directive").map(function (directive) {
			var inputs = [];
			for (var key in directive.bindToController) {
				if (directive.bindToController.hasOwnProperty(key)) {
					var binding = directive.bindToController[key];
					
					if (!binding || !binding.length) {
						continue;
					}

					if (binding.length === 1) {
						inputs.push(key);
						continue;
					} 
					
					if (binding.substring(1, 2) === '?') {
						var resolveName = key;
						if (binding.length > 2) {
							resolveName = binding.substring(2);
						}
						
						if (resolve.hasOwnProperty(resolveName)) {
							inputs.push(resolveName);
						}
					} else {
						inputs.push(binding.substring(1));
					}
				}
			}
			return inputs;
		}).reduce(unnestR, []);
	};

	var unnestR = function unnestR(acc, array) {
		return acc.concat(array);
	};

	function setStateDef(stateDef, resolve) {
		stateDef.controllerProvider = function ($injector) {
			return bindResolves.apply(null, getCompInputs($injector, stateDef.component, resolve));
		};
		stateDef.controllerProvider.$inject = ['$injector'];

		stateDef.templateProvider = function ($injector) {
			var attrs = getCompInputs($injector, stateDef.component, resolve).map(function (key) {
				return kebobString(key) + '="' + key + '"';
			}).join(' ');

			var kebobName = kebobString(stateDef.component);

			return '<' + kebobName + ' ' + attrs + '></' + kebobName + '>';
		};
		stateDef.templateProvider.$inject = ['$injector'];
	}

	function kebobString(str) {
		return str.replace(/([A-Z])/g, function ($1) {
			return '-' + $1.toLowerCase();
		});
	}

	function registerComponentDecorator($stateProvider) {
		$stateProvider.decorator('component', function (stateDef, parent) {
			if (stateDef.component) {
				setStateDef(stateDef);
			}
			
			if (stateDef.views) {
				for (var view in stateDef.views) {
					if (stateDef.views[view].component) {
						setStateDef(stateDef.views[view], stateDef.resolve);
					}
				}
			}

			return stateDef.component;
		});
	}
	registerComponentDecorator.$inject = ['$stateProvider'];

}());