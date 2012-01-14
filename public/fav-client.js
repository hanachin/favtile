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
    return $.getJSON(url, function(json) {
      console.log(json);
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

    User.configure("User", "screen_name", "profile_image_url", "profile_background_image_url_https", "profile_background_tile", "profile_background_color", "saved_at");

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

    Tweets.prototype.events = {
      "click .fav_button": "fav",
      "click .retweet_button": "retweet"
    };

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
      })()).reduce((function(a, b) {
        return a.concat(b);
      }), []).sort(function(a, b) {
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
          var _ref, _ref2, _ref3, _ref4;
          switch (e.type) {
            case "urls":
              return $("<a>").attr({
                "class": "urls",
                target: "_blank",
                href: (_ref2 = e.expanded_url) != null ? _ref2 : e.url
              }).text((_ref = e.display_url) != null ? _ref : e.url);
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
                href: (_ref4 = e.expanded_url) != null ? _ref4 : e.url
              }).text((_ref3 = e.display_url) != null ? _ref3 : e.url);
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

    Tweets.prototype.fav = function(e) {
      return console.log(this.item.id_str);
    };

    Tweets.prototype.retweet = function(e) {
      return console.log(this.item.id_str);
    };

    Tweets.prototype.render = function() {
      this.replace($("#tweetTemplate").tmpl(this.item));
      $(this.el).find(".item_content").replaceWith(this.decorate(this.item));
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

    Search.configure("Search", "user", "text", "entities", "id_str", "created_at", "from_user", "profile_image_url");

    function Search(obj) {
      Search.__super__.constructor.call(this, obj);
      this.user = {
        screen_name: this.from_user,
        profile_image_url: this.profile_image_url
      };
    }

    return Search;

  })();

  Fav = (function() {

    __extends(Fav, Tweet);

    function Fav() {
      Fav.__super__.constructor.apply(this, arguments);
    }

    Fav.configure("Tweet", "user", "text", "entities", "id_str", "created_at");

    return Fav;

  })();

  FavtileApp = (function() {

    __extends(FavtileApp, Spine.Controller);

    FavtileApp.prototype.events = {
      "submit form": "userChange",
      "focus .screen_name_input": "active",
      "blur .screen_name_input": "inactive"
    };

    FavtileApp.prototype.elements = {
      ".items": "items",
      ".screen_name_input": "screen_name_input",
      ".loading": "loading_img"
    };

    function FavtileApp() {
      this.setUserInformation = __bind(this.setUserInformation, this);
      this.setSearchInformation = __bind(this.setSearchInformation, this);
      this.moreFavs = __bind(this.moreFavs, this);
      this.addOne = __bind(this.addOne, this);
      this.addSearchOne = __bind(this.addSearchOne, this);
      this.userChange = __bind(this.userChange, this);
      this.inactive = __bind(this.inactive, this);
      this.active = __bind(this.active, this);
      var _ref;
      var _this = this;
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
        this.setUserInformation();
        $(window).bottom();
        $(window).bind("bottom", this.moreFavs);
        twapi(favs_url(this.screen_name), function(favs) {
          var fav, _i, _len;
          for (_i = 0, _len = favs.length; _i < _len; _i++) {
            fav = favs[_i];
            Fav.create(fav);
          }
          if (favs.length === 0) {
            return $(_this.el).find(".loading_footer").text("end of favotes.");
          }
        });
      } else if (location.hash) {
        $(this.screen_name_input).val(decodeURIComponent(location.hash));
        twapi(search_url(location.hash), function(result) {
          var t, _i, _len, _ref2;
          console.log(result.results);
          _ref2 = result.results;
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            t = _ref2[_i];
            Search.create(t);
          }
          if (result.results.length === 0) {
            return $(_this.el).find(".loading_footer").text("end of favotes.");
          }
        });
        $("header").append($("<a>").attr({
          href: "/"
        }).append($("<img>").attr({
          "class": "icon",
          src: "favicon73x73.png"
        })));
      } else {
        $("header").append($("<a>").attr({
          href: "/"
        }).append($("<img>").attr({
          "class": "icon",
          src: "favicon73x73.png"
        })));
      }
      $(window).bind('hashchange', function() {
        console.log("hash change");
        Search.destroyAll();
        $(_this.screen_name_input).val(decodeURIComponent(location.hash));
        return twapi(search_url(location.hash), function(result) {
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
      });
      this.before_data = this.screen_name;
      this.before_data || (this.before_data = location.hash);
    }

    FavtileApp.prototype.active = function() {
      return this.screen_name_input.addClass("active");
    };

    FavtileApp.prototype.inactive = function() {
      return this.screen_name_input.removeClass("active");
    };

    FavtileApp.prototype.userChange = function(e) {
      e.preventDefault();
      console.log($(this.screen_name_input).val());
      console.log(this.before_data);
      if ($(this.screen_name_input).val() !== this.before_data) {
        return location.href = "/" + ($(this.screen_name_input).val());
      }
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
        $(this.loading_img).toggle();
        return twapi(favs_url(this.screen_name, ++this.page), function(favs) {
          var fav, _i, _len;
          console.log("load");
          $(_this.loading_img).toggle();
          if (favs.length !== 0) {
            for (_i = 0, _len = favs.length; _i < _len; _i++) {
              fav = favs[_i];
              Fav.create(fav);
            }
            return _this.loading = false;
          } else {
            return console.log(_this.el.find(".loading_footer").text("end of favotes."));
          }
        });
      }
    };

    FavtileApp.prototype.setSearchInformation = function() {
      return $(this.screen_name_input).val(decodeURIComponent(location.hash));
    };

    FavtileApp.prototype.setUserInformation = function() {
      var set_bg, set_icon, user;
      var _this = this;
      set_bg = function(user) {
        return $("body").css({
          'background-image': "url(" + user.profile_background_image_url_https + ")",
          'background-repeat': user.profile_background_tile ? "repeat" : "no-repeat",
          'background-color': "#" + user.profile_background_color,
          'background-attachment': "fixed",
          'background-position': "0px 58px"
        });
      };
      set_icon = function(user) {
        return $("header").append($("<img>").attr({
          "class": "icon",
          src: user.profile_image_url
        }));
      };
      $(this.screen_name_input).val(this.screen_name);
      user = User.cache(this.screen_name);
      if (user) {
        set_bg(user);
        return set_icon(user);
      } else {
        return twapi(lookup_url(this.screen_name), function(users) {
          user = users[0];
          set_bg(user);
          set_icon(user);
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
