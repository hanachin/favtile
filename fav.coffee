twitter = require "express-twitter"
csrf = require "express-csrf"

port = Number(process.env.PORT || 3000)
baseURL = if process.env.NODE_ENV is "production"
  "http://favtile.com"
else
  "http://localhost:3000"

require("zappa") port, ->
  @use 'static', 'cookieParser', 'bodyParser'
    session: { secret: "kwae3n2j2nbjsduzhua2" }
    csrf.check()
    basicAuth:((u, p) -> u is 'hanachin' and p is 'zxcvbnm'),
    twitter.middleware
      consumerKey: "your consumer key"
      consumerSecret: "your consumer secret"
      baseURL: baseURL

  @helper needLoggedIn: (callback) ->
    if @session?.twitter?
      callback()
    else
      '{"error":"login first to use api."}'

  @app.dynamicHelpers csrf: csrf.token

  @post '/api/fav_create/:id': ->
    @needLoggedIn =>
      path = "/favorites/create/#{encodeURIComponent @params.id}.json?include_entities=true&suppress_response_codes=true"
      twitter.postJSON path, '', @request, (err, data, response) => @send data

  @post '/api/fav_destroy/:id': ->
    @needLoggedIn =>
      path = "/favorites/destroy/#{encodeURIComponent @params.id}.json?suppress_response_codes=true"
      twitter.postJSON path, '', @request, (err, data, response) => @send data

  @post '/api/rt_create/:id': ->
    @needLoggedIn =>
      path = "/statuses/retweet/#{encodeURIComponent @params.id}.json?include_entities=true&suppress_response_codes=true"
      twitter.postJSON path, '', @request, (err, data, response) => @send data

  @post '/api/rt_destroy/:id': ->
    @needLoggedIn =>
      path = "/statuses/destroy/#{encodeURIComponent @params.id}.json?suppress_response_codes=true"
      twitter.postJSON path, '', @request, (err, data, response) => @send data

  @get '/api/statuses/retweeted_by_me': ->
    @needLoggedIn =>
      path = "/statuses/retweeted_by_me.json?count=100&include_entities=true&suppress_response_codes=true"
      twitter.getJSON path, @request, (err, data, response) => @send data

  @get '/api/lookup/:screen_name': ->
    path = "/users/lookup.json?screen_name=#{encodeURIComponent @params.screen_name}&include_entities=true&suppress_response_codes=true"
    @needLoggedIn =>
      twitter.getJSON path, @request, (err, data, response) => @send data

  @get '/api/search/:q/:page': ->
    path = "/search.json?q=#{encodeURIComponent @params.q}&rpp=100&result_type=mixed&include_entities=true&suppress_response_codes=true"
    @needLoggedIn =>
      twitter.getJSON path, @request, (err, data, response) => @send data

  @get '/api/favs/:id/:page': ->
    path = "/favorites.json?id=#{encodeURIComponent @params.id}&page=#{@params.page}&count=20&include_entities=true&suppress_response_codes=true"
    @needLoggedIn =>
      twitter.getJSON path, @request, (err, data, response) => @send data

  @get '/?:id?': ->
    @render 'index', id: (@params.id ? ""), session: @session

  @view index: ->
    script id: 'tweetTemplate', type: 'x-jquery-tmpl', ->
      div class: "item", ->
        a class: "icon_link", href: "/${user.screen_name}", -> img class:"icon", src: "${user.profile_image_url}"
        a class: "screen_name", href: "/${user.screen_name}", -> "${user.screen_name}"
        p class: "item_content", ->
        footer class:"item_footer", ->
          div class: "tools", ->
            span class: "fav_button", ->
              text "{{if favorited}}"
              img src:"/star.png"
              text "{{else}}"
              img src:"/star_w.png"
              text "{{/if}}"
              span class:"star", -> "fav"
            text " | "
            span class: "retweet_button", ->
              text "{{if retweeted}}"
              img src:"/rt.png"
              text "{{else}}"
              img src:"/rt_w.png"
              text "{{/if}}"
              span class:"rt", -> "RT"
            text " | "
            span class: "user_button", ->
              a href: "http://twitter.com/${user.screen_name}", target:"_blank", ->
                img src:"/user.png"
                span class:"user", -> "user"
    script src: '/fav-client.js', charset: 'utf-8'
    div id: "favs", ->
      header ->
        img class:"icon", src:"/favicon73x73.png"
        form ->
          input class:"screen_name_input", type: 'text'
          input class:"favtile_button", type: 'submit', value: "favtile!"
      div class: 'items'
      footer class: "favs_footer", ->
        img class:"loading", src: "ajax-loader.gif"
        p id:"error"

  @view layout: ->
    doctype 5
    html ->
      head ->
        meta charset: "utf-8"
        title "Favtile"
        link rel: 'stylesheet', href: '/screen.css'
        link rel: 'stylesheet', href: '/jquery.meow.css'
        script src: '/jquery-1.7.1.min.js', charset: 'utf-8'
        script src: '/jquery.tmpl.min.js', charset: 'utf-8'
        script src: '/jquery.bottom-1.0.js', charset: 'utf-8'
        script src: '/jquery.masonry.min.js', charset: 'utf-8'
        script src: '/jquery.meow.js', charset: 'utf-8'
        script src: '/spine.js', charset: 'utf-8'
        script charset: 'utf-8', ->
          if @session?.twitter?
            text "twitter = true;"
          else
            text "twitter = false;"
          text "csrf=\"#{@csrf}\";"
      body ->
        header class:"global_header", ->
          h1 ->
            a href: "/", ->
              img class: "logo", alt: "Favtile", src: "/logo.png"
          nav ->
            if @id isnt ""
              if @session?.twitter
                a class:"signout", href: "/sessions/logout", -> "Sign out"
              else
                a class:"signin", href: "/sessions/login", -> "Sign in with Twitter"
        div class: "content", ->
          @body
        footer class: "global_footer", ->
