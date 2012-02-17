(function() {
  var $, FavtileApp, Tweet, Tweets, favs_url, lookup_url, profile_image_url, search_url, twapi, twapi_post, twapi_url;
  var __hasProp = Object.prototype.hasOwnProperty, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (!Array.prototype.reduce) {
    Array.prototype.reduce = function(fun) {
      var i, len, rv;
      len = this.length;
      if (typeof fun !== "function") throw new TypeError();
      if (len === 0 && arguments.length === 1) throw new TypeError();
      i = 0;
      if (arguments.length >= 2) {
        rv = arguments[1];
      } else {
        while (true) {
          if (i in this) {
            rv = this[i++];
            break;
          }
          if (++i >= len) throw new TypeError();
          if (!true) break;
        }
      }
      while (i < len) {
        if (i in this) rv = fun.call(null, rv, this[i], i, this);
        i++;
      }
      return rv;
    };
  }

  $ = jQuery;

  twapi_url = function(path, params) {
    var k, v;
    params = ((function() {
      var _results;
      _results = [];
      for (k in params) {
        if (!__hasProp.call(params, k)) continue;
        v = params[k];
        _results.push("" + k + "=" + (encodeURIComponent(v)));
      }
      return _results;
    })()).join("&");
    return "https://api.twitter.com/1" + path + ".json?include_entities=true&suppress_response_codes=true&" + params + "&callback=?";
  };

  lookup_url = function(screen_name) {
    if (!screen_name) throw "screen_name is missing.";
    if (twitter) {
      return "/api/lookup/" + (encodeURIComponent(screen_name));
    } else {
      return twapi_url("/users/lookup", {
        screen_name: screen_name
      });
    }
  };

  favs_url = function(id, page) {
    if (page == null) page = 1;
    if (!id) throw "twitter id is missing.";
    if (twitter) {
      return "/api/favs/" + (encodeURIComponent(id)) + "/" + page;
    } else {
      return twapi_url("/favorites", {
        id: id,
        page: page,
        count: 20
      });
    }
  };

  search_url = function(q, page) {
    if (page == null) page = 1;
    if (!q) throw "search query is missing.";
    if (twitter) {
      return "/api/search/" + (encodeURIComponent(q)) + "/" + page;
    } else {
      return twapi_url("/search", {
        q: q,
        rpp: 100,
        result_type: "mixed"
      });
    }
  };

  profile_image_url = function(screen_name, size) {
    if (size == null) size = "normal";
    return "https://api.twitter.com/1/users/profile_image?screen_name=" + (encodeURIComponent(screen_name)) + "&size=" + (encodeURIComponent(size));
  };

  twapi = function(url, callback) {
    return ($.getJSON(url, function(json) {
      var error, _i, _len, _ref;
      console.log(json);
      if (json.errors != null) {
        _ref = json.errors;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          error = _ref[_i];
          if (error.code !== 17) {
            $("#error").append($("<p>").text("" + error.message));
          }
        }
      } else if (json.error != null) {
        $("#error").append($("<p>").text("" + json.error));
      }
      return callback(json);
    })).error(function() {
      return $("#error").append($("<p>").text("loading error occurred. please refresh this page."));
    });
  };

  twapi_post = function(url, callback) {
    return ($.post(url, {
      csrf: csrf
    }, callback)).error(function() {
      return $("#error").append($("<p>").text("loading error occurred. please refresh this page."));
    });
  };

  Tweets = (function() {

    __extends(Tweets, Spine.Controller);

    Tweets.prototype.events = {
      "click .fav_button": "fav",
      "click .retweet_button": "retweet"
    };

    Tweets.prototype.elements = {
      ".fav_button img": "fav_button_img",
      ".retweet_button img": "retweet_button_img"
    };

    function Tweets() {
      this.render = __bind(this.render, this);
      this.fav = __bind(this.fav, this);
      this.twUpdate = __bind(this.twUpdate, this);
      this.twLoadingRt = __bind(this.twLoadingRt, this);
      this.twLoadingFav = __bind(this.twLoadingFav, this);      Tweets.__super__.constructor.apply(this, arguments);
      this.item.bind("loading_fav", this.twLoadingFav);
      this.item.bind("loading_rt", this.twLoadingRt);
      this.item.bind("update", this.twUpdate);
      this.item.bind("create", this.render);
      this.item.bind("destroy", this.release);
    }

    Tweets.prototype.decorate = function(item) {
      var e, el, ent, entities, pos, sub, t, text, v, values, _i, _j, _len, _len2;
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
        ent = (function() {
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
                target: "_self",
                href: "/" + (encodeURIComponent(e.screen_name))
              }).text(sub);
            case "hashtags":
              return $("<a>").attr({
                "class": "hashtags",
                target: "_self",
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
        })();
        el.append($(ent).embedly({
          key: '3e44f228543a11e184354040d3dc5c07',
          maxWidth: 200,
          words: 0,
          chars: 0
        }).bind('embedly-oembed', function() {
          return setTimeout((function() {
            return $(".items").masonry('reload');
          }), 1000);
        }));
      }
      el.append(text.substr(pos));
      return el;
    };

    Tweets.prototype.twLoadingFav = function() {
      return $(this.fav_button_img).attr({
        src: "/tim.gif"
      });
    };

    Tweets.prototype.twLoadingRt = function() {
      return $(this.retweet_button_img).attr({
        src: "/tim.gif"
      });
    };

    Tweets.prototype.twUpdate = function() {
      $(this.fav_button_img).attr({
        src: this.item.favorited ? "star.png" : "star_w.png"
      });
      return $(this.retweet_button_img).attr({
        src: this.item.retweeted ? "rt.png" : "rt_w.png"
      });
    };

    Tweets.prototype.fav = function(e) {
      var _this = this;
      if (twitter) {
        this.item.trigger("loading_fav");
        if (this.item.favorited) {
          return twapi_post("/api/fav_destroy/" + this.item.id_str, function(json) {
            if (!((json.error != null) || (json.errors != null))) {
              _this.item.updateAttributes({
                favorited: false
              });
              return $.meow({
                title: "removed favorite.",
                message: _this.item.text
              });
            } else {
              _this.item.updateAttributes({
                favorited: true
              });
              return $.meow({
                message: "failed to remove favorite tweet."
              });
            }
          });
        } else {
          return twapi_post("/api/fav_create/" + this.item.id_str, function(json) {
            if (!((json.error != null) || (json.errors != null))) {
              _this.item.updateAttributes({
                favorited: true
              });
              return $.meow({
                title: "success to add favorite tweet.",
                message: _this.item.text,
                icon: _this.item.user.profile_image_url
              });
            } else {
              _this.item.updateAttributes({
                favorited: false
              });
              return $.meow({
                message: "failed to add favorite."
              });
            }
          });
        }
      } else {
        return $.meow({
          icon: "/favicon73x73.png",
          message: "Please sign in to add or remove favorite tweets."
        });
      }
    };

    Tweets.prototype.retweet = function(e) {
      var _this = this;
      if (twitter) {
        this.item.trigger("loading_rt");
        if (this.item.retweeted) {
          return twapi("/api/statuses/retweeted_by_me", function(retweets) {
            var retweet, rt, _i, _len;
            for (_i = 0, _len = retweets.length; _i < _len; _i++) {
              rt = retweets[_i];
              if (rt.retweeted_status.id_str === _this.item.id_str) retweet = rt;
            }
            if (retweet) {
              return twapi_post("/api/rt_destroy/" + retweet.id_str, function(json) {
                console.log(json);
                if (!((json.error != null) || (json.errors != null))) {
                  _this.item.updateAttributes({
                    retweeted: false
                  });
                  return $.meow({
                    message: "cancel retweet."
                  });
                } else {
                  _this.item.updateAttributes({
                    retweeted: true
                  });
                  return $.meow({
                    message: "failed to cancel retweet."
                  });
                }
              });
            } else {
              _this.item.updateAttributes({
                retweeted: true
              });
              return $.meow({
                message: "failed to cancel retweet."
              });
            }
          });
        } else if (confirm("Retweet this to your followers?")) {
          return twapi_post("/api/rt_create/" + this.item.id_str, function(json) {
            console.log(json);
            if (!((json.error != null) || (json.errors != null))) {
              _this.item.updateAttributes({
                retweeted: true
              });
              return $.meow({
                title: "success to retweet.",
                message: _this.item.text,
                icon: _this.item.user.profile_image_url
              });
            } else {
              _this.item.updateAttributes({
                retweeted: false
              });
              return $.meow({
                message: "failed to retweet."
              });
            }
          });
        } else {
          return this.item.updateAttributes(this.item.retweeted);
        }
      } else {
        return $.meow({
          icon: "/favicon73x73.png",
          message: "Please sign in to retweet this tweet."
        });
      }
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

    Tweet.configure("Tweet", "user", "text", "entities", "id_str", "created_at", "retweeted", "favorited", "from_user", "profile_image_url");

    Tweet.prototype.dateformat = function() {
      var d, date, time;
      d = new Date(this.created_at);
      date = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join("-");
      time = [d.getHours(), d.getMinutes(), d.getSeconds()].join(":");
      return "" + date + " " + time;
    };

    function Tweet(src) {
      this.dateformat = __bind(this.dateformat, this);      Tweet.__super__.constructor.call(this, src);
      if (!this.user) {
        this.user = {
          screen_name: this.from_user,
          profile_image_url: this.profile_image_url
        };
      }
    }

    return Tweet;

  })();

  FavtileApp = (function() {

    __extends(FavtileApp, Spine.Controller);

    FavtileApp.prototype.events = {
      "submit form": "userChange"
    };

    FavtileApp.prototype.elements = {
      "header .icon": "icon",
      ".items": "items",
      ".screen_name_input": "screen_name_input",
      ".loading": "loading_img",
      ".favs_footer": "favs_footer"
    };

    function FavtileApp() {
      this.setSearchInformation = __bind(this.setSearchInformation, this);
      this.moreFavs = __bind(this.moreFavs, this);
      this.addOne = __bind(this.addOne, this);
      this.userChange = __bind(this.userChange, this);
      var _ref;
      var _this = this;
      FavtileApp.__super__.constructor.apply(this, arguments);
      console.log("constructor of FavtileApp");
      Tweet.bind("create", this.addOne);
      Tweet.fetch();
      $(this.items).masonry({
        itemSelector: ".item"
      });
      this.screen_name = (_ref = /^\/(.*)/.exec(location.pathname)) != null ? _ref.pop() : void 0;
      if (this.screen_name) {
        $(this.icon).attr({
          src: profile_image_url(this.screen_name)
        });
        $(this.screen_name_input).val(encodeURIComponent(this.screen_name));
        $(window).bottom();
        $(window).bind("bottom", this.moreFavs);
        twapi(favs_url(this.screen_name), function(favs) {
          var fav, _i, _len;
          console.log("favs");
          for (_i = 0, _len = favs.length; _i < _len; _i++) {
            fav = favs[_i];
            Tweet.create(fav);
          }
          if (favs.length === 0) {
            return $(_this.favs_footer).append($("<p>").text("There is no favorite tweet of " + _this.screen_name + "."));
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
            Tweet.create(t);
          }
          if (result.results.length === 0) {
            return $(_this.favs_footer).append($("<p>").text("There are no tweets about #" + _this.location.hash));
          }
        });
      } else {
        $(".top_background").css({
          display: "block"
        });
      }
      $(window).bind('hashchange', function() {
        console.log("hash change");
        Tweet.destroyAll();
        $(_this.screen_name_input).val(decodeURIComponent(location.hash));
        return twapi(search_url(location.hash), function(result) {
          var t, _i, _len, _ref2, _results;
          console.log(result.results);
          _ref2 = result.results;
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            t = _ref2[_i];
            _results.push(Tweet.create(t));
          }
          return _results;
        });
      });
      this.before_data = this.screen_name || location.hash;
    }

    FavtileApp.prototype.userChange = function(e) {
      e.preventDefault();
      if ($(this.screen_name_input).val() !== this.before_data) {
        return location.href = "/" + ($(this.screen_name_input).val());
      }
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
          if ((favs.error != null) || (favs.errors != null)) {
            return "";
          } else if (favs.length !== 0) {
            for (_i = 0, _len = favs.length; _i < _len; _i++) {
              fav = favs[_i];
              Tweet.create(fav);
            }
            return _this.loading = false;
          } else {
            return $(_this.favs_footer).append($("<p>").text("There are no more favorite tweets of " + _this.screen_name + "."));
          }
        });
      }
    };

    FavtileApp.prototype.setSearchInformation = function() {
      return $(this.screen_name_input).val(decodeURIComponent(location.hash));
    };

    return FavtileApp;

  })();

  $(function() {
    return new FavtileApp({
      el: $("#favs")
    });
  });

}).call(this);
