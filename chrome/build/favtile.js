(function() {
  var addFavtileLink, favtile_link, x;

  x = function(xpath) {
    var args, node, nodes, snapshot;
    args = [xpath, document, null, XPathResult.ANY_TYPE, null];
    snapshot = document.evaluate.apply(document, args);
    nodes = [];
    while (node = snapshot.iterateNext()) {
      nodes.push(node);
    }
    return nodes;
  };

  favtile_link = function(screen_name) {
    var chrome_ext, fav_off, fav_on, host, icon, link;
    host = "http://favtile.com/";
    chrome_ext = "chrome-extension://dgllafjkaenhcopbiockdiibjkfgkago";
    fav_on = "" + chrome_ext + "/fav18x18on.png";
    fav_off = "" + chrome_ext + "/fav18x18off.png";
    link = $("<a>").attr({
      "class": "favtile",
      href: "" + host + screen_name,
      target: "_blank"
    });
    icon = $("<img>").attr({
      src: fav_off,
      width: 18,
      height: 18
    });
    icon.mouseover(function() {
      return $(this).attr({
        src: fav_on
      });
    });
    icon.mouseout(function() {
      return $(this).attr({
        src: fav_off
      });
    });
    return link.append(icon);
  };

  addFavtileLink = function() {
    var screen_name, screen_names, xpath, _i, _len, _results;
    xpath = "//span[@class='tweet-user-name' and count(./a[@class='favtile'])=0]//a";
    screen_names = (function() {
      var _i, _len, _ref, _results;
      _ref = x(xpath);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        screen_name = _ref[_i];
        if ($(screen_name).text() !== "") _results.push(screen_name);
      }
      return _results;
    })();
    _results = [];
    for (_i = 0, _len = screen_names.length; _i < _len; _i++) {
      screen_name = screen_names[_i];
      _results.push($(screen_name).before(favtile_link($(screen_name).text())));
    }
    return _results;
  };

  setInterval(addFavtileLink, 500);

}).call(this);
