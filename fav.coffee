twitter = require "express-twitter"
csrf = require "express-csrf"
config = require('config')

port = Number(process.env.PORT || 3000)

require("zappa") port, ->
  @use 'static',
    'bodyParser'
    'cookieParser'
    session: { secret: "kwae3n2j2nbjsduzhua2" }
    csrf.check()
    twitter.middleware
      consumerKey: config.twitter.consumerKey
      consumerSecret: config.twitter.consumerSecret
      baseURL: config.baseURL
      afterLogin: "/redirect/"

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

  @get '/redirect/': ->
    @redirect "/#{(@session.prevID ? "")}"

  @get '/?:id?': ->
    @session.prevID = (@params.id ? "")
    @render 'index', id: (@params.id ? ""), session: @session

  @view index: ->
    script id: 'tweetTemplate', type: 'x-jquery-tmpl', ->
      div class: "item", ->
        a class: "icon_link", href: "/${user.screen_name}", -> img class:"icon", src: "${user.profile_image_url}", alt:"${user.screen_name} icon"
        a class: "screen_name", href: "/${user.screen_name}", -> "${user.screen_name}"
        p class: "item_content", ->
        footer class:"item_footer", ->
          div class: "tools", ->
            span class: "fav_button", ->
              text "{{if favorited}}"
              img src:"/star.png", alt:"favorited"
              text "{{else}}"
              img src:"/star_w.png", alt:"No favorite yet."
              text "{{/if}}"
              span class:"star", -> "fav"
            text " | "
            span class: "retweet_button", ->
              text "{{if retweeted}}"
              img src:"/rt.png", alt:"retweeted"
              text "{{else}}"
              img src:"/rt_w.png", alt:"No retweet yet."
              text "{{/if}}"
              span class:"rt", -> "RT"
            text " | "
            span class: "user_button", ->
              a href: "http://twitter.com/${user.screen_name}", target:"_blank", ->
                img src:"/user.png", alt:"Jump to twitter user page"
                span class:"user", -> "user"
    div id: "favs", ->
      header ->
        img class:"icon", src:"/favicon73x73.png", alt:"user icon"
        form ->
          input class:"screen_name_input", type: 'text'
          input class:"favtile_button", type: 'submit', value: "favtile!"
      div class: 'items'
      footer class: "favs_footer", ->
        img class:"loading", src: "ajax-loader.gif", alt:"Now loading..."
        p id:"error"

  @view layout: ->
    doctype 5
    html ->
      head ->
        meta charset: "utf-8"
        meta content:'Favtile', property:'og:site_name'
        meta content:'Favtile', property:'og:title'
        meta content:'Favtile maximize your twitter favorite activity.', property:'og:description'
        meta content:'http://favtile.com/', property:'og:url'
        meta content:'http://favtile.com/thumb.png', property:'og:image'
        meta content:'website', property:'og:type'
        meta content:'hanachin', property:'fb:admins'
        title "#Favtile"
        link rel: 'stylesheet', href: '/screen.css'
        link rel: 'stylesheet', href: '/jquery.meow.css'
        link rel: 'stylesheet', href: '/fancybox/jquery.fancybox-1.3.4.css'
        text "<!--[if lt IE 9]>"
        script src: '/html5.js', charset: 'utf-8'
        text "<![endif]-->"
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
          div class:"social_buttons", ->
            div class:"g-plusone", "data-size":"tall"
            text " "
            div
              class:"fb-like"
              "data-href":"http://favtile.com/"
              "data-send":"false"
              "data-width":"70"
              "data-show-faces":"true"
              "data-layout":"box_count"
            text " "
            a href:"https://twitter.com/share", class:"twitter-share-button", "data-via":"hanachin_", "data-count":"vertical", ->
              text "Tweet"
            script charset: 'utf-8', ->
              text "!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=\"//platform.twitter.com/widgets.js\";fjs.parentNode.insertBefore(js,fjs);}}(document,\"script\",\"twitter-wjs\");"
        div class: "content", ->
          @body
        div class:"top_background", ->
          img src: "top_background.png", alt: "Enter your twitter ID"
        footer class: "global_footer", ->
          if @id is ""
            text "Feedback:"
            a href:"http://twitter.com/hanachin_", -> text "@hanachin_"
        script src: '/jquery-1.7.1.min.js', charset: 'utf-8'
        script src: '/jquery.tmpl.min.js', charset: 'utf-8'
        script src: '/jquery.bottom-1.0.js', charset: 'utf-8'
        script src: '/jquery.masonry.min.js', charset: 'utf-8'
        script src: '/jquery.meow.js', charset: 'utf-8'
        script src: '/fancybox/jquery.fancybox-1.3.4.pack.js', charset: 'utf-8'
        script src: '/spine.js', charset: 'utf-8'
        script id: 'facebook-jssdk', src:'http://connect.facebook.net/ja_JP/all.js#xfbml=1'
        script src: '/fav-client.js', charset: 'utf-8'

        coffeescript ->
          _gaq = _gaq or []
          _gaq.push [ "_setAccount", "UA-28457578-1" ]
          _gaq.push [ "_trackPageview" ]
          do ->
            ga = document.createElement("script")
            ga.type = "text/javascript"
            ga.async = true
            ga.src = (if "https:" is document.location.protocol then "https://ssl" else "http://www") + ".google-analytics.com/ga.js"
            s = document.getElementsByTagName("script")[0]
            s.parentNode.insertBefore ga, s

        coffeescript ->
          do ->
            po = document.createElement("script")
            po.type = "text/javascript"
            po.async = true
            po.src = "https://apis.google.com/js/plusone.js"
            s = document.getElementsByTagName("script")[0]
            s.parentNode.insertBefore po, s

        script charset: 'utf-8', ->
          if @session?.twitter?
            text "twitter = true;"
          else
            text "twitter = false;"
          text "csrf=\"#{@csrf}\";"
