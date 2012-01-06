( function($) {
	$.fn.square = function( opt ) {
		var _set = {
			target : "square",
			inner : ".inner",
			scaleSplit : "_",
			size : 150,
			space : 10,
			speed : 700,
			ease : ""
		}
		if( opt ) $.extend( _set, opt );
		
		var _parent = $(this).css( {position:"relative"} );
		var _target = _parent.find( "*[class^="+_set.target+"]" ).css({position:"absolute"});
		var _resizeInter;
		var _prevWidth = _parent.outerWidth();
		setSize();
		setPosition( 0 );
		$(window).bind("resize",resizeStart);

		function resizeStart() {
			$(window).unbind("resize")
			_resizeInter = setInterval( resizeCheck, 500);
		}
		function resizeCheck() {
			_prevWidth = _parent.outerWidth();
			if( _prevWidth == _parent.outerWidth() ) {
			clearInterval( _resizeInter );
			$(window).bind("resize",resizeStart);
				resizeEnd();
			}
		}
		function resizeEnd() {
			setPosition( _set.speed );
		}
		
		function setSize() {
			_target.each( function(i) {
				var scale = getScale( $(this).attr("class") );
				var xsize = _set.size*scale.x+_set.space*(scale.x-1);
				var ysize = _set.size*scale.y+_set.space*(scale.y-1);

				$(this).css( { width:xsize, height:ysize } );
				if( $(this).find(_set.inner).length > 0 ) {
					var inner = $(this).find(_set.inner);
					inner.height( ysize );
					
					if( inner.outerHeight() > ysize ) {
						var height = inner.height()-( inner.outerHeight()-ysize );
						inner.height( height );
					}
				}
			} );
		}
		
		function setPosition( sp ) {
			var matrix = new Array();
			var mpos = new Object();
			var tHeight = 0;
			_target.each( function(i) {
				mpos = blankMatrix( matrix );
				
				var scale = getScale( $(this).attr("class") );
				var sizex = _set.size*scale.x+_set.space*(scale.x-1);
				var sizey = _set.size*scale.y+_set.space*(scale.y-1);
				var flag = true;
				
				if( checkSize( mpos.x, scale ) ) {
					mpos.x = 0;
					mpos.y ++;
				}
				while( matrixCheck( matrix, mpos.x, mpos.y, scale ) ) {
					mpos.x++;
					if( checkSize( mpos.x, scale ) ) {
						mpos.x = 0;
						mpos.y ++;
					}
				}
				
				for( var x=0; x<scale.x; x++ ) {
					for( var y=0; y<scale.y; y++ ) {
						if( !matrix[mpos.x+x] ) matrix[mpos.x+x] = new Array();
						matrix[mpos.x+x][mpos.y+y] = true;
					}
				}
				
				var pos = {
					x:_set.space+_set.size*mpos.x+_set.space*mpos.x,
					y:_set.space+_set.size*mpos.y+_set.space*mpos.y
				};
				if( sp > 0 ) {
					goTween( $(this), { left:pos.x, top:pos.y }, sp );
				} else {
					$(this).css( { left:pos.x, top:pos.y } );
				}
				
				tHeight = pos.y+sizey+_set.space > tHeight ? pos.y+sizey+_set.space : tHeight;
			} );
			if( sp > 0 ) {
				goTween( _parent, { height:tHeight }, sp );
			} else {
				_parent.css( { height:tHeight } );
			}
		}
		
		function getScale( clsName ) {
			var tmp = clsName.split(" ");
			for( i in tmp ) {
				if( tmp[i].match( _set.scaleSplit ) ) {
					var xNum = tmp[i].split( _set.scaleSplit )[1];
					var yNum = tmp[i].split( _set.scaleSplit )[2];
					if( xNum ) {
						if( yNum )
							return {x:xNum, y:yNum};
						else
							return {x:xNum, y:xNum};
					}
				}
			}
			return { x:1, y:1 };
		}
		
		function matrixCheck( matrix, x, y, scale ) {
			if( !matrix ) {
				return false;
			}
			for( var i=0; i<scale.x; i++ ) {
				for( var j=0; j<scale.y; j++ ) {
					if( !matrix[x+i] ) {
						continue;
					} else if( !matrix[x+i][y+j] ) {
						continue;
					}
					return matrix[x+i][y+j];
 				}
			}
			return false;
		}
		function blankMatrix( matrix ) {
			var pos = {x:0, y:0};
			while( matrixCheck( matrix, pos.x, pos.y, 1 ) ) {
				pos.x++;
				if( checkSize( pos.x, 1 ) ) {
					pos.x = 0;
					pos.y++;
				}
			}
			return pos;
		}
		function checkSize( x, scale ) {
			var size = _set.size*scale.x+_set.space*(scale.x-1);
			var tsize = _set.size*x+_set.space*(x+2) + size;
			return tsize >= _parent.outerWidth();
		}
		
		function goTween( jObj, prop, sp ) {
			if( _set.ease && $.easing[_set.ease] ) {
				jObj.animate( prop, sp, _set.ease );
			} else {
				jObj.animate( prop, sp );
			}
		}
		return $(this);
	}
} )(jQuery);