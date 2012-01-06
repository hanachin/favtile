(function() {
  var $, Fav, FavtileApp, Search, Tweet, Tweets, User, dateformat, favs_url, lookup_url, search_url, twapi;
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

  search_url = function(q, page, rpp) {
    if (page == null) page = 1;
    if (rpp == null) rpp = 100;
    if (!q) throw "search query is missing.";
    return "http://search.twitter.com/search.json?q=" + (encodeURIComponent(q)) + "&rpp=" + rpp + "&result_type=mixed&include_entities=true&suppress_response_codes=true&callback=?";
  };

  dateformat = function(d) {
    var date, time;
    date = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-");
    time = [d.getHours(), d.getMinutes(), d.getSeconds()].join(":");
    return "" + date + " " + time;
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

  Tweets = (function() {

    __extends(Tweets, Spine.Controller);

    function Tweets() {
      this.render = __bind(this.render, this);      Tweets.__super__.constructor.apply(this, arguments);
      this.item.bind("update", this.render);
      this.item.bind("destroy", this.release);
    }

    Tweets.prototype.decorate = function(item) {
      var e, el, entities, m, media, pos, sizes, sub, t, text, v, values, _i, _j, _k, _len, _len2, _len3;
      text = item.text, entities = item.entities;
      for (t in entities) {
        if (!__hasProp.call(entities, t)) continue;
        values = entities[t];
        for (_i = 0, _len = values.length; _i < _len; _i++) {
          v = values[_i];
          v.type = t;
        }
      }
      entities = ((function() {
        var _results;
        _results = [];
        for (t in entities) {
          if (!__hasProp.call(entities, t)) continue;
          v = entities[t];
          _results.push(v);
        }
        return _results;
      })()).reduce(function(a, b) {
        return a.concat(b);
      }).sort(function(a, b) {
        return a.indices[0] - b.indices[0];
      });
      el = $("<p>");
      pos = 0;
      for (_j = 0, _len2 = entities.length; _j < _len2; _j++) {
        e = entities[_j];
        el.append(text.substr(pos, e.indices[0] - pos));
        pos = e.indices[1];
        sub = text.substr(e.indices[0], e.indices[1] - e.indices[0]);
        el.append((function() {
          switch (e.type) {
            case "urls":
              return $("<a>").attr({
                "class": "urls",
                target: "_blank",
                href: e.expanded_url
              }).text(e.display_url);
            case "user_mentions":
              return $("<a>").attr({
                "class": "user_mentions",
                href: "/" + (encodeURIComponent(e.screen_name))
              }).text(sub);
            case "hashtags":
              return $("<a>").attr({
                "class": "hashtags",
                href: "/#" + (encodeURIComponent(e.text))
              }).text(sub);
            case "media":
              return $("<a>").attr({
                "class": "media",
                target: "_blank",
                href: e.expanded_url
              }).text(e.display_url);
            default:
              console.log("unknown entity type", e);
              return sub;
          }
        })());
      }
      el.append(text.substr(pos));
      media = (function() {
        var _k, _len3, _results;
        _results = [];
        for (_k = 0, _len3 = entities.length; _k < _len3; _k++) {
          e = entities[_k];
          if (e.type === "media") _results.push(e);
        }
        return _results;
      })();
      for (_k = 0, _len3 = media.length; _k < _len3; _k++) {
        m = media[_k];
        sizes = {
          width: m.sizes.thumb.w,
          height: m.sizes.thumb.h
        };
        el.append($("<img>").attr({
          "class": "media",
          src: "" + m.media_url + ":thumb"
        }).css(sizes));
      }
      return el;
    };

    Tweets.prototype.render = function() {
      this.replace($("#tweetTemplate").tmpl(this.item));
      $(this.el).find("div").prepend(this.decorate(this.item));
      return this;
    };

    return Tweets;

  })();

  Tweet = (function() {

    __extends(Tweet, Spine.Model);

    function Tweet() {
      this.dateformat = __bind(this.dateformat, this);
      Tweet.__super__.constructor.apply(this, arguments);
    }

    Tweet.prototype.dateformat = function() {
      return dateformat(new Date(this.created_at));
    };

    return Tweet;

  })();

  Search = (function() {

    __extends(Search, Tweet);

    function Search() {
      Search.__super__.constructor.apply(this, arguments);
    }

    Search.configure("Search", "from_user", "text", "entities", "id_str", "created_at", "profile_image_url");

    return Search;

  })();

  Fav = (function() {

    __extends(Fav, Tweet);

    function Fav() {
      Fav.__super__.constructor.apply(this, arguments);
    }

    Fav.configure("Fav", "user", "text", "entities", "id_str", "created_at");

    return Fav;

  })();

  FavtileApp = (function() {

    __extends(FavtileApp, Spine.Controller);

    FavtileApp.prototype.events = {
      "click .hashtags": "searchReload"
    };

    FavtileApp.prototype.elements = {
      ".items": "items"
    };

    function FavtileApp() {
      this.set_background = __bind(this.set_background, this);
      this.moreFavs = __bind(this.moreFavs, this);
      this.addOne = __bind(this.addOne, this);
      this.addSearchOne = __bind(this.addSearchOne, this);
      var _ref;
      FavtileApp.__super__.constructor.apply(this, arguments);
      console.log("constructor of FavtileApp");
      Fav.bind("create", this.addOne);
      Fav.fetch();
      Search.bind("create", this.addSearchOne);
      Search.fetch();
      User.fetch();
      $(this.items).masonry({
        itemSelector: ".item"
      });
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
      if (location.hash) {
        twapi(search_url(location.hash), function(result) {
          var t, _i, _len, _ref2, _results;
          console.log(result.results);
          _ref2 = result.results;
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            t = _ref2[_i];
            _results.push(Search.create(t));
          }
          return _results;
        });
      }
    }

    FavtileApp.prototype.searchReload = function(e) {
      Search.destroyAll();
      return twapi(search_url(e.target.text), function(result) {
        var t, _i, _len, _ref, _results;
        console.log(result.results);
        _ref = result.results;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          t = _ref[_i];
          _results.push(Search.create(t));
        }
        return _results;
      });
    };

    FavtileApp.prototype.addSearchOne = function(search) {
      var el, view;
      view = new Tweets({
        item: search
      });
      el = view.render().el;
      this.items.append(el);
      return $(this.items).masonry("appended", el).masonry('reload');
    };

    FavtileApp.prototype.addOne = function(fav) {
      var el, view;
      view = new Tweets({
        item: fav
      });
      el = view.render().el;
      this.items.append(el);
      return $(this.items).masonry("appended", el).masonry('reload');
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
          if (favs.length !== 0) {
            for (_i = 0, _len = favs.length; _i < _len; _i++) {
              fav = favs[_i];
              Fav.create(fav);
            }
            return _this.loading = false;
          }
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
