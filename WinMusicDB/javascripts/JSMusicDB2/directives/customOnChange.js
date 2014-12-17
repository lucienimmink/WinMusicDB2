jsmusicdb.directive('customOnChange', function() {
  'use strict';

  return {
    restrict: "A",
    link: function (scope, element, attrs) {
      var onChangeFunc = scope[attrs.customOnChange];
      element.bind('change', onChangeFunc);
    }
  };
});