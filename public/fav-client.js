(function() {
  var $, Fav, Favs, FavtileApp, User, favs_url, lookup_url, set_background, twapi;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  $ = jQuery;

  lookup_url = function(screen_name) {
    if (!screen_name) throw "screen_name is missing.";
    return "https://api.twitter.com/1/users/lookup.json?screen_name=" + (encodeURIComponent(screen_name)) + "&include_entities=true&suppress_response_codes=true&callback=?";
  };

  favs_url = function(id, page, count) {
    if (page == null) page = 1;
    if (count == null) count = 20;
    if (!id) throw "twitter id is missing.";
    return "https://api.twitter.com/1/favorites.json?id=" + (encodeURIComponent(id)) + "&page=" + page + "&count=" + count + "&include_entities=true&suppress_response_codes=true&callback=?";
  };

  twapi = function(url, callback) {
    if (localStorage[url]) console.log(JSON.parse(localStorage[url]));
    if (localStorage[url]) return callback(JSON.parse(localStorage[url]));
    return $.getJSON(url, function(json) {
      console.log(json);
      localStorage[url] = JSON.stringify(json);
      if (json.errors != null) throw "error: " + url;
      return callback(json);
    });
  };

  User = (function() {

    __extends(User, Spine.Model);

    function User() {
      User.__super__.constructor.apply(this, arguments);
    }

    User.CACHE_TIME = 24 * 60 * 60 * 1000;

    User.configure("User", "screen_name", "profile_background_image_url_https", "profile_background_tile", "profile_background_color", "saved_at");

    User.extend(Spine.Model.Local);

    User.cache = function(screen_name) {
      var user;
      user = this.findByAttribute("screen_name", screen_name);
      if (((new Date).getTime() - User.CACHE_TIME) < (user != null ? user.saved_at : void 0)) {
        return user;
      } else {
        return null;
      }
    };

    return User;

  })();

  Fav = (function() {

    __extends(Fav, Spine.Model);

    function Fav() {
      Fav.__super__.constructor.apply(this, arguments);
    }

    Fav.configure("Fav", "user", "text", "entities");

    return Fav;

  })();

  Favs = (function() {

    __extends(Favs, Spine.Controller);

    function Favs() {
      this.render = __bind(this.render, this);      Favs.__super__.constructor.apply(this, arguments);
      this.item.bind("update", this.render);
    }

    Favs.prototype.render = function() {
      this.replace($("#favTemplate").tmpl(this.item));
      return this;
    };

    return Favs;

  })();

  FavtileApp = (function() {

    __extends(FavtileApp, Spine.Controller);

    FavtileApp.prototype.elements = {
      ".items": "items"
    };

    function FavtileApp() {
      this.addOne = __bind(this.addOne, this);      FavtileApp.__super__.constructor.apply(this, arguments);
      console.log("constructor of FavtileApp");
      Fav.bind("create", this.addOne);
      Fav.fetch();
      User.fetch();
    }

    FavtileApp.prototype.addOne = function(fav) {
      var view;
      view = new Favs({
        item: fav
      });
      return this.items.append(view.render().el);
    };

    return FavtileApp;

  })();

  set_background = function(user) {
    return $('body').css({
      'background-image': "url(" + user.profile_background_image_url_https + ")",
      'background-repeat': user.profile_background_tile ? "repeat" : "no-repeat",
      'background-color': "#" + user.profile_background_color,
      'background-attachment': "fixed"
    });
  };

  $(function() {
    var loading, page, screen_name, user, _ref;
    new FavtileApp({
      el: $("#favs")
    });
    screen_name = (_ref = /^\/(.*)/.exec(location.pathname)) != null ? _ref.pop() : void 0;
    if (!screen_name) return;
    page = 1;
    loading = false;
    $(window).bottom();
    $(window).bind("bottom", function() {
      if (!loading) {
        console.log("bottom");
        loading = true;
        return twapi(favs_url(screen_name, ++page), function(favs) {
          var fav, _i, _len;
          for (_i = 0, _len = favs.length; _i < _len; _i++) {
            fav = favs[_i];
            Fav.create(fav);
          }
          return loading = false;
        });
      }
    });
    user = User.cache(screen_name);
    if (user) {
      set_background(user);
    } else {
      twapi(lookup_url(screen_name), function(users) {
        var user, _i, _len, _results;
        set_background(users[0]);
        _results = [];
        for (_i = 0, _len = users.length; _i < _len; _i++) {
          user = users[_i];
          user.saved_at = (new Date).getTime();
          _results.push((User.create(user)).save());
        }
        return _results;
      });
    }
    return twapi(favs_url(screen_name), function(favs) {
      var fav, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = favs.length; _i < _len; _i++) {
        fav = favs[_i];
        _results.push(Fav.create(fav));
      }
      return _results;
    });
  });

}).call(this);
