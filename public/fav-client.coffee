$ = jQuery

lookup_url = (screen_name) ->
  throw "screen_name is missing." unless screen_name
  "https://api.twitter.com/1/users/lookup.json?screen_name=#{encodeURIComponent screen_name}&include_entities=true&suppress_response_codes=true&callback=?"

favs_url = (id, page = 1, count = 20) ->
  throw "twitter id is missing." unless id
  "https://api.twitter.com/1/favorites.json?id=#{encodeURIComponent id}&page=#{page}&count=#{count}&include_entities=true&suppress_response_codes=true&callback=?"

search_url = (q, page = 1, rpp = 100) ->
  throw "search query is missing." unless q
  "http://search.twitter.com/search.json?q=#{encodeURIComponent q}&rpp=#{rpp}&result_type=mixed&include_entities=true&suppress_response_codes=true&callback=?"

dateformat = (d) ->
  date = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join "-"
  time = [d.getHours(), d.getMinutes(), d.getSeconds()].join ":"
  "#{date} #{time}"

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
  @configure "User", "screen_name", "profile_image_url", "profile_background_image_url_https", "profile_background_tile", "profile_background_color", "saved_at"
  @extend Spine.Model.Local
  @cache: (screen_name) ->
    user = @findByAttribute("screen_name", screen_name)
    if ((new Date).getTime() - User.CACHE_TIME) < user?.saved_at then user else null

class Tweets extends Spine.Controller
  constructor: ->
    super
    @item.bind("update", @render)
    @item.bind("destroy", @release)

  decorate: (item) ->
    {text: text, entities: entities} = item
    v.type = t for v in values for own t, values of entities
    entities = (v for own t, v of entities).reduce(((a, b) -> a.concat b), []).sort (a, b) -> a.indices[0] - b.indices[0]

    el = $("<p>")
    pos = 0
    for e in entities
      el.append text.substr(pos, e.indices[0] - pos)
      pos = e.indices[1]
      sub = text.substr(e.indices[0], e.indices[1] - e.indices[0])
      el.append switch e.type
        when "urls" then $("<a>").attr(class: "urls", target: "_blank", href: e.expanded_url).text e.display_url
        when "user_mentions" then $("<a>").attr(class: "user_mentions", href: "/#{encodeURIComponent e.screen_name}").text sub
        when "hashtags" then $("<a>").attr(class: "hashtags", href: "/##{encodeURIComponent e.text}").text sub
        when "media" then $("<a>").attr(class: "media", target: "_blank", href: e.expanded_url).text e.display_url
        else
          console.log "unknown entity type", e
          sub
    el.append text.substr(pos)

    media = (e for e in entities when e.type is "media")
    for m in media
      sizes = width: m.sizes.thumb.w, height: m.sizes.thumb.h
      el.append $("<img>").attr(class: "media", src: "#{m.media_url}:thumb").css(sizes)
    el

  render: =>
    @replace($("#tweetTemplate").tmpl(@item))
    $(@el).find("div").prepend @decorate @item
    @

class Tweet extends Spine.Model
  dateformat: => dateformat new Date @created_at

class Search extends Tweet
  @configure "Search", "from_user", "text", "entities", "id_str", "created_at", "profile_image_url"

class Fav extends Tweet
  @configure "Fav", "user", "text", "entities", "id_str", "created_at"

# class Searches extends Tweets
# class Favs extends Tweets

class FavtileApp extends Spine.Controller
  events:
    "submit form": "userChange"
    "focus .screen_name_input": "active"
    "blur .screen_name_input": "inactive"

  elements:
    ".items": "items"
    ".screen_name_input": "screen_name_input"
    ".loading": "loading_img"

  constructor: ->
    super
    console.log "constructor of FavtileApp"
    Fav.bind("create", @addOne)
    Fav.fetch()
    Search.bind("create", @addSearchOne)
    Search.fetch()
    User.fetch()
    $(@items).masonry(itemSelector: ".item")

    @screen_name = /^\/(.*)/.exec(location.pathname)?.pop()

    if @screen_name
      @setUserInformation()

      # load next favs when detect scroll to bottom
      $(window).bottom()
      $(window).bind "bottom", @moreFavs

      # recent 20 favs
      twapi (favs_url @screen_name), (favs) =>
        Fav.create fav for fav in favs
        if favs.length is 0 then $(@el).find(".loading_footer").text("end of favotes.")

    else if location.hash
      $(@screen_name_input).val decodeURIComponent location.hash
      twapi (search_url location.hash), (result) =>
        console.log result.results
        Search.create t for t in result.results
        if result.results.length is 0 then $(@el).find(".loading_footer").text("end of favotes.")
      $("header").append $("<a>").attr(href: "/").append $("<img>").attr class:"icon", src:"favicon73x73.png"
    else
      $("header").append $("<a>").attr(href: "/").append $("<img>").attr class:"icon", src:"favicon73x73.png"

    $(window).bind 'hashchange', =>
      console.log "hash change"
      Search.destroyAll()
      $(@screen_name_input).val decodeURIComponent location.hash
      twapi (search_url location.hash), (result) =>
        console.log result.results
        Search.create t for t in result.results

    @before_data = @screen_name
    @before_data or= location.hash

  active: =>
    @screen_name_input.addClass("active")

  inactive: =>
    @screen_name_input.removeClass("active")

  userChange: (e) =>
    e.preventDefault()
    console.log $(@screen_name_input).val()
    console.log @before_data
    if $(@screen_name_input).val() isnt @before_data
      location.href = "/#{$(@screen_name_input).val()}"

  addSearchOne: (search) =>
    view = new Tweets(item: search)
    el = view.render().el
    @items.append(el)
    $(@items).masonry("appended", el).masonry('reload')

  addOne: (fav) =>
    view = new Tweets(item: fav)
    el = view.render().el
    @items.append(el)
    $(@items).masonry("appended", el).masonry('reload')

  moreFavs: =>
    console.log "favs"
    @page ?= 1
    @loading ?= false
    unless @loading
      console.log "bottom"
      @loading = true
      $(@loading_img).toggle()
      twapi (favs_url @screen_name, ++@page), (favs) =>
        console.log "load"
        $(@loading_img).toggle()
        if favs.length isnt 0
          Fav.create fav for fav in favs
          @loading = false
        else
          console.log @el.find(".loading_footer").text("end of favotes.")

  setSearchInformation: =>
    $(@screen_name_input).val decodeURIComponent location.hash

  setUserInformation: =>
    set_bg = (user) =>
      $("body").css
        'background-image': "url(#{user.profile_background_image_url_https})"
        'background-repeat': if user.profile_background_tile then "repeat" else "no-repeat"
        'background-color': "##{user.profile_background_color}"
        'background-attachment': "fixed"
        'background-position': "0px 92px"

    set_icon = (user) ->
      $("header").append $("<img>").attr class:"icon", src:user.profile_image_url

    $(@screen_name_input).val @screen_name
    $(".username").text "@#{@screen_name}'s favtile"
    user = User.cache @screen_name
    if user
      set_bg user
      set_icon user
    else
      twapi (lookup_url @screen_name), (users) ->
        user = users[0]
        set_bg user
        set_icon user
        user.saved_at = (new Date).getTime()
        (User.create user).save()

$ ->
  new FavtileApp(el: $("#favs"))
