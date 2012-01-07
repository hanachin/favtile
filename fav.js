
  require("zappa")(function() {
    this.use('static');
    this.get({
      '/?:id?': function() {
        var _ref;
        return this.render('index', {
          id: (_ref = this.params.id) != null ? _ref : ""
        });
      }
    });
    this.view({
      index: function() {
        return section({
          id: "favs"
        }, function() {
          form(function() {
            input({
              "class": "screen_name_input",
              type: 'text'
            });
            return input({
              "class": "favtile_button",
              type: 'submit',
              value: "favtile!"
            });
          });
          div({
            "class": 'items'
          });
          return footer({
            "class": "loading_footer"
          }, function() {
            return img({
              "class": "loading",
              src: "ajax-loader.gif"
            });
          });
        });
      }
    });
    return this.view({
      layout: function() {
        doctype(5);
        return html(function() {
          head(function() {
            meta({
              charset: "utf-8"
            });
            title("favtile");
            link({
              rel: 'stylesheet',
              href: 'screen.css'
            });
            script({
              src: 'jquery-1.7.1.min.js',
              charset: 'utf-8'
            });
            script({
              src: 'jquery.tmpl.min.js',
              charset: 'utf-8'
            });
            script({
              src: 'jquery.bottom-1.0.js',
              charset: 'utf-8'
            });
            script({
              src: 'jquery.masonry.min.js',
              charset: 'utf-8'
            });
            script({
              src: 'spine.js',
              charset: 'utf-8'
            });
            script({
              src: 'local.js',
              charset: 'utf-8'
            });
            script({
              src: 'fav-client.js',
              charset: 'utf-8'
            });
            return script({
              id: 'tweetTemplate',
              type: 'x-jquery-tmpl'
            }, function() {
              text("{{if user}}");
              div({
                "class": "item"
              }, function() {
                a({
                  href: "/${user.screen_name}"
                }, function() {
                  return img({
                    "class": "icon",
                    src: "${user.profile_image_url}"
                  });
                });
                return div(function() {
                  return footer(function() {
                    a({
                      "class": "screen_name",
                      href: "/${user.screen_name}"
                    }, function() {
                      return "@${user.screen_name}";
                    });
                    text(" ");
                    return a({
                      "class": "status",
                      href: "http://twitter.com/${user.screen_name}/statuses/${id_str}"
                    }, function() {
                      return "${dateformat()}";
                    });
                  });
                });
              });
              text("{{else}}");
              div({
                "class": "item"
              }, function() {
                a({
                  href: "/${from_user}"
                }, function() {
                  return img({
                    "class": "icon",
                    src: "${profile_image_url}"
                  });
                });
                return div(function() {
                  return footer(function() {
                    a({
                      "class": "screen_name",
                      href: "/${from_user}"
                    }, function() {
                      return "@${from_user}";
                    });
                    text(" ");
                    return a({
                      "class": "status",
                      href: "http://twitter.com/${from_user}/statuses/${id_str}"
                    }, function() {
                      return "${dateformat()}";
                    });
                  });
                });
              });
              return text("{{/if}}");
            });
          });
          return body(function() {
            header(function() {
              return h1({
                "class": "username"
              }, function() {
                return "favtile";
              });
            });
            return this.body;
          });
        });
      }
    });
  });
