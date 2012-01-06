require("zappa") ->
  @use 'static'

  @get '/?:id?': ->
    @render 'index', id: (@params.id ? "")

  @view index: ->
    section id: "favs", ->
      input type: 'text'
      div class: 'items'
      footer

  @view layout: ->
    doctype 5
    html ->
      head ->
        meta charset: "utf-8"
        title "favtile"
        link rel: 'stylesheet', href: 'screen.css'
        script src: 'jquery-1.7.1.min.js', charset: 'utf-8'
        script src: 'jquery.tmpl.min.js', charset: 'utf-8'
        script src: 'jquery.bottom-1.0.js', charset: 'utf-8'
        script src: 'jquery.masonry.min.js', charset: 'utf-8'
        script src: 'spine.js', charset: 'utf-8'
        script src: 'local.js', charset: 'utf-8'
        script src: 'fav-client.js', charset: 'utf-8'
        script id: 'tweetTemplate', type: 'x-jquery-tmpl', ->
          div class: "item", ->
            text "{{if user}}"
            a href: "/${user.screen_name}", ->
              img class: "icon", src: "${user.profile_image_url}"
            div ->
              footer ->
                a class: "screen_name", href: "/${user.screen_name}", -> "@${user.screen_name}"
                text " "
                a class: "status", href: "http://twitter.com/${user.screen_name}/statuses/${id_str}", -> "${dateformat()}"
            text "{{else}}"
            a href: "/${from_user}", ->
              img class: "icon", src: "${profile_image_url}"
            div ->
              footer ->
                a class: "screen_name", href: "/${from_user}", -> "@${from_user}"
                text " "
                a class: "status", href: "http://twitter.com/${from_user}/statuses/${id_str}", -> "${dateformat()}"
            text "{{/if}}"
      body ->
        header ->
          h1 "favtile"
          if @id then h2 @id
        @body
