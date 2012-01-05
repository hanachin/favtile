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
        title "favtile"
        script src: 'jquery-1.7.1.min.js', charset: 'utf-8'
        script src: 'jquery.tmpl.min.js', charset: 'utf-8'
        script src: 'jquery.bottom-1.0.js', charset: 'utf-8'
        script src: 'spine.js', charset: 'utf-8'
        script src: 'local.js', charset: 'utf-8'
        script src: 'fav-client.js', charset: 'utf-8'
        script id: 'favTemplate', type: 'x-jquery-tmpl', ->
          div ->
            h3 "${user.screen_name}"
      body ->
        header ->
          h1 "favtile"
          if @id then h2 @id
        @body