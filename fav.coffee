twitter = require "express-twitter"

port = Number(process.env.PORT || 3000)

require("zappa") port, ->
  @use 'static', 'cookieParser',
    session: { secret: "kwae3n2j2nbjsduzhua2" }
    basicAuth:((u, p) -> u is 'hanachin' and p is 'zxcvbnm'),
    twitter.middleware
      consumerKey: "your consumer key"
      consumerSecret: "your consumer secret"
      baseURL: "http://localhost:3000"

  @get '/api/favs/:id/:page': ->
    path = "/favorites.json?id=#{encodeURIComponent @params.id}&page=#{@params.page}&count=20&include_entities=true&suppress_response_codes=true"
    if @session?.twitter?
      twitter.getJSON path, @request, (err, data, response) => @send data
    else
      "#{encodeURIComponent @query.callback}({errors:[{message:'login first to use api.'}]})"

  @get '/?:id?': ->
    @render 'index', id: (@params.id ? ""), session: @session

  @view index: ->
    script src: '/fav-client.js', charset: 'utf-8'
    section id: "favs", ->
      form ->
        input class:"screen_name_input", type: 'text'
        input class:"favtile_button", type: 'submit', value: "favtile!"
      div class: 'items'
      footer class: "loading_footer", ->
        img class:"loading", src: "ajax-loader.gif"

  @view layout: ->
    doctype 5
    html ->
      head ->
        meta charset: "utf-8"
        title "favtile"
        link rel: 'stylesheet', href: '/screen.css'
        script src: '/jquery-1.7.1.min.js', charset: 'utf-8'
        script src: '/jquery.tmpl.min.js', charset: 'utf-8'
        script src: '/jquery.bottom-1.0.js', charset: 'utf-8'
        script src: '/jquery.masonry.min.js', charset: 'utf-8'
        script src: '/spine.js', charset: 'utf-8'
        script src: '/local.js', charset: 'utf-8'
        script charset: 'utf-8', ->
          if @session?.twitter?
            "twitter = true"
          else
            "twitter = false"
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
              a class: "status", href: "http://twitter.com/${user.screen_name}/statuses/${id_str}", -> "${dateformat()}"
      body ->
        header class: "global", ->
          a href: "/", ->
            img class: "username", src: "/logo.png"
          if @session?.twitter
            a class:"signout", href: "/sessions/logout", -> "Sign out"
          else
            a class:"signin", href: "/sessions/login", -> "Sign in with Twitter"
        p id:"error"
        @body
