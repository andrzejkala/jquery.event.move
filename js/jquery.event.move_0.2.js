// jquery.event.move
// 
// 0.2
// 
// Stephen Band
// 
// Triggers 'movestart', 'move' and 'moveend' events after
// mousemoves following a mousedown cross a distance threshold,
// similar to the native 'dragstart', 'drag' and 'dragend' events.
// Move events are throttled to animation frames. Event objects
// passed to the bound handlers are augmented with the properties:
// 
// pageX:
// pageY:		Page coordinates of pointer.
// startX:
// startY:	Page coordinates of pointer at movestart.
// deltaX:
// deltaY:	Distance the pointer has moved since movestart.


(function(jQuery, undefined){
	
	var doc = jQuery(document),
			
			// Number of pixels moved before 'move' events are started
			
			threshold = 4,
			
			// Shim for requestAnimationFrame, falling back to timer. See:
			// see http://paulirish.com/2011/requestanimationframe-for-smart-animating/
			
			requestFrame = (function(){
				return (
					window.requestAnimationFrame ||
					window.webkitRequestAnimationFrame ||
					window.mozRequestAnimationFrame ||
					window.oRequestAnimationFrame ||
					window.msRequestAnimationFrame ||
					function(fn, element){
						return window.setTimeout(function(){
							fn(+new Date);
						}, 25);
					}
				);
			})();
	
	// CONSTRUCTOR
	
	function Timer(fn){
		var self = this,
				active = false;
		
		this.start = function timer(time){
			// If the timer has been kicked since
			// it was last queued, set it off again.
			if ( active ) {
				fn();
				active = false;
				requestFrame(timer);
			}
		};
		
		this.stop = function(){
			active = false;
		};
		
		this.kick = function(){
			var a = active;
			
			active = true;
			if (!a) { this.start(); }
		};
	}
	
	// FUNCTIONS
	
	function mousedown(e){
		var elem = jQuery(this),
				start = { x: e.pageX, y: e.pageY },
				obj, d, timer;
		
		function triggerEvents(e, delta, threshold){
			// Check if the threshold has been crossed
			if ((delta.x * delta.x) + (delta.y * delta.y) < (threshold * threshold)) { return; }
			
			// If it has, rewrite this function
			triggerEvents = function(e, delta, threshold) {
			  // Store latest values to be used by the update
			  obj = e;
			  d = delta;
			  
			  // Start or continue the frame timer
			  timer.kick();
			};
			
			// Register the update with the frame timer
			timer = new Timer(function(time){
				elem.triggerHandler('move', [obj, start, d]);
			});
			
			// Trigger the initial move events
			elem.triggerHandler('movestart', [e, start, {x: 0, y: 0}]);
			elem.triggerHandler('move', [e, start, delta]);
			
			// Bind the handler that will trigger moveend
			doc.bind('mouseup', mouseupend);
		}
		
		function mousemove(e){
			var delta = {
						x: e.pageX - start.x,
						y: e.pageY - start.y
					};
			
			triggerEvents(e, delta, threshold);
		}
		
		function mouseup(e){
			doc
			.unbind('mousemove', mousemove)
			.unbind('mouseup', mouseup);
		}
		
		function mouseupend(e) {
			var delta = {
						x: e.pageX - start.x,
						y: e.pageY - start.y
					};
			
			elem.triggerHandler('moveend', [e, start, delta]);
			timer.stop();
			doc.unbind('mouseup', mouseupend);
		}
		
		doc
		.bind('mousemove', mousemove)
		.bind('mouseup', mouseup);
	};
	
	function preventDefault(e){
		e.target === e.currentTarget && e.preventDefault();
	}
	
	function setup( data, namespaces, eventHandle ) {
		var special = jQuery.event.special;
		
		// Setup just once for all three events.
		delete special.movestart.setup;
		delete special.move.setup;
		delete special.moveend.setup;
		
		jQuery(this)
		.bind('mousedown.move', mousedown)
		
		// Stop the node from being dragged
		.bind('dragstart.move drag.move', preventDefault);
	}
	
	function teardown( namespaces ) {
		var elem = jQuery(this),
				events = elem.data('events'),
				special = jQuery.event.special;
		
		// If another move event is still setup,
		// don't teardown just yet.
		if (((events.movestart ? 1 : 0) +
				 (events.move ? 1 : 0) +
				 (events.moveend ? 1 : 0)) > 1) { return; }
		
		special.movestart.setup = setup;
		special.move.setup = setup;
		special.moveend.setup = setup;
		
		elem
		.unbind('mousedown', mousedown)
		.unbind('dragstart drag', preventDefault);
	}
	
	function add(handleObj) {
	  var handler = handleObj.handler;
	  
	  handleObj.handler = function(e, obj, start, delta) {
	  	e.deltaX = delta.x;
	  	e.deltaY = delta.y;
	  	e.startX = start.x;
	  	e.startY = start.y;
	  	e.pageX = obj.pageX;
	  	e.pageY = obj.pageY;
	  	
	  	// Call the originally-bound event handler and return its result.
	  	return handler.apply(this, arguments);
	  };
	}
	
	// DEFINE EVENTS
	
	jQuery.event.special.movestart =
	jQuery.event.special.move =
	jQuery.event.special.moveend = {
		setup: setup,
		teardown: teardown,
		add: add
	};
	
})(jQuery);