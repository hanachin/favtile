OAuth = require("oauth").OAuth

port = Number(process.env.PORT || 3000)

oauth = new OAuth(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  "your oauth consumer key",
  "your oauth consumer secret key",
  "1.0",
  "http://localhost:3000/signin",
  "HMAC-SHA1"
)

require("zappa") port, ->
  @use 'static', 'cookieParser', session:{secret:"kwae3n2j2nbjsduzhua2"}, basicAuth:((u, p) -> u is 'hanachin' and p is 'zxcvbnm')

  @get '/signout': ->
    @session.user = undefined
    @session.oauth = {}
    @redirect "/"

  @get '/signin': ->
    if @session.oauth?.results
      @redirect "/"
      return

    oauth_token = @query.oauth_token
    oauth_verifier = @query.oauth_verifier
    if oauth_token and oauth_verifier and @session.oauth
      oauth.getOAuthAccessToken oauth_token, null, oauth_verifier,
        (err, oauth_access_token, oauth_access_token_secret, results) =>
          if err
            @send err, 500
          else
            @session.user = results.screen_name
            @session.oauth.results = results
            @session.oauth.oauth_access_token = oauth_access_token
            @session.oauth.oauth_access_token_secret = oauth_access_token_secret
            @redirect "/"
    else
      oauth.getOAuthRequestToken (err, oauth_token, oauth_token_secret, results) =>
        if err
          @send err, 500
        else
          @session.oauth =
            oauth_token: oauth_token
            oauth_token_secret: oauth_token_secret
            request_token_results: results
          @redirect "https://api.twitter.com/oauth/authorize?oauth_token=#{oauth_token}"

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
          if @session?.oauth?
            "oauth = #{JSON.stringify @session.oauth};"
          else
            "oauth = {};"
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
          if @session?.user?
            a class:"signout", href: "/signout", -> "Sign out"
          else
            a class:"signin", href: "/signin", -> "Sign in with Twitter"
        p id:"error"
        @body
