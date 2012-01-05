(function() {
  var $, Fav, Favs, FavtileApp, User, favs_url, lookup_url, twapi;
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
      var e, el, entities, pos, sub, t, v, values, _i, _j, _len, _len2, _ref;
      this.replace($("#favTemplate").tmpl(this.item));
      _ref = this.item.entities;
      for (t in _ref) {
        if (!__hasProp.call(_ref, t)) continue;
        values = _ref[t];
        for (_i = 0, _len = values.length; _i < _len; _i++) {
          v = values[_i];
          v.type = t;
        }
      }
      entities = ((function() {
        var _ref2, _results;
        _ref2 = this.item.entities;
        _results = [];
        for (t in _ref2) {
          if (!__hasProp.call(_ref2, t)) continue;
          v = _ref2[t];
          _results.push(v);
        }
        return _results;
      }).call(this)).reduce(function(a, b) {
        return a.concat(b);
      }).sort(function(a, b) {
        return a.indices[0] - b.indices[0];
      });
      el = $("<p>");
      pos = 0;
      for (_j = 0, _len2 = entities.length; _j < _len2; _j++) {
        e = entities[_j];
        el.append(this.item.text.substr(pos, e.indices[0] - pos));
        pos = e.indices[1];
        sub = this.item.text.substr(e.indices[0], e.indices[1] - e.indices[0]);
        el.append((function() {
          switch (e.type) {
            case "urls":
              return $("<a>").attr({
                target: "_blank",
                href: e.expanded_url
              }).text(e.expanded_url);
            case "user_mentions":
              return $("<a>").attr({
                href: "/" + (encodeURIComponent(e.screen_name))
              }).text(sub);
            case "hashtags":
              return sub;
          }
        })());
      }
      el.append(this.item.text.substr(pos));
      $(this.el).append(el);
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
      this.set_background = __bind(this.set_background, this);
      this.moreFavs = __bind(this.moreFavs, this);
      this.addOne = __bind(this.addOne, this);
      var _ref;
      FavtileApp.__super__.constructor.apply(this, arguments);
      console.log("constructor of FavtileApp");
      Fav.bind("create", this.addOne);
      Fav.fetch();
      User.fetch();
      this.screen_name = (_ref = /^\/(.*)/.exec(location.pathname)) != null ? _ref.pop() : void 0;
      if (this.screen_name) {
        this.set_background();
        $(window).bottom();
        $(window).bind("bottom", this.moreFavs);
        twapi(favs_url(this.screen_name), function(favs) {
          var fav, _i, _len, _results;
          _results = [];
          for (_i = 0, _len = favs.length; _i < _len; _i++) {
            fav = favs[_i];
            _results.push(Fav.create(fav));
          }
          return _results;
        });
      }
    }

    FavtileApp.prototype.addOne = function(fav) {
      var view;
      view = new Favs({
        item: fav
      });
      return this.items.append(view.render().el);
    };

    FavtileApp.prototype.moreFavs = function() {
      var _ref, _ref2;
      var _this = this;
      console.log("favs");
      if ((_ref = this.page) == null) this.page = 1;
      if ((_ref2 = this.loading) == null) this.loading = false;
      if (!this.loading) {
        console.log("bottom");
        this.loading = true;
        return twapi(favs_url(this.screen_name, ++this.page), function(favs) {
          var fav, _i, _len;
          for (_i = 0, _len = favs.length; _i < _len; _i++) {
            fav = favs[_i];
            Fav.create(fav);
          }
          return _this.loading = false;
        });
      }
    };

    FavtileApp.prototype.set_background = function() {
      var set_bg, user;
      set_bg = function(user) {
        return $('body').css({
          'background-image': "url(" + user.profile_background_image_url_https + ")",
          'background-repeat': user.profile_background_tile ? "repeat" : "no-repeat",
          'background-color': "#" + user.profile_background_color,
          'background-attachment': "fixed"
        });
      };
      user = User.cache(this.screen_name);
      if (user) {
        return set_bg(user);
      } else {
        return twapi(lookup_url(this.screen_name), function(users) {
          user = users[0];
          set_bg(user);
          user.saved_at = (new Date).getTime();
          return (User.create(user)).save();
        });
      }
    };

    return FavtileApp;

  })();

  $(function() {
    return new FavtileApp({
      el: $("#favs")
    });
  });

}).call(this);
