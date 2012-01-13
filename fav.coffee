port = Number(process.env.PORT || 3000)
require("zappa") port, ->
  @use 'static'

  @get '/?:id?': ->
    @render 'index', id: (@params.id ? "")

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
        script id: 'tweetTemplate', type: 'x-jquery-tmpl', ->
          div class: "item", ->
            a class: "icon_link", href: "/${user.screen_name}", -> img class:"icon", src: "${user.profile_image_url}"
            p class: "item_content", ->
            footer class:"item_footer", ->
              a class: "screen_name", href: "/${user.screen_name}", -> "@${user.screen_name}"
              text " "
              a class: "status", href: "http://twitter.com/${user.screen_name}/statuses/${id_str}", -> "${dateformat()}"
      body ->
        header class: "global", ->
          a href: "/", ->
            img class: "username", src: "/logo.png", -> ""
        @body
