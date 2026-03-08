/**
 * Kindle Games - Scale to Fit
 * ES5 strictly compliant for Kindle Legacy Webkit
 */
(function() {
    // Immediate scan to see if we can catch the container before full paint
    var container = document.querySelector('.container');
    
    function adjustScale() {
        if (!container) {
            container = document.querySelector('.container');
            if (!container) return;
        }

        var viewportWidth = window.innerWidth;
        var baseWidth = 500; // Kindle's target width
        var maxScale = 1.5; // Limit how much it can grow on desktop/large phones

        // Only scale if the screen is NOT a Kindle (which is usually around 600px)
        // or if it's smaller than our base layout.
        if (viewportWidth < baseWidth || (navigator.userAgent.indexOf('Kindle') === -1 && viewportWidth !== baseWidth)) {
            var scale = viewportWidth / baseWidth;
            
            // Limit the maximum scale
            if (scale > maxScale) {
                scale = maxScale;
            }

            // Apply scale
            container.style.webkitTransform = 'scale(' + scale + ')';
            container.style.mozTransform = 'scale(' + scale + ')';
            container.style.msTransform = 'scale(' + scale + ')';
            container.style.transform = 'scale(' + scale + ')';

            // Origin top center for proper alignment
            container.style.webkitTransformOrigin = 'top center';
            container.style.mozTransformOrigin = 'top center';
            container.style.msTransformOrigin = 'top center';
            container.style.transformOrigin = 'top center';

            // Add margin bottom to account for scaled height collapse in parent
            // Since scale() doesn't affect document flow layout
            var scaledHeight = container.offsetHeight * scale;
            var marginNeeded = scaledHeight - container.offsetHeight;
            if (marginNeeded > 0) {
                document.body.style.marginBottom = marginNeeded + 'px';
            } else {
                document.body.style.marginBottom = '0px';
            }
        } else {
            // Reset if screen is large enough (e.g. Kindle or Desktop)
            container.style.transform = 'none';
            container.style.webkitTransform = 'none';
            container.style.marginTop = '0px';
            document.body.style.marginBottom = '0px';
        }
    }

    // Run on load and as early as possible
    if (window.addEventListener) {
        window.addEventListener('DOMContentLoaded', adjustScale, false);
        window.addEventListener('load', adjustScale, false);
        window.addEventListener('resize', adjustScale, false);
    } else if (window.attachEvent) {
        window.attachEvent('onload', adjustScale);
        window.attachEvent('onresize', adjustScale);
    }

    // Immediate attempt - this handles the case where the script is at the bottom
    adjustScale();
})();
