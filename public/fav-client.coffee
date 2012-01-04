$ = jQuery

lookup_url = (screen_name) ->
  throw "screen_name is missing." unless screen_name
  "https://api.twitter.com/1/users/lookup.json?screen_name=#{encodeURIComponent screen_name}&include_entities=true&suppress_response_codes=true&callback=?"

favs_url = (id, page = 1, count = 20) ->
  throw "twitter id is missing." unless id
  "https://api.twitter.com/1/favorites.json?id=#{encodeURIComponent id}&page=#{page}&count=#{count}&include_entities=true&suppress_response_codes=true&callback=?"

twapi = (url, callback) ->
  # for debug
  return callback JSON.parse localStorage[url] if localStorage[url]

  $.getJSON url, (json) ->
    console.log json
    localStorage[url] = JSON.stringify json
    throw "error: #{url}" if json.errors?
    callback json

class Fav extends Spine.Model
  @configure "Fav", "user", "text", "entities"

class Favs extends Spine.Controller
  constructor: ->
    super
    @item.bind("update", @render)

  render: =>
    @replace($("#favTemplate").tmpl(@item))
    @

class FavtileApp extends Spine.Controller
  elements:
    ".items": "items"

  constructor: ->
    super
    console.log "constructor of FavtileApp"
    Fav.bind("create", @addOne)
    Fav.fetch()

  addOne: (fav) =>
    view = new Favs(item: fav)
    @items.append(view.render().el)

set_background = (user) ->
  $('body').css
    'background-image': "url(#{user['profile_background_image_url_https']})"
    'background-repeat': if user["profile_background_tile"] then "repeat" else "no-repeat"
    'background-color': "##{user['profile_background_color']}"
    'background-attachment': "fixed"

$ ->
  new FavtileApp(el: $("#favs"))

  screen_name = /^\/(.*)/.exec(location.pathname)?.pop()
  return unless screen_name

  # setting the background
  twapi (lookup_url screen_name), (users) ->
    set_background users[0]

  twapi (favs_url screen_name), (favs) ->
    Fav.create fav for fav in favs
