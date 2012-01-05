$ = jQuery

lookup_url = (screen_name) ->
  throw "screen_name is missing." unless screen_name
  "https://api.twitter.com/1/users/lookup.json?screen_name=#{encodeURIComponent screen_name}&include_entities=true&suppress_response_codes=true&callback=?"

favs_url = (id, page = 1, count = 20) ->
  throw "twitter id is missing." unless id
  "https://api.twitter.com/1/favorites.json?id=#{encodeURIComponent id}&page=#{page}&count=#{count}&include_entities=true&suppress_response_codes=true&callback=?"

twapi = (url, callback) ->
  # for debug
  console.log JSON.parse localStorage[url] if localStorage[url]
  return callback JSON.parse localStorage[url] if localStorage[url]

  $.getJSON url, (json) ->
    console.log json
    localStorage[url] = JSON.stringify json
    throw "error: #{url}" if json.errors?
    callback json

class User extends Spine.Model
  @CACHE_TIME: 24 * 60 * 60 * 1000
  @configure "User", "screen_name", "profile_background_image_url_https", "profile_background_tile", "profile_background_color", "saved_at"
  @extend Spine.Model.Local
  @cache: (screen_name) ->
    user = @findByAttribute("screen_name", screen_name)
    if ((new Date).getTime() - User.CACHE_TIME) < user?.saved_at then user else null

class Fav extends Spine.Model
  @configure "Fav", "user", "text", "entities"

class Favs extends Spine.Controller
  constructor: ->
    super
    @item.bind("update", @render)

  render: =>
    @replace($("#favTemplate").tmpl(@item))

    v.type = t for v in values for own t, values of @item.entities
    entities = (v for own t, v of @item.entities).reduce((a, b) -> a.concat b).sort (a, b) -> a.indices[0] - b.indices[0]

    el = $("<p>")
    pos = 0
    for e in entities
      el.append @item.text.substr(pos, e.indices[0] - pos)
      pos = e.indices[1]
      sub = @item.text.substr(e.indices[0], e.indices[1] - e.indices[0])
      el.append switch e.type
          when "urls" then $("<a>").attr(target: "_blank", href: e.expanded_url).text e.expanded_url
          when "user_mentions" then $("<a>").attr(href: "/#{encodeURIComponent e.screen_name}").text sub
          when "hashtags" then sub
    el.append @item.text.substr(pos)
    $(@el).append el
    @

class FavtileApp extends Spine.Controller
  elements:
    ".items": "items"

  constructor: ->
    super
    console.log "constructor of FavtileApp"
    Fav.bind("create", @addOne)
    Fav.fetch()
    User.fetch()

    @screen_name = /^\/(.*)/.exec(location.pathname)?.pop()

    if @screen_name
      @set_background()

      # load next favs when detect scroll to bottom
      $(window).bottom()
      $(window).bind "bottom", @moreFavs

      # recent 20 favs
      twapi (favs_url @screen_name), (favs) ->
        Fav.create fav for fav in favs

  addOne: (fav) =>
    view = new Favs(item: fav)
    @items.append(view.render().el)

  moreFavs: =>
    console.log "favs"
    @page ?= 1
    @loading ?= false
    unless @loading
      console.log "bottom"
      @loading = true
      twapi (favs_url @screen_name, ++@page), (favs) =>
        if favs.length isnt 0
          Fav.create fav for fav in favs
          @loading = false

  set_background: =>
    set_bg = (user) ->
      $('body').css
        'background-image': "url(#{user.profile_background_image_url_https})"
        'background-repeat': if user.profile_background_tile then "repeat" else "no-repeat"
        'background-color': "##{user.profile_background_color}"
        'background-attachment': "fixed"

    user = User.cache @screen_name
    if user
      set_bg user
    else
      twapi (lookup_url @screen_name), (users) ->
        user = users[0]
        set_bg user
        user.saved_at = (new Date).getTime()
        (User.create user).save()

$ ->
  new FavtileApp(el: $("#favs"))
